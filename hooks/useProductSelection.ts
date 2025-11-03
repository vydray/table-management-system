import { useState, useEffect } from 'react'
import { ProductItem } from '../types'

interface SelectedProduct {
  name: string
  price: number
  needsCast: boolean
}

export const useProductSelection = (
  selectedCategory: string,
  selectedProduct: SelectedProduct | null,
  onAddProduct: (productName: string, price: number, needsCast: boolean, castName?: string) => void
) => {
  const [localSelectedProduct, setLocalSelectedProduct] = useState<SelectedProduct | null>(null)

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

  // キャスト選択時の処理
  const handleCastSelect = (castName: string) => {
    if (localSelectedProduct) {
      onAddProduct(localSelectedProduct.name, localSelectedProduct.price, true, castName)
    }
  }

  return {
    localSelectedProduct,
    handleProductSelect,
    handleCastSelect
  }
}
