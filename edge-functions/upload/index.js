import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'edgeone-pages-imgbed'

export async function onRequest(context) {
  const { request } = context

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file) {
    return new Response('No file provided', { status: 400 })
  }

  if (file.size > 512 * 1024) {
    const compressed = await compressImage(file)
    return await uploadFile(supabase, user.id, compressed)
  }

  return await uploadFile(supabase, user.id, file)
}

async function uploadFile(supabase, userId, file) {
  const filePath = `${userId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file)

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath)

  const thumbnailUrl = await generateThumbnail(supabase, bucketName, filePath, publicUrl)

  const { data: imageRecord, error: dbError } = await supabase
    .from('images')
    .insert({
      url: publicUrl,
      thumbnail: thumbnailUrl || publicUrl,
      filename: file.name,
      size: file.size,
      mime_type: file.type,
    })
    .select()
    .single()

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(imageRecord), {
    headers: { 'Content-Type': 'application/json' },
  })
}

async function compressImage(file) {
  return file
}

async function generateThumbnail(supabase, bucket, filePath, publicUrl) {
  return null
}
