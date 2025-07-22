import React, { useState, useEffect, useRef } from 'react'
import { CategoryList } from './CategoryList'
import { ProductList } from './ProductList'
import { CastSelector } from './CastSelector'
import { ProductCategories, ProductItem } from '../../types'

interface ProductSectionProps {
  productCategories: ProductCategories
  selectedCategory: string
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  castList: string[]
  currentOshi?: string
  showOshiFirst?: boolean
  onSelectCategory: (category: string) => void
  onAddProduct: (productName: string, price: number, needsCast: boolean, castName?: string) => void
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  productCategories,
  selectedCategory,
  selectedProduct,
  castList,
  currentOshi,
  showOshiFirst = false,
  onSelectCategory,
  onAddProduct
}) => {
  const [localSelectedProduct, setLocalSelectedProduct] = useState<{ name: string; price: number; needsCast: boolean } | null>(null)
  const [showCastAtBottom, setShowCastAtBottom] = useState(false)
  
  // カテゴリーが変更されたらキャスト選択をリセット
  useEffect(() => {
    setLocalSelectedProduct(null)
    setShowCastAtBottom(false)
  }, [selectedCategory])
  
  // 外部からの selectedProduct の変更を反映
  useEffect(() => {
    if (selectedProduct && selectedProduct.needsCast) {
      setLocalSelectedProduct(selectedProduct)
    }
  }, [selectedProduct])

  // 商品選択時の処理
  const handleProductSelect = (productName: string, productData: ProductItem) => {
    if (productData.needsCast) {
      setLocalSelectedProduct({ name: productName, price: productData.price, needsCast: true })
      // キャスト選択を下部に表示
      setShowCastAtBottom(true)
    } else {
      onAddProduct(productName, productData.price, false)
    }
  }

  const handleCastSelect = (castName: string) => {
    if (localSelectedProduct) {
      onAddProduct(localSelectedProduct.name, localSelectedProduct.price, true, castName)
      // キャスト選択後にリセット
      setLocalSelectedProduct(null)
      setShowCastAtBottom(false)
    }
  }

  // キャストリストをソート（推し優先表示設定に基づく）
  const getSortedCastList = () => {
    if (!currentOshi || !castList.includes(currentOshi)) {
      return castList
    }

    if (showOshiFirst) {
      return [currentOshi, ...castList.filter(name => name !== currentOshi)]
    }

    return castList
  }

  return (
    <div className="left-section">
      <div className="category-section-wrapper">
        <div className="category-section">
          <div className="category-column">
            <CategoryList
              categories={Object.keys(productCategories)}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />
          </div>
          
          <div className="product-column">
            {selectedCategory && (
              <ProductList
                products={productCategories[selectedCategory]}
                selectedProduct={localSelectedProduct}
                onSelectProduct={handleProductSelect}
              />
            )}
          </div>
          
          <div className="cast-column">
            {/* キャスト選択エリアを通常表示（スクロール内） */}
            {localSelectedProduct && localSelectedProduct.needsCast && !showCastAtBottom && (
              <CastSelector
                castList={getSortedCastList()}
                selectedProduct={localSelectedProduct}
                onSelectCast={handleCastSelect}
                currentOshi={currentOshi}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* キャスト選択を下部固定表示 */}
      {showCastAtBottom && localSelectedProduct && localSelectedProduct.needsCast && (
        <div className="cast-selector-bottom">
          <CastSelector
            castList={getSortedCastList()}
            selectedProduct={localSelectedProduct}
            onSelectCast={handleCastSelect}
            currentOshi={currentOshi}
          />
        </div>
      )}
      
      <style jsx>{`
        .left-section {
          /* 全体のコンテナ */
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .category-section-wrapper {
          /* スクロール可能エリア */
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        
        .category-section {
          display: flex;
          gap: 10px;
          min-height: 100%;
          padding-bottom: 20px;
        }
        
        .category-column,
        .product-column,
        .cast-column {
          flex: 1;
          overflow: visible;
          position: relative;
          height: auto;
          min-height: 300px;
        }
        
        /* 下部固定のキャスト選択エリア */
        .cast-selector-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 2px solid #ddd;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          max-height: 40%;
          overflow-y: auto;
          z-index: 10;
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        /* グローバルCSSを上書き */
        :global(#modal.modal-edit) .left-section {
          overflow: hidden !important;
        }
        
        :global(#modal.modal-edit) .category-section {
          overflow: visible !important;
          height: auto !important;
        }
        
        :global(#modal.modal-edit) .main-categories,
        :global(#modal.modal-edit) .sub-categories,
        :global(#modal.modal-edit) .cast-select-area {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
        }
        
        :global(.cast-list) {
          max-height: none !important;
          overflow: visible !important;
          height: auto !important;
        }
        
        /* スクロールバーのスタイル */
        .category-section-wrapper::-webkit-scrollbar {
          width: 8px;
        }
        
        .category-section-wrapper::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .category-section-wrapper::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .category-section-wrapper::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* 下部キャスト選択のスクロールバー */
        .cast-selector-bottom::-webkit-scrollbar {
          width: 6px;
        }
        
        .cast-selector-bottom::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 3px;
        }
        
        /* Androidタブレット用の調整 */
        @media screen and (max-width: 1024px) {
          .category-section {
            gap: 8px;
          }
          
          .category-column,
          .product-column,
          .cast-column {
            padding: 0 5px;
          }
          
          .cast-selector-bottom {
            max-height: 50%;
          }
        }
      `}</style>
    </div>
  )
}