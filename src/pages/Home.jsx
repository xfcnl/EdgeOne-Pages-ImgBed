import { useState } from 'react'
import { useImages } from '../hooks/useImages'
import { useUpload } from '../hooks/useUpload'
import { useAlbums } from '../hooks/useAlbums'
import GalleryGrid from '../components/Gallery/GalleryGrid'
import UploadZone from '../components/Upload/UploadZone'
import ImageDetail from '../components/Gallery/ImageDetail'

export default function Home() {
  const { images, loading, hasMore, error, loadMore, addImage, removeImage } = useImages('all')
  const upload = useUpload()
  const { addImageToAlbum } = useAlbums()
  const [selectedImage, setSelectedImage] = useState(null)

  const handleUpload = async () => {
    const uploaded = await upload.uploadFiles()
    uploaded.forEach(img => addImage(img))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <GalleryGrid
          images={images}
          loading={loading}
          hasMore={hasMore}
          error={error}
          onLoadMore={loadMore}
          onImageClick={setSelectedImage}
        />
      </div>

      <UploadZone
        files={upload.files}
        uploading={upload.uploading}
        progress={upload.progress}
        error={upload.error}
        onFilesChange={upload.setFilesFromInput}
        onUpload={handleUpload}
        onClear={upload.clearFiles}
        onClearError={upload.clearError}
      />

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
