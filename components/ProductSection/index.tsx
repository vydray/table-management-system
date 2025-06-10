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
  // ローカルで選択中の商品を管理
  const [localSelectedProduct, setLocalSelectedProduct] = useState<{ name: string; price: number; needsCast: boolean } | null>(null)
  
  // カテゴリーが変更されたらキャスト選択をリセット
  useEffect(() => {
    // カテゴリーが変更された時にキャスト選択をクリア
    setLocalSelectedProduct(null)
  }, [selectedCategory])
  
  // 外部からの selectedProduct の変更を反映
  useEffect(() => {
    if (selectedProduct && selectedProduct.needsCast) {
      setLocalSelectedProduct(selectedProduct)
    }
  }, [selectedProduct])
  
  const handleProductSelect = (productName: string, productData: ProductItem) => {
    if (productData.needsCast) {
      // キャストが必要な商品を選択したらローカルに保持
      setLocalSelectedProduct({ name: productName, price: productData.price, needsCast: true })
    } else {
      // キャストが不要な商品は直接追加
      onAddProduct(productName, productData.price, false)
    }
  }

  const handleCastSelect = (castName: string) => {
    if (localSelectedProduct) {
      onAddProduct(localSelectedProduct.name, localSelectedProduct.price, true, castName)
      // キャストを選択したら状態を維持（同じカテゴリー内なら残す）
    }
  }

  // キャストリストをソート（カテゴリーの設定に基づいて推し優先表示）
  const getSortedCastList = () => {
    if (!currentOshi || !castList.includes(currentOshi)) {
      return castList
    }

    // 現在のカテゴリーの設定を確認
    const currentCategoryData = selectedCategory && productCategories[selectedCategory]
    const shouldShowOshiFirst = currentCategoryData && Object.values(currentCategoryData).some(
      product => product.showOshiFirst
    )

    if (shouldShowOshiFirst) {
      // 推しを先頭に、残りはそのまま
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
        <CategoryList
          categories={Object.keys(productCategories)}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
        
        {selectedCategory && (
          <ProductList
            products={productCategories[selectedCategory]}
            selectedProduct={localSelectedProduct}
            onSelectProduct={handleProductSelect}
          />
        )}
        
        <CastSelector
          castList={getSortedCastList()}
          selectedProduct={localSelectedProduct}
          onSelectCast={handleCastSelect}
          currentOshi={currentOshi}
        />
      </div>
    </div>
  )
}