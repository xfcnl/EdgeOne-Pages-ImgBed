import { useRef, useEffect, useCallback } from 'react'
import GalleryItem from './GalleryItem'

export default function GalleryGrid({ images, loading, hasMore, error, onLoadMore, onImageClick }) {
  const observerRef = useRef(null)
  const sentinelRef = useCallback(node => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore?.()
      }
    }, { rootMargin: '200px' })
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, onLoadMore])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-400 dark:text-red-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg">加载失败</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (images.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg">暂无图片</p>
        <p className="text-sm mt-1">拖拽或点击上传区域添加图片</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-4">
        {images.map(image => (
          <GalleryItem key={image.id} image={image} onClick={onImageClick} />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </>
  )
}
