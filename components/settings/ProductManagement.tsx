import { useEffect, useMemo } from 'react'
import { useProductData } from '../../hooks/useProductData'
import { useProductCategory } from '../../hooks/useProductCategory'
import { useProductModal } from '../../hooks/useProductModal'
import { useProductHandlers } from '../../hooks/useProductHandlers'

export default function ProductManagement() {
  // フックを使用
  const {
    products,
    loadProducts,
    addProduct: addProductData,
    updateProduct: updateProductData,
    deleteProduct: deleteProductData,
    toggleCast,
    toggleActive
  } = useProductData()

  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    loadCategories
  } = useProductCategory()

  const {
    showEditModal,
    editingProduct,
    newProductName,
    setNewProductName,
    newProductPrice,
    setNewProductPrice,
    newProductCategory,
    setNewProductCategory,
    newProductNeedsCast,
    setNewProductNeedsCast,
    openEditModal,
    closeModal
  } = useProductModal()

  const {
    addProduct,
    updateProduct
  } = useProductHandlers(
    addProductData,
    updateProductData,
    setNewProductName,
    setNewProductPrice,
    setNewProductCategory,
    setNewProductNeedsCast,
    closeModal
  )

  useEffect(() => {
    loadCategories()
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // フィルタリングされた商品リスト
  const filteredProducts = useMemo(() => {
    return selectedCategory
      ? products.filter(p => p.category_id === selectedCategory)
      : products
  }, [selectedCategory, products])

  return (
  <div style={{ 
    height: '100%',
    overflowY: 'auto',
    paddingBottom: '100px', // 下部に余裕を持たせる
    WebkitOverflowScrolling: 'touch', // iOSスムーズスクロール
    msOverflowStyle: '-ms-autohiding-scrollbar', // IE/Edge
    position: 'relative' // Androidでの位置固定問題対策
  }}>
    <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>商品管理</h2>

      {/* 新規商品追加セクション */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '5px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
          新規商品追加
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            カテゴリー *
          </label>
          <select
            value={newProductCategory || ''}
            onChange={(e) => setNewProductCategory(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              backgroundColor: 'white'
            }}
          >
            <option value="">-- カテゴリーを選択 --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            商品名 *
          </label>
          <input
            type="text"
            inputMode="text"
              lang="ja"
            placeholder="商品名"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            価格 *
          </label>
          <input
            type="number"
            placeholder="0"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            style={{
              width: '200px',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newProductNeedsCast}
              onChange={(e) => setNewProductNeedsCast(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>キャスト必要</span>
          </label>
        </div>

        <button
          onClick={() => addProduct(newProductName, newProductPrice, newProductCategory, newProductNeedsCast)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          商品を追加
        </button>
      </div>

      {/* 商品一覧 */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>商品一覧</h3>
          <button
            style={{
              padding: '5px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ↑ 並び替え
          </button>

          {/* カテゴリー選択 */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              backgroundColor: 'white',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            <option value="">-- 全て表示 --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* テーブルヘッダー */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 80px 80px 120px',
          padding: '10px 20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px 5px 0 0',
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>商品名</div>
          <div style={{ textAlign: 'right' }}>価格</div>
          <div style={{ textAlign: 'center' }}>キャスト</div>
          <div style={{ textAlign: 'center' }}>表示</div>
          <div style={{ textAlign: 'center' }}>操作</div>
        </div>

        {/* 商品リスト */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '0 0 5px 5px'
        }}>
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 80px 80px 120px',
                padding: '15px 20px',
                borderBottom: index < filteredProducts.length - 1 ? '1px solid #e0e0e0' : 'none',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '16px' }}>{product.name}</div>
              
              <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>
                ¥{product.price.toLocaleString()}
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => toggleCast(product.id, product.needs_cast || false)}
                  style={{
                    width: '50px',
                    height: '25px',
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: product.needs_cast ? '#4CAF50' : '#ccc',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2.5px',
                    left: product.needs_cast ? '27px' : '3px',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => toggleActive(product.id, product.is_active)}
                  style={{
                    width: '50px',
                    height: '25px',
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: product.is_active ? '#4CAF50' : '#ccc',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2.5px',
                    left: product.is_active ? '27px' : '3px',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => openEditModal(product)}
                  style={{
                    padding: '5px 15px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  編集
                </button>
                <button
                  onClick={() => deleteProductData(product.id)}
                  style={{
                    padding: '5px 15px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#999'
            }}>
              商品がありません
            </div>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>商品編集</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                商品名 *
              </label>
              <input
                type="text"
                inputMode="text"
              lang="ja"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                価格 *
              </label>
              <input
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newProductNeedsCast}
                  onChange={(e) => setNewProductNeedsCast(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px' }}>キャスト必要</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => updateProduct(editingProduct, newProductName, newProductPrice, newProductNeedsCast)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}