import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Category {
  id: string
  name: string
  color: string
  order_index: number
}

interface Product {
  id: string
  name: string
  price: number
  category_id: string
  order_index: number
  category?: Category
}

export default function ProductManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCategory, setNewProductCategory] = useState('')
  const [isSortingProducts, setIsSortingProducts] = useState(false)

  // カテゴリーを読み込む
  const loadCategories = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('order_index')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // 商品を読み込む
  const loadProducts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('store_id', storeId)
        .order('order_index')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // 商品を追加
  const addProduct = async () => {
    if (!newProductName || !newProductPrice || !newProductCategory) return

    try {
      const storeId = getCurrentStoreId()
      const categoryProducts = products.filter(p => p.category_id === newProductCategory)
      
      const { error } = await supabase
        .from('products')
        .insert({
          name: newProductName,
          price: parseInt(newProductPrice),
          category_id: newProductCategory,
          order_index: categoryProducts.length,
          store_id: storeId
        })

      if (error) throw error

      setNewProductName('')
      setNewProductPrice('')
      setNewProductCategory('')
      setShowAddProduct(false)
      loadProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      alert('商品の追加に失敗しました')
    }
  }

  // 商品を更新
  const updateProduct = async () => {
    if (!editingProduct || !newProductName || !newProductPrice) return

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: newProductName,
          price: parseInt(newProductPrice)
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      setEditingProduct(null)
      setNewProductName('')
      setNewProductPrice('')
      setShowEditProduct(false)
      loadProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('商品の更新に失敗しました')
    }
  }

  // 商品を削除
  const deleteProduct = async (productId: string) => {
    if (!confirm('この商品を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('商品の削除に失敗しました')
    }
  }

  // 商品の並び順を更新
  const updateProductOrder = async (productId: string, direction: 'up' | 'down', categoryId: string) => {
    const categoryProducts = products.filter(p => p.category_id === categoryId)
    const index = categoryProducts.findIndex(p => p.id === productId)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categoryProducts.length) return

    // 入れ替え
    [categoryProducts[index], categoryProducts[targetIndex]] = [categoryProducts[targetIndex], categoryProducts[index]]

    // order_indexを更新
    for (let i = 0; i < categoryProducts.length; i++) {
      categoryProducts[i].order_index = i
    }

    // 全商品リストを更新
    const newProducts = products.map(p => {
      const updated = categoryProducts.find(cp => cp.id === p.id)
      return updated || p
    })

    setProducts(newProducts)

    // DBを更新
    try {
      for (const product of categoryProducts) {
        await supabase
          .from('products')
          .update({ order_index: product.order_index })
          .eq('id', product.id)
      }
    } catch (error) {
      console.error('Error updating product order:', error)
      loadProducts() // エラーの場合は再読み込み
    }
  }

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>商品一覧</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsSortingProducts(!isSortingProducts)}
            style={{
              padding: '10px 20px',
              backgroundColor: isSortingProducts ? '#666' : '#f0f0f0',
              color: isSortingProducts ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isSortingProducts ? '並び替え完了' : '並び替え'}
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4A90E2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 商品追加
          </button>
        </div>
      </div>

      {categories.map(category => {
        const categoryProducts = products.filter(p => p.category_id === category.id)
        if (categoryProducts.length === 0) return null

        return (
          <div key={category.id} style={{ marginBottom: '30px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '3px',
                  backgroundColor: category.color
                }}
              />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{category.name}</h3>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f8f8' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>商品名</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#666', width: '100px' }}>価格</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#666', width: '150px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryProducts.map((product, index) => (
                    <tr key={product.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '16px' }}>{product.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>
                        ¥{product.price.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {isSortingProducts ? (
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button
                              onClick={() => updateProductOrder(product.id, 'up', category.id)}
                              disabled={index === 0}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: index === 0 ? '#ccc' : '#f0f0f0',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: index === 0 ? 'default' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => updateProductOrder(product.id, 'down', category.id)}
                              disabled={index === categoryProducts.length - 1}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: index === categoryProducts.length - 1 ? '#ccc' : '#f0f0f0',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: index === categoryProducts.length - 1 ? 'default' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              ↓
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setEditingProduct(product)
                                setNewProductName(product.name)
                                setNewProductPrice(product.price.toString())
                                setShowEditProduct(true)
                              }}
                              style={{
                                padding: '5px 15px',
                                backgroundColor: '#4A90E2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              編集
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              style={{
                                padding: '5px 15px',
                                backgroundColor: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* 商品追加モーダル */}
      {showAddProduct && (
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>商品追加</h3>
            
            <select
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            >
              <option value="">カテゴリーを選択</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="商品名"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            />

            <input
              type="number"
              placeholder="価格"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddProduct(false)
                  setNewProductName('')
                  setNewProductPrice('')
                  setNewProductCategory('')
                }}
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
                onClick={addProduct}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4A90E2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品編集モーダル */}
      {showEditProduct && (
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
            
            <input
              type="text"
              placeholder="商品名"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            />

            <input
              type="number"
              placeholder="価格"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditProduct(false)
                  setEditingProduct(null)
                  setNewProductName('')
                  setNewProductPrice('')
                }}
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
                onClick={updateProduct}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4A90E2',
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