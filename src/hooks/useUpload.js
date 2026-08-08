import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const MAX_FILES = 20
const MAX_FILE_SIZE = 512 * 1024

export function useUpload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const validateFiles = useCallback((fileList) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
    const validFiles = []
    const oversized = []

    for (let i = 0; i < Math.min(fileList.length, MAX_FILES); i++) {
      const file = fileList[i]
      if (!allowed.includes(file.type)) continue
      if (file.size > MAX_FILE_SIZE) {
        oversized.push(file.name)
        continue
      }
      validFiles.push(file)
    }

    if (oversized.length > 0) {
      setError(`${oversized.length} 个文件超过 512KB 限制（${oversized[0]}${oversized.length > 1 ? ' 等' : ''}），已跳过`)
    }

    return validFiles.slice(0, MAX_FILES)
  }, [])

  const checkFileLimit = useCallback(async (userId, fileCount) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('max_files')
      .eq('id', userId)
      .single()
    if (error || !profile?.max_files) return null
    const { count, error: countError } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (countError) return null
    if (count >= profile.max_files) return `已达到文件上传上限（${profile.max_files} 个）`
    if (count + fileCount > profile.max_files) return `超出文件上限（${count}/${profile.max_files}），最多还能上传 ${profile.max_files - count} 个`
    return null
  }, [])

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return []
    setUploading(true)
    setProgress(0)
    setError('')

    const uploaded = []
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      setError('未登录或会话已过期')
      setUploading(false)
      return []
    }
    const user = session.user

    const limitError = await checkFileLimit(user.id, files.length)
    if (limitError) {
      setError(limitError)
      setUploading(false)
      return []
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" 超过 512KB 限制`)
        continue
      }
      const extMatch = /\.([a-zA-Z0-9]{1,10})$/.exec(file.name)
      const safeExt = extMatch ? `.${extMatch[1].toLowerCase()}` : ''
      const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from('edgeone-pages-imgbed')
        .upload(filePath, file, { upsert: false })

      if (uploadError) {
        setError(`上传失败: ${uploadError.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('edgeone-pages-imgbed')
        .getPublicUrl(filePath)

      const { data: imageRecord, error: dbError } = await supabase
        .from('images')
        .insert({
          user_id: user.id,
          url: publicUrl,
          filename: file.name,
          size: file.size,
          mime_type: file.type,
        })
        .select()
        .single()

      if (dbError) {
        setError(`数据库保存失败: ${dbError.message}`)
        continue
      }

      uploaded.push(imageRecord)
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    setUploading(false)
    setFiles([])
    setProgress(0)
    return uploaded
  }, [files, checkFileLimit])

  const setFilesFromInput = useCallback((fileList) => {
    setError('')
    setFiles(validateFiles(fileList))
  }, [validateFiles])

  const clearFiles = useCallback(() => {
    setFiles([])
    setError('')
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return { files, uploading, progress, error, setFilesFromInput, clearFiles, clearError, uploadFiles, checkFileLimit }
}
