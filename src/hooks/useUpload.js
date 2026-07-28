import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const MAX_FILES = 20

export function useUpload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const validateFiles = useCallback((fileList) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
    const validFiles = []

    for (let i = 0; i < Math.min(fileList.length, MAX_FILES); i++) {
      const file = fileList[i]
      if (allowed.includes(file.type)) {
        validFiles.push(file)
      }
    }

    return validFiles.slice(0, MAX_FILES)
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filePath = `${user.id}/${Date.now()}-${file.name}`

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
  }, [files])

  const setFilesFromInput = useCallback((fileList) => {
    setError('')
    setFiles(validateFiles(fileList))
  }, [validateFiles])

  const clearFiles = useCallback(() => {
    setFiles([])
    setError('')
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return { files, uploading, progress, error, setFilesFromInput, clearFiles, clearError, uploadFiles }
}
