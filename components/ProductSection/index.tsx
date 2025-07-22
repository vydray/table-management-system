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
  
  // 選択されたカテゴリーのインデックスを取得
  const getCategoryOffset = () => {
    const categories = Object.keys(productCategories)
    const index = categories.indexOf(selectedCategory)
    // カテゴリータイトル（40px）+ アイテムの高さ（50px）× インデックス
    return index >= 0 ? 40 + (index * 50) : 0
  }
  
  // 選択された商品のインデックスを取得
  const getProductOffset = () => {
    if (!selectedCategory || !localSelectedProduct) return 0
    
    const products = Object.keys(productCategories[selectedCategory])
    const index = products.findIndex(name => name === localSelectedProduct.name)
    // カテゴリーのオフセット + 商品タイトル（40px）+ アイテムの高さ（50px）× インデックス
    return index >= 0 ? getCategoryOffset() + 40 + (index * 50) : getCategoryOffset()
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
        <div className="category-column">
          <CategoryList
            categories={Object.keys(productCategories)}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </div>
        
        <div className="product-column">
          {selectedCategory && (
            <div style={{ 
              marginTop: `${getCategoryOffset()}px`,
              transition: 'margin-top 0.3s ease'
            }}>
              <ProductList
                products={productCategories[selectedCategory]}
                selectedProduct={localSelectedProduct}
                onSelectProduct={handleProductSelect}
              />
            </div>
          )}
        </div>
        
        <div className="cast-column">
          {localSelectedProduct && localSelectedProduct.needsCast && (
            <div style={{ 
              marginTop: `${getProductOffset()}px`,
              transition: 'margin-top 0.3s ease'
            }}>
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
      
      <style jsx>{`
        .category-section {
          display: flex;
          gap: 10px;
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        .category-column,
        .product-column,
        .cast-column {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }
        
        /* 各カラムの最小高さを確保 */
        .category-column {
          min-height: 100%;
        }
        
        .product-column,
        .cast-column {
          min-height: 100%;
          /* スクロールバーを常に表示（位置確認のため） */
          overflow-y: scroll;
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
          
          /* タブレットではスクロールバーを自動に */
          .product-column,
          .cast-column {
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  )
}