import React, { useState, useMemo } from 'react'

interface CastSelectorProps {
  castList: string[]
  attendingCasts: string[]
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  onSelectCast: (castName: string) => void
  currentOshi?: string
}

export const CastSelector: React.FC<CastSelectorProps> = ({
  castList,
  attendingCasts,
  selectedProduct,
  onSelectCast,
  currentOshi
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'attending'>('all')

  // フィルタリングされたキャストリスト
  const filteredCastList = useMemo(() => {
    if (filterMode === 'attending') {
      return castList.filter(cast => attendingCasts.includes(cast))
    }
    return castList
  }, [castList, attendingCasts, filterMode])

  if (!selectedProduct || !selectedProduct.needsCast) {
    return null
  }

  return (
    <div className="cast-select-area">
      <div className="category-title">キャストを選択</div>

      {/* フィルターボタン */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '15px',
            fontWeight: 'bold',
            backgroundColor: filterMode === 'all' ? '#FF9800' : 'white',
            color: filterMode === 'all' ? 'white' : '#333',
            border: '2px solid #FF9800',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          全
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('attending')}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '15px',
            fontWeight: 'bold',
            backgroundColor: filterMode === 'attending' ? '#FF9800' : 'white',
            color: filterMode === 'attending' ? 'white' : '#333',
            border: '2px solid #FF9800',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          出勤
        </button>
      </div>

      <div className="cast-list">
        {filteredCastList.map((castName, index) => (
          <div
            key={castName}
            className={`cast-item ${castName === currentOshi && index === 0 ? 'oshi-priority' : ''}`}
            onClick={() => onSelectCast(castName)}
            style={{
              ...(castName === currentOshi && index === 0 ? {
                backgroundColor: '#ffe4b5',
                border: '2px solid #ff9800',
                fontWeight: 'bold'
              } : {})
            }}
          >
            {castName}
            {castName === currentOshi && index === 0 && (
              <span style={{
                marginLeft: '8px',
                fontSize: '12px',
                color: '#ff9800'
              }}>
                ★推し
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}