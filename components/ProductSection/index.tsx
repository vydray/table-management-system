import React, { useState, useEffect } from 'react'
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
  
  // カテゴリーが変更されたらキャスト選択をリセット
  useEffect(() => {
    setLocalSelectedProduct(null)
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
    } else {
      onAddProduct(productName, productData.price, false)
    }
  }

  const handleCastSelect = (castName: string) => {
    if (localSelectedProduct) {
      onAddProduct(localSelectedProduct.name, localSelectedProduct.price, true, castName)
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
            {localSelectedProduct && localSelectedProduct.needsCast && (
              <div className="cast-highlight">
                <CastSelector
                  castList={getSortedCastList()}
                  selectedProduct={localSelectedProduct}
                  onSelectCast={handleCastSelect}
                  currentOshi={currentOshi}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .left-section {
          /* 全体のコンテナはスクロール可能 */
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .category-section-wrapper {
          /* 内容に応じて高さが変わる */
          flex: 0 0 auto;
          min-height: 100%;
        }
        
        .category-section {
          display: flex;
          gap: 10px;
          min-height: 100%;
          padding-bottom: 20px; /* 下部に余白 */
        }
        
        .category-column,
        .product-column,
        .cast-column {
          flex: 1;
          /* 個別のスクロールを無効化 */
          overflow: visible !important;
          position: relative;
          /* 内容に応じて高さが伸びる */
          height: auto !important;
          min-height: 300px;
        }
        
        /* キャスト選択を目立たせる */
        .cast-highlight {
          background-color: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 10px;
          margin-top: 10px;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
          animation: highlight 0.3s ease-out;
        }
        
        @keyframes highlight {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        /* グローバルCSSを上書き */
        :global(#modal.modal-edit) .left-section {
          overflow-y: auto !important;
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
        
        /* cast-listのスクロールも無効化 */
        :global(.cast-list) {
          max-height: none !important;
          overflow: visible !important;
          height: auto !important;
        }
        
        /* スクロールバーのスタイル（左セクション全体用） */
        .left-section::-webkit-scrollbar {
          width: 8px;
        }
        
        .left-section::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .left-section::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .left-section::-webkit-scrollbar-thumb:hover {
          background: #555;
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
        }
      `}</style>
    </div>
  )
}