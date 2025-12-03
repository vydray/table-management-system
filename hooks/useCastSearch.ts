import { useState, useEffect } from 'react'
import { Cast } from './useCastData'

export const useCastSearch = (casts: Cast[]) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all') // 'all' | '在籍' | '体験' | '退店'
  const [filteredCasts, setFilteredCasts] = useState<Cast[]>([])

  // 検索・フィルター処理
  useEffect(() => {
    const filtered = casts.filter(cast => {
      // ステータスフィルター
      if (statusFilter !== 'all' && cast.status !== statusFilter) {
        return false
      }

      // テキスト検索
      const name = cast.name || ''
      const position = cast.attributes || ''
      const status = cast.status || ''
      const searchLower = searchTerm.toLowerCase()

      return name.toLowerCase().includes(searchLower) ||
             position.toLowerCase().includes(searchLower) ||
             status.toLowerCase().includes(searchLower)
    })
    setFilteredCasts(filtered)
  }, [casts, searchTerm, statusFilter])

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredCasts
  }
}
