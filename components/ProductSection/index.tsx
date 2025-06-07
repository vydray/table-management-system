import React from 'react'
import { CategoryList } from './CategoryList'
import { ProductList } from './ProductList'
import { CastSelector } from './CastSelector'
import { ProductCategories, ProductItem } from '../../types'  // ProductItemをインポート

interface ProductSectionProps {
  productCategories: ProductCategories
  selectedCategory: string
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  castList: string[]
  onSelectCategory: (category: string) => void
  onAddProduct: (productName: string, price: number, needsCast: boolean, castName?: string) => void
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  productCategories,
  selectedCategory,
  selectedProduct,
  castList,
  onSelectCategory,
  onAddProduct
}) => {
  // ProductItem型を使用
  const handleProductSelect = (productName: string, productData: ProductItem) => {
    onAddProduct(productName, productData.price, productData.needsCast)
  }

  const handleCastSelect = (castName: string) => {
    if (selectedProduct) {
      onAddProduct(selectedProduct.name, selectedProduct.price, true, castName)
    }
  }

  return (
    <div className="left-section">
      <div className="category-section">
        <CategoryList
          categories={Object.keys(productCategories)}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
        
        {selectedCategory && (
          <ProductList
            products={productCategories[selectedCategory]}
            selectedProduct={selectedProduct}
            onSelectProduct={handleProductSelect}
          />
        )}
        
        <CastSelector
          castList={castList}
          selectedProduct={selectedProduct}
          onSelectCast={handleCastSelect}
        />
      </div>
    </div>
  )
}