import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlbums } from '../../hooks/useAlbums'

const LINK_FORMATS = [
  { label: 'Direct URL', get: (url) => url },
  { label: 'Markdown', get: (url, name) => `![${name}](${url})` },
  { label: 'HTML', get: (url, name) => `<img src="${url}" alt="${name}" />` },
  { label: 'BBCode', get: (url) => `[img]${url}[/img]` },
  { label: 'Wikitext', get: (url, name) => `[[File:${name}]]` },
]

export default function ImageDetail({ image, onClose, onDelete, onAddToAlbum }) {
  const { albums } = useAlbums()
  const [showAlbumPicker, setShowAlbumPicker] = useState(false)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const filename = image.url.split('/').pop()
      const { error: storageError } = await supabase.storage.from('edgeone-pages-imgbed').remove([filename])
      if (storageError) throw storageError
      const { error: dbError } = await supabase.from('images').delete().eq('id', image.id)
      if (dbError) throw dbError
      onDelete?.(image.id)
    } catch (err) {
      alert(`删除失败: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyLink = async (format) => {
    const text = format.get(image.url, image.filename)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => { setCopied(false); setShowLinkPicker(false) }, 1200)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl max-h-[90vh] mx-4 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={() => setShowAlbumPicker(true)}
            className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="添加到相簿"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setShowLinkPicker(true)}
            className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="复制链接"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <img
          src={image.url}
          alt={image.filename}
          className="max-w-full max-h-[70vh] object-contain"
        />

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {image.filename}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(image.created_at).toLocaleString('zh-CN')}
                {image.size && ` · ${(image.size / 1024).toFixed(1)} KB`}
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-4 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>

      </div>

      {showAlbumPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
          onClick={() => setShowAlbumPicker(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-80 max-h-[60vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">添加到相簿</h3>
              <button
                onClick={() => setShowAlbumPicker(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {albums.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">暂无相簿，请在侧边栏创建</p>
              ) : (
                albums.map(album => (
                  <button
                    key={album.id}
                    onClick={() => {
                      onAddToAlbum?.(album.id)
                      setShowAlbumPicker(false)
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {album.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showLinkPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
          onClick={() => { setShowLinkPicker(false); setCopied(false) }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-80 max-h-[60vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {copied ? '已复制到剪贴板!' : '复制链接'}
              </h3>
              <button
                onClick={() => { setShowLinkPicker(false); setCopied(false) }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {LINK_FORMATS.map(fmt => (
                <button
                  key={fmt.label}
                  onClick={() => handleCopyLink(fmt)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
