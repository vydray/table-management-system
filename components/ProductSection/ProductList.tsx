import React from 'react'
import { ProductItem } from '../../types'

interface ProductListProps {
  products: { [productName: string]: ProductItem }
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  onSelectProduct: (productName: string, productData: ProductItem) => void
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedProduct,
  onSelectProduct
}) => {
  return (
    <div className="sub-categories">
      <div className="category-title">商品一覧</div>
      {Object.entries(products).map(([productName, productData]) => (
        <div 
          key={productName}
          className={`sub-category-item ${selectedProduct?.name === productName ? 'selected' : ''}`}
          onClick={() => onSelectProduct(productName, productData)}
        >
          {productName}
          <span className="price">¥{productData.price.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}