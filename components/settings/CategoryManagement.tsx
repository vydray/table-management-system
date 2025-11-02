import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Category {
  id: number
  name: string
  display_order: number
  store_id: number
  created_at?: string
  show_oshi_first?: boolean
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  // カテゴリーを読み込む
  const loadCategories = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // カテゴリーを追加
  const addCategory = async () => {
  if (!newCategoryName) return

  try {
    // 既に同じ名前のカテゴリーが存在するかチェック
    const isDuplicate = categories.some(c => 
      c.name.toLowerCase() === newCategoryName.toLowerCase()
    )
    
    if (isDuplicate) {
      alert(`「${newCategoryName}」は既に登録されています`)
      return
    }
    
    const storeId = getCurrentStoreId()
    const maxDisplayOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.display_order)) 
      : 0
    
    const { error } = await supabase
      .from('product_categories')
      .insert({
        name: newCategoryName,
        display_order: maxDisplayOrder + 1,
        store_id: storeId,
        show_oshi_first: false
      })

    if (error) throw error

    setNewCategoryName('')
    loadCategories()
  } catch (error) {
    console.error('Error adding category:', error)
    alert('カテゴリーの追加に失敗しました')
  }
}

  // カテゴリーを更新
  const updateCategory = async () => {
  if (!editingCategory || !newCategoryName) return

  try {
    // 編集中のカテゴリー以外に同じ名前が存在するかチェック
    const isDuplicate = categories.some(c => 
      c.id !== editingCategory.id &&
      c.name.toLowerCase() === newCategoryName.toLowerCase()
    )
    
    if (isDuplicate) {
      alert(`「${newCategoryName}」は既に登録されています`)
      return
    }
    
    const { error } = await supabase
      .from('product_categories')
      .update({ name: newCategoryName })
      .eq('id', editingCategory.id)

    if (error) throw error

    setNewCategoryName('')
    setShowEditModal(false)
    setEditingCategory(null)
    loadCategories()
  } catch (error) {
    console.error('Error updating category:', error)
    alert('カテゴリーの更新に失敗しました')
  }
}

  // カテゴリーを削除
  const deleteCategory = async (categoryId: number) => {
    if (!confirm('このカテゴリーを削除しますか？\n※このカテゴリーに属する商品も全て削除されます')) return

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('カテゴリーの削除に失敗しました')
    }
  }

  // 推し優先表示を切り替え
  const toggleOshiFirst = async (categoryId: number, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ show_oshi_first: !currentValue })
        .eq('id', categoryId)

      if (error) throw error
      loadCategories()
    } catch (error) {
      console.error('Error toggling oshi first:', error)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  return (
  <div style={{
    height: '100%',
    overflowY: 'auto',
    paddingBottom: '100px', // 下部に余裕を持たせる
    WebkitOverflowScrolling: 'touch', // iOSスムーズスクロール
    msOverflowStyle: '-ms-autohiding-scrollbar', // IE/Edge
    position: 'relative' // Androidでの位置固定問題対策
  }}>
    {/* ヘッダー部分 */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    }}>
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>新規カテゴリー追加</h2>
    </div>
    
      {/* カテゴリー追加フォーム */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px'
      }}>
        <input
          type="text"
          placeholder="カテゴリー名"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCategory()}
          style={{
            flex: 1,
            padding: '10px 15px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '5px'
          }}
        />
        <button
          onClick={addCategory}
          style={{
            padding: '10px 30px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          追加
        </button>
      </div>

      {/* カテゴリー一覧 */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>カテゴリー一覧</h2>
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
        </div>

        {/* テーブルヘッダー */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 150px 120px',
          padding: '10px 20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px 5px 0 0',
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>カテゴリー名</div>
          <div style={{ textAlign: 'center' }}>推し優先表示</div>
          <div style={{ textAlign: 'center' }}>操作</div>
        </div>

        {/* カテゴリーリスト */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '0 0 5px 5px'
        }}>
          {categories.map((category, index) => (
            <div
              key={category.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 120px',
                padding: '15px 20px',
                borderBottom: index < categories.length - 1 ? '1px solid #e0e0e0' : 'none',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '16px' }}>{category.name}</div>
              
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => toggleOshiFirst(category.id, category.show_oshi_first || false)}
                  style={{
                    width: '50px',
                    height: '25px',
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: category.show_oshi_first ? '#4CAF50' : '#ccc',
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
                    left: category.show_oshi_first ? '27px' : '3px',
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
                  onClick={() => {
                    setEditingCategory(category)
                    setNewCategoryName(category.name)
                    setShowEditModal(true)
                  }}
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
                  onClick={() => deleteCategory(category.id)}
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
          
          {categories.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#999'
            }}>
              カテゴリーがありません
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>カテゴリー編集</h3>
            
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
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
                  setShowEditModal(false)
                  setEditingCategory(null)
                  setNewCategoryName('')
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
                onClick={updateCategory}
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