import React from 'react'
import { CategoryList } from './CategoryList'
import { ProductList } from './ProductList'
import { CastSelector } from './CastSelector'
import { ProductCategories } from '../../types'
import { useProductSelection } from '../../hooks/useProductSelection'
import { useCastListSort } from '../../hooks/useCastListSort'

interface ProductSectionProps {
  productCategories: ProductCategories
  selectedCategory: string
  selectedProduct: { name: string; price: number; needsCast: boolean } | null
  castList: string[]
  attendingCasts: string[]
  currentOshi?: string[]
  showOshiFirst?: boolean
  onSelectCategory: (category: string) => void
  onAddProduct: (productName: string, price: number, needsCast: boolean, castName?: string) => void
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  productCategories,
  selectedCategory,
  selectedProduct,
  castList,
  attendingCasts,
  currentOshi,
  showOshiFirst = false,
  onSelectCategory,
  onAddProduct
}) => {
  const {
    localSelectedProduct,
    handleProductSelect,
    handleCastSelect
  } = useProductSelection(selectedCategory, selectedProduct, onAddProduct)

  const { sortedCastList } = useCastListSort(castList, currentOshi, showOshiFirst)

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
              castList={sortedCastList}
              attendingCasts={attendingCasts}
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
        
        /* スクロールバーを非表示 */
        .category-column,
        .product-column,
        .cast-column,
        :global(.cast-list) {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }

        .category-column::-webkit-scrollbar,
        .product-column::-webkit-scrollbar,
        .cast-column::-webkit-scrollbar,
        :global(.cast-list)::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
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