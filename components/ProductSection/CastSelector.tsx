import React from 'react'

interface CastSelectorProps {
  castList: string[]
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  onSelectCast: (castName: string) => void
  currentOshi?: string
}

export const CastSelector: React.FC<CastSelectorProps> = ({
  castList,
  selectedProduct,
  onSelectCast,
  currentOshi
}) => {
  if (!selectedProduct || !selectedProduct.needsCast) {
    return null
  }

  return (
    <div className="cast-select-area">
      <div className="category-title">キャストを選択</div>
      <div className="cast-list">
        {castList.map((castName, index) => (
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