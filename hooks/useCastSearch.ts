import { useState, useEffect } from 'react'
import { Cast } from './useCastData'

export const useCastSearch = (casts: Cast[]) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCasts, setFilteredCasts] = useState<Cast[]>([])

  // 検索処理
  useEffect(() => {
    const filtered = casts.filter(cast => {
      const name = cast.name || ''
      const position = cast.attributes || ''
      const status = cast.status || ''
      const searchLower = searchTerm.toLowerCase()

      return name.toLowerCase().includes(searchLower) ||
             position.toLowerCase().includes(searchLower) ||
             status.toLowerCase().includes(searchLower)
    })
    setFilteredCasts(filtered)
  }, [casts, searchTerm])

  return {
    searchTerm,
    setSearchTerm,
    filteredCasts
  }
}
