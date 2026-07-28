import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 30

export function useImages(filter = 'all') {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')

  const fetchImages = useCallback(async (pageNum = 0, append = false) => {
    setLoading(true)
    setError('')

    let query = supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (filter === 'recent') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query = query.gte('created_at', sevenDaysAgo.toISOString())
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      if (append) {
        setImages(prev => [...prev, ...data])
      } else {
        setImages(data)
      }
      setHasMore(data && data.length === PAGE_SIZE)
    }

    setLoading(false)
    return { data, error }
  }, [filter])

  useEffect(() => {
    setImages([])
    setPage(0)
    setHasMore(true)
    fetchImages(0)
  }, [fetchImages])

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchImages(nextPage, true)
  }, [page, fetchImages])

  const addImage = useCallback((image) => {
    setImages(prev => [image, ...prev])
  }, [])

  const removeImage = useCallback((id) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }, [])

  return { images, loading, hasMore, error, loadMore, addImage, removeImage }
}
