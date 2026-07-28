import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAlbums() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAlbums = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setAlbums(data)
    setLoading(false)
    return { data, error }
  }, [])

  useEffect(() => { fetchAlbums() }, [fetchAlbums])

  const createAlbum = useCallback(async (name, description = '') => {
    const { data, error } = await supabase
      .from('albums')
      .insert({ name, description })
      .select()
      .single()

    if (!error) setAlbums(prev => [data, ...prev])
    return { data, error }
  }, [])

  const updateAlbum = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('albums')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      setAlbums(prev => prev.map(a => a.id === id ? data : a))
    }
    return { data, error }
  }, [])

  const deleteAlbum = useCallback(async (id) => {
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id)

    if (!error) setAlbums(prev => prev.filter(a => a.id !== id))
    return { error }
  }, [])

  const addImageToAlbum = useCallback(async (albumId, imageId) => {
    const { data, error } = await supabase
      .from('album_images')
      .insert({ album_id: albumId, image_id: imageId })
      .select()

    return { data, error }
  }, [])

  const removeImageFromAlbum = useCallback(async (albumId, imageId) => {
    const { error } = await supabase
      .from('album_images')
      .delete()
      .eq('album_id', albumId)
      .eq('image_id', imageId)

    return { error }
  }, [])

  return {
    albums, loading, fetchAlbums,
    createAlbum, updateAlbum, deleteAlbum,
    addImageToAlbum, removeImageFromAlbum,
  }
}
