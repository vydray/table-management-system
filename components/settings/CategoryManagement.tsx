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

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#FF6B6B')
  const [isSortingCategories, setIsSortingCategories] = useState(false)

  const colorPresets = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#48DBFB', '#FF9FF3', '#54A0FF', '#FDA7DF', '#A29BFE',
    '#6C5CE7', '#FD79A8', '#FDCB6E', '#E17055', '#74B9FF'
  ]

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

  // カテゴリーを追加
  const addCategory = async () => {
    if (!newCategoryName) return

    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName,
          color: newCategoryColor,
          order_index: categories.length,
          store_id: storeId
        })

      if (error) throw error

      setNewCategoryName('')
      setNewCategoryColor('#FF6B6B')
      setShowAddCategory(false)
      loadCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      alert('カテゴリーの追加に失敗しました')
    }
  }

  // カテゴリーを削除
  const deleteCategory = async (categoryId: string) => {
    if (!confirm('このカテゴリーを削除しますか？\n※このカテゴリーに属する商品も全て削除されます')) return

    try {
      // まず関連する商品を削除
      await supabase
        .from('products')
        .delete()
        .eq('category_id', categoryId)

      // その後カテゴリーを削除
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('カテゴリーの削除に失敗しました')
    }
  }

  // カテゴリーの並び順を更新
  const updateCategoryOrder = async (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === categoryId)
    if (index === -1) return

    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= categories.length) return

    // 入れ替え
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]]

    // order_indexを更新
    for (let i = 0; i < newCategories.length; i++) {
      newCategories[i].order_index = i
    }

    setCategories(newCategories)

    // DBを更新
    try {
      for (const category of newCategories) {
        await supabase
          .from('categories')
          .update({ order_index: category.order_index })
          .eq('id', category.id)
      }
    } catch (error) {
      console.error('Error updating category order:', error)
      loadCategories() // エラーの場合は再読み込み
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>カテゴリー一覧</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsSortingCategories(!isSortingCategories)}
            style={{
              padding: '10px 20px',
              backgroundColor: isSortingCategories ? '#666' : '#f0f0f0',
              color: isSortingCategories ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isSortingCategories ? '並び替え完了' : '並び替え'}
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
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
            + カテゴリー追加
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {categories.map((category, index) => (
          <div
            key={category.id}
            style={{
              padding: '15px 20px',
              borderBottom: index < categories.length - 1 ? '1px solid #eee' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '5px',
                  backgroundColor: category.color
                }}
              />
              <span style={{ fontSize: '16px', fontWeight: '500' }}>{category.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isSortingCategories ? (
                <>
                  <button
                    onClick={() => updateCategoryOrder(category.id, 'up')}
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
                    onClick={() => updateCategoryOrder(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: index === categories.length - 1 ? '#ccc' : '#f0f0f0',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: index === categories.length - 1 ? 'default' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ↓
                  </button>
                </>
              ) : (
                <button
                  onClick={() => deleteCategory(category.id)}
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
              )}
            </div>
          </div>
        ))}
      </div>

      {/* カテゴリー追加モーダル */}
      {showAddCategory && (
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>カテゴリー追加</h3>
            
            <input
              type="text"
              placeholder="カテゴリー名"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                カラー選択
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {colorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '5px',
                      backgroundColor: color,
                      border: newCategoryColor === color ? '3px solid #333' : '1px solid #ddd',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddCategory(false)
                  setNewCategoryName('')
                  setNewCategoryColor('#FF6B6B')
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
                onClick={addCategory}
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
    </div>
  )
}