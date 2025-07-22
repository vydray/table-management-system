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
  
  // キャスト選択カラムのrefを作成
  const castColumnRef = useRef<HTMLDivElement>(null)
  
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

  // 商品選択時にキャスト選択の位置を調整
  const handleProductSelect = (productName: string, productData: ProductItem) => {
    if (productData.needsCast) {
      setLocalSelectedProduct({ name: productName, price: productData.price, needsCast: true })
      
      // キャスト選択エリアを一番上にスクロール
      setTimeout(() => {
        if (castColumnRef.current) {
          castColumnRef.current.scrollTop = 0
        }
      }, 0)
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
        
        <div className="cast-column" ref={castColumnRef}>
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
          /* グローバルCSSのスクロール設定を上書き */
          overflow: hidden !important;
        }
        
        .category-section {
          display: flex;
          gap: 10px;
          flex: 1;
          position: relative;
          overflow: hidden;
          /* グローバルCSSの高さ設定を上書き */
          height: 100% !important;
          min-height: auto !important;
        }
        
        .category-column,
        .product-column,
        .cast-column {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          position: relative;
          /* グローバルCSSのmax-heightを上書き */
          max-height: 100% !important;
          height: 100% !important;
          min-height: auto !important;
        }
        
        /* スクロールバーのスタイル */
        .category-column::-webkit-scrollbar,
        .product-column::-webkit-scrollbar,
        .cast-column::-webkit-scrollbar {
          width: 6px;
        }
        
        .category-column::-webkit-scrollbar-track,
        .product-column::-webkit-scrollbar-track,
        .cast-column::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .category-column::-webkit-scrollbar-thumb,
        .product-column::-webkit-scrollbar-thumb,
        .cast-column::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .category-column::-webkit-scrollbar-thumb:hover,
        .product-column::-webkit-scrollbar-thumb:hover,
        .cast-column::-webkit-scrollbar-thumb:hover {
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