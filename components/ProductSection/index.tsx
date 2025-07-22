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
  
  const mainCategoriesRef = useRef<HTMLDivElement>(null)
  const subCategoriesRef = useRef<HTMLDivElement>(null)
  const castSelectorRef = useRef<HTMLDivElement>(null)
  
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
  
  // カテゴリー選択時のスクロール調整
  useEffect(() => {
    if (selectedCategory && mainCategoriesRef.current && subCategoriesRef.current) {
      // 選択されたカテゴリー要素を探す
      const selectedElement = mainCategoriesRef.current.querySelector('.main-category-item.selected')
      
      if (selectedElement) {
        const elementRect = selectedElement.getBoundingClientRect()
        const containerRect = mainCategoriesRef.current.getBoundingClientRect()
        const relativeTop = elementRect.top - containerRect.top + mainCategoriesRef.current.scrollTop
        
        // 商品リストのスクロール位置を調整
        subCategoriesRef.current.scrollTop = relativeTop - 50
      }
    }
  }, [selectedCategory])
  
  // 商品選択時のスクロール調整
  useEffect(() => {
    if (localSelectedProduct && localSelectedProduct.needsCast && subCategoriesRef.current && castSelectorRef.current) {
      // 選択された商品要素を探す
      const selectedElement = subCategoriesRef.current.querySelector('.sub-category-item.selected')
      
      if (selectedElement) {
        const elementRect = selectedElement.getBoundingClientRect()
        const containerRect = subCategoriesRef.current.getBoundingClientRect()
        const relativeTop = elementRect.top - containerRect.top + subCategoriesRef.current.scrollTop
        
        // キャスト選択エリアのスクロール位置を調整
        castSelectorRef.current.scrollTop = relativeTop - 50
      }
    }
  }, [localSelectedProduct])

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
      <div className="search-section">
        <input
          type="text"
          placeholder="商品検索..."
          className="search-input"
        />
        <button className="search-button">検索</button>
      </div>
      
      <div className="category-section">
        <div ref={mainCategoriesRef} className="main-categories-wrapper">
          <CategoryList
            categories={Object.keys(productCategories)}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </div>
        
        <div ref={subCategoriesRef} className="sub-categories-wrapper">
          {selectedCategory && (
            <ProductList
              products={productCategories[selectedCategory]}
              selectedProduct={localSelectedProduct}
              onSelectProduct={handleProductSelect}
            />
          )}
        </div>
        
        <div ref={castSelectorRef} className="cast-selector-wrapper">
          <CastSelector
            castList={getSortedCastList()}
            selectedProduct={localSelectedProduct}
            onSelectCast={handleCastSelect}
            currentOshi={currentOshi}
          />
        </div>
      </div>
      
      <style jsx>{`
        .main-categories-wrapper,
        .sub-categories-wrapper,
        .cast-selector-wrapper {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          position: relative;
        }
        
        /* Androidタブレット用の追加スタイル */
        @media screen and (max-width: 1024px) {
          .category-section {
            display: flex;
            gap: 10px;
            flex: 1;
            position: relative;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  )
}