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
            <CastSelector
              castList={getSortedCastList()}
              selectedProduct={localSelectedProduct}
              onSelectCast={handleCastSelect}
              currentOshi={currentOshi}
            />
          )}
        </div>
      </div>
      
      <style jsx>{`
        .left-section {
          /* 全体のスクロールを無効化 */
          overflow: hidden !important;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .category-section {
          display: flex;
          gap: 10px;
          flex: 1;
          overflow: hidden;
        }
        
        .category-column,
        .product-column,
        .cast-column {
          flex: 1;
          /* 各カラムで独立したスクロール */
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          height: 100%;
        }
        
        /* グローバルCSSを上書き - 各カラムのスクロールを有効化 */
        :global(#modal.modal-edit) .left-section {
          overflow: hidden !important;
        }
        
        :global(#modal.modal-edit) .category-section {
          overflow: hidden !important;
          height: 100% !important;
        }
        
        :global(#modal.modal-edit) .main-categories,
        :global(#modal.modal-edit) .sub-categories,
        :global(#modal.modal-edit) .cast-select-area {
          overflow-y: auto !important;
          height: 100% !important;
          max-height: 100% !important;
        }
        
        /* cast-listのスクロールを有効化 */
        :global(.cast-list) {
          max-height: calc(100% - 40px) !important; /* タイトル分を引く */
          overflow-y: auto !important;
          height: auto !important;
        }
        
        /* スクロールバーのスタイル */
        .category-column::-webkit-scrollbar,
        .product-column::-webkit-scrollbar,
        .cast-column::-webkit-scrollbar,
        :global(.cast-list)::-webkit-scrollbar {
          width: 6px;
        }
        
        .category-column::-webkit-scrollbar-track,
        .product-column::-webkit-scrollbar-track,
        .cast-column::-webkit-scrollbar-track,
        :global(.cast-list)::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .category-column::-webkit-scrollbar-thumb,
        .product-column::-webkit-scrollbar-thumb,
        .cast-column::-webkit-scrollbar-thumb,
        :global(.cast-list)::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .category-column::-webkit-scrollbar-thumb:hover,
        .product-column::-webkit-scrollbar-thumb:hover,
        .cast-column::-webkit-scrollbar-thumb:hover,
        :global(.cast-list)::-webkit-scrollbar-thumb:hover {
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