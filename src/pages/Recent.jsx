import { useState } from 'react'
import { useImages } from '../hooks/useImages'
import { useAlbums } from '../hooks/useAlbums'
import GalleryGrid from '../components/Gallery/GalleryGrid'
import ImageDetail from '../components/Gallery/ImageDetail'

export default function Recent() {
  const { images, loading, hasMore, error, loadMore, removeImage } = useImages('recent')
  const { addImageToAlbum } = useAlbums()
  const [selectedImage, setSelectedImage] = useState(null)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">近期上传</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">过去 7 天内上传的图片</p>
        </div>

        <GalleryGrid
          images={images}
          loading={loading}
          hasMore={hasMore}
          error={error}
          onLoadMore={loadMore}
          onImageClick={setSelectedImage}
        />
      </div>

      {selectedImage && (
        <ImageDetail
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={(id) => {
            removeImage(id)
            setSelectedImage(null)
          }}
          onAddToAlbum={(albumId) => {
            addImageToAlbum(albumId, selectedImage.id)
          }}
        />
      )}
    </div>
  )
}
