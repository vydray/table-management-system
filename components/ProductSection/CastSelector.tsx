import React from 'react'

interface CastSelectorProps {
  castList: string[]
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  onSelectCast: (castName: string) => void
}

export const CastSelector: React.FC<CastSelectorProps> = ({
  castList,
  selectedProduct,
  onSelectCast
}) => {
  if (!selectedProduct || !selectedProduct.needsCast) {
    return null
  }

  return (
    <div className="cast-select-area">
      <div className="category-title">キャストを選択</div>
      <div className="cast-list">
        {castList.map(castName => (
          <div 
            key={castName}
            className="cast-item"
            onClick={() => onSelectCast(castName)}
          >
            {castName}
          </div>
        ))}
      </div>
    </div>
  )
}