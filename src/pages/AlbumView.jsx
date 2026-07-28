import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAlbums } from '../hooks/useAlbums'
import GalleryGrid from '../components/Gallery/GalleryGrid'
import ImageDetail from '../components/Gallery/ImageDetail'

export default function AlbumView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { albums, deleteAlbum } = useAlbums()
  const album = albums.find(a => a.id === id)

  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  const fetchAlbumImages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('album_images')
      .select('images(*)')
      .eq('album_id', id)
      .order('added_at', { ascending: false })

    if (!error) {
      setImages(data.map(item => item.images))
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAlbumImages() }, [fetchAlbumImages])

  const handleDelete = async () => {
    await deleteAlbum(id)
    navigate('/', { replace: true })
  }

  if (!album) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        相簿不存在
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{album.name}</h2>
            {album.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{album.description}</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
          >
            删除相簿
          </button>
        </div>

        <GalleryGrid
          images={images}
          loading={loading}
          hasMore={false}
          onImageClick={setSelectedImage}
        />
      </div>

      {selectedImage && (
        <ImageDetail
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={() => {
            setImages(prev => prev.filter(img => img.id !== selectedImage.id))
            setSelectedImage(null)
          }}
        />
      )}
    </div>
  )
}
