import { useState, useEffect, useMemo } from 'react'
import { Cast } from './useCastData'

export const useCastSearch = (casts: Cast[]) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [posFilter, setPosFilter] = useState<string>('all') // 'all' | 'on' | 'off'
  const [filteredCasts, setFilteredCasts] = useState<Cast[]>([])

  // 役職一覧を取得
  const positionOptions = useMemo(() => {
    const positions = new Set<string>()
    casts.forEach(cast => {
      if (cast.attributes) positions.add(cast.attributes)
    })
    return Array.from(positions).sort()
  }, [casts])

  // 検索・フィルター処理
  useEffect(() => {
    const filtered = casts.filter(cast => {
      // ステータスフィルター
      if (statusFilter !== 'all' && cast.status !== statusFilter) {
        return false
      }

      // 役職フィルター
      if (positionFilter !== 'all') {
        if (positionFilter === 'none' && cast.attributes) return false
        if (positionFilter !== 'none' && cast.attributes !== positionFilter) return false
      }

      // POS表示フィルター
      if (posFilter !== 'all') {
        if (posFilter === 'on' && !cast.show_in_pos) return false
        if (posFilter === 'off' && cast.show_in_pos) return false
      }

      // テキスト検索
      const name = cast.name || ''
      const position = cast.attributes || ''
      const searchLower = searchTerm.toLowerCase()

      return name.toLowerCase().includes(searchLower) ||
             position.toLowerCase().includes(searchLower)
    })
    setFilteredCasts(filtered)
  }, [casts, searchTerm, statusFilter, positionFilter, posFilter])

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    positionFilter,
    setPositionFilter,
    posFilter,
    setPosFilter,
    positionOptions,
    filteredCasts
  }
}
