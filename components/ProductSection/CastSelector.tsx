import React, { useState, useMemo, useEffect } from 'react'

interface CastSelectorProps {
  castList: string[]
  attendingCasts: string[]
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  onSelectCast: (castName: string[]) => void
  onCancel?: () => void
  currentOshi?: string[]
  allowMultipleCasts?: boolean
}

export const CastSelector: React.FC<CastSelectorProps> = ({
  castList,
  attendingCasts,
  selectedProduct,
  onSelectCast,
  onCancel,
  currentOshi,
  allowMultipleCasts = false
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'attending'>('all')
  const [selectedCasts, setSelectedCasts] = useState<string[]>([])

  // 商品が変わったら選択をリセット
  useEffect(() => {
    setSelectedCasts([])
  }, [selectedProduct])

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

  const handleCastClick = (castName: string) => {
    if (allowMultipleCasts) {
      // 複数選択モード: トグル
      if (selectedCasts.includes(castName)) {
        setSelectedCasts(selectedCasts.filter(c => c !== castName))
      } else {
        setSelectedCasts([...selectedCasts, castName])
      }
    } else {
      // 単一選択モード: 即座に確定
      onSelectCast([castName])
    }
  }

  const handleConfirm = () => {
    if (selectedCasts.length > 0) {
      onSelectCast(selectedCasts)
    }
  }

  return (
    <div className="cast-select-area">
      <div className="category-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>キャストを選択</span>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            キャンセル
          </button>
        )}
      </div>

      {/* 選択中の商品名 */}
      <div style={{
        padding: '8px 12px',
        marginBottom: '12px',
        backgroundColor: '#fff3e0',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        商品: {selectedProduct.name}
      </div>

      {/* 複数選択モード時: 選択中のキャスト表示 */}
      {allowMultipleCasts && selectedCasts.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px'
        }}>
          {selectedCasts.map(cast => (
            <div
              key={cast}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: '#007AFF',
                color: 'white',
                borderRadius: '12px',
                fontSize: '13px'
              }}
            >
              {cast}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedCasts(selectedCasts.filter(c => c !== cast))
                }}
                style={{
                  background: 'rgba(255,255,255,0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                  color: 'white',
                  padding: 0
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

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
        {filteredCastList.map((castName) => {
          const isOshi = currentOshi?.includes(castName) ?? false
          const isSelected = selectedCasts.includes(castName)
          return (
          <div
            key={castName}
            className={`cast-item ${isOshi ? 'oshi-priority' : ''}`}
            onClick={() => handleCastClick(castName)}
            style={{
              ...(isOshi ? {
                backgroundColor: isSelected ? '#4CAF50' : '#ffe4b5',
                border: '2px solid #ff9800',
                fontWeight: 'bold'
              } : isSelected ? {
                backgroundColor: '#4CAF50',
                color: 'white',
                fontWeight: 'bold'
              } : {})
            }}
          >
            {allowMultipleCasts && isSelected && '✓ '}
            {castName}
            {isOshi && (
              <span style={{
                marginLeft: '8px',
                fontSize: '12px',
                color: isSelected ? 'white' : '#ff9800'
              }}>
                ★推し
              </span>
            )}
          </div>
          )
        })}
      </div>

      {/* 複数選択モード時: 確定ボタン */}
      {allowMultipleCasts && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCasts.length === 0}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: selectedCasts.length > 0 ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedCasts.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            決定 ({selectedCasts.length}人選択)
          </button>
        </div>
      )}
    </div>
  )
}
