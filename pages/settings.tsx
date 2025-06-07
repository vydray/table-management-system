import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 型定義
interface Category {
  id: number
  name: string
  display_order: number
  created_at?: string
}

export default function Settings() {
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState('system')
  const [loading, setLoading] = useState(false)
  
  // システム設定の状態
  const [systemSettings, setSystemSettings] = useState({
    consumptionTaxRate: 10,
    serviceChargeRate: 15,
    roundingUnit: 100,
    roundingMethod: 0
  })

  // カテゴリー管理の状態
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')

  // システム設定を読み込む関数
  const loadSystemSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
      
      if (settings) {
        setSystemSettings({
          consumptionTaxRate: settings.find(s => s.setting_key === 'consumption_tax_rate')?.setting_value * 100 || 10,
          serviceChargeRate: settings.find(s => s.setting_key === 'service_charge_rate')?.setting_value * 100 || 15,
          roundingUnit: settings.find(s => s.setting_key === 'rounding_unit')?.setting_value || 100,
          roundingMethod: settings.find(s => s.setting_key === 'rounding_method')?.setting_value || 0
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // システム設定を保存する関数
  const saveSystemSettings = async () => {
    setLoading(true)
    try {
      const updates = [
        { setting_key: 'consumption_tax_rate', setting_value: systemSettings.consumptionTaxRate / 100 },
        { setting_key: 'service_charge_rate', setting_value: systemSettings.serviceChargeRate / 100 },
        { setting_key: 'rounding_unit', setting_value: systemSettings.roundingUnit },
        { setting_key: 'rounding_method', setting_value: systemSettings.roundingMethod }
      ]
      
      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key)
        
        if (error) throw error
      }
      
      alert('設定を保存しました')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // カテゴリーを読み込む関数
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // カテゴリーを追加する関数
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('カテゴリー名を入力してください')
      return
    }

    try {
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0)
      
      const { error } = await supabase
        .from('product_categories')
        .insert({
          name: newCategoryName,
          display_order: maxOrder + 1
        })
      
      if (error) throw error
      
      setNewCategoryName('')
      loadCategories()
      alert('カテゴリーを追加しました')
    } catch (error) {
      console.error('Error adding category:', error)
      alert('追加に失敗しました')
    }
  }

  // カテゴリー名を更新する関数
  const updateCategoryName = async (id: number) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ name: editingCategoryName })
        .eq('id', id)
      
      if (error) throw error
      
      setEditingCategoryId(null)
      loadCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      alert('更新に失敗しました')
    }
  }

  // 表示順序を変更する関数
  const moveCategory = async (id: number, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === categories.length - 1)
    ) {
      return
    }

    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // 順序を入れ替え
    const tempOrder = newCategories[index].display_order
    newCategories[index].display_order = newCategories[targetIndex].display_order
    newCategories[targetIndex].display_order = tempOrder
    
    // 配列も入れ替え
    ;[newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]]
    
    try {
      // 両方のカテゴリーを更新
      await Promise.all([
        supabase
          .from('product_categories')
          .update({ display_order: newCategories[index].display_order })
          .eq('id', newCategories[index].id),
        supabase
          .from('product_categories')
          .update({ display_order: newCategories[targetIndex].display_order })
          .eq('id', newCategories[targetIndex].id)
      ])
      
      setCategories(newCategories)
    } catch (error) {
      console.error('Error moving category:', error)
      alert('順序の変更に失敗しました')
    }
  }

  // useEffectで読み込み
  useEffect(() => {
    loadSystemSettings()
    if (activeMenu === 'categories') {
      loadCategories()
    }
  }, [activeMenu])

  return (
    <>
      <Head>
        <title>⚙️ 設定 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{ 
        display: 'flex', 
        width: '1024px',
        height: '768px',
        backgroundColor: '#f5f5f5',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* ヘッダー */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 1000
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '20px'
            }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: '20px' }}>⚙️ 設定</h1>
        </div>

        {/* サイドメニュー */}
        <div style={{
          width: '250px',
          backgroundColor: '#fff',
          borderRight: '1px solid #ddd',
          paddingTop: '60px',
          position: 'absolute',
          height: '100%',
          left: 0
        }}>
          <div style={{ padding: '20px' }}>
            <div
              onClick={() => setActiveMenu('system')}
              style={{
                padding: '15px',
                marginBottom: '5px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeMenu === 'system' ? '#ff9800' : 'transparent',
                color: activeMenu === 'system' ? '#fff' : '#333',
                transition: 'all 0.3s'
              }}
            >
              🔧 システム設定
            </div>
            
            <div
              onClick={() => setActiveMenu('products')}
              style={{
                padding: '15px',
                marginBottom: '5px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeMenu === 'products' ? '#ff9800' : 'transparent',
                color: activeMenu === 'products' ? '#fff' : '#333',
                transition: 'all 0.3s'
              }}
            >
              📦 商品管理
            </div>
            
            <div
              onClick={() => setActiveMenu('categories')}
              style={{
                padding: '15px',
                marginBottom: '5px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeMenu === 'categories' ? '#ff9800' : 'transparent',
                color: activeMenu === 'categories' ? '#fff' : '#333',
                transition: 'all 0.3s'
              }}
            >
              📂 カテゴリー管理
            </div>
            
            <div
              onClick={() => setActiveMenu('casts')}
              style={{
                padding: '15px',
                marginBottom: '5px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeMenu === 'casts' ? '#ff9800' : 'transparent',
                color: activeMenu === 'casts' ? '#fff' : '#333',
                transition: 'all 0.3s'
              }}
            >
              👥 キャスト管理
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          marginLeft: '250px',
          paddingTop: '60px',
          padding: '60px 40px 40px',
          flex: 1,
          overflowY: 'auto',
          height: '100%'
        }}>
          {activeMenu === 'system' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginTop: 0 }}>システム設定</h2>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  消費税率
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    value={systemSettings.consumptionTaxRate}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      consumptionTaxRate: Number(e.target.value)
                    })}
                    style={{
                      width: '100px',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <span>%</span>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  サービス料率
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    value={systemSettings.serviceChargeRate}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      serviceChargeRate: Number(e.target.value)
                    })}
                    style={{
                      width: '100px',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <span>%</span>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  端数処理
                </label>
                <select
                  value={systemSettings.roundingMethod}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    roundingMethod: Number(e.target.value)
                  })}
                  style={{
                    width: '200px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                >
                  <option value={0}>切り捨て</option>
                  <option value={1}>切り上げ</option>
                  <option value={2}>四捨五入</option>
                </select>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  端数単位
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    value={systemSettings.roundingUnit}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      roundingUnit: Number(e.target.value)
                    })}
                    style={{
                      width: '100px',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <span>円</span>
                </div>
              </div>

              <button
                onClick={saveSystemSettings}
                disabled={loading}
                style={{
                  padding: '12px 40px',
                  backgroundColor: '#ff9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          )}

          {activeMenu === 'products' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginTop: 0 }}>商品管理</h2>
              <p>商品管理機能は準備中です...</p>
            </div>
          )}

          {activeMenu === 'categories' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginTop: 0 }}>カテゴリー管理</h2>
              
              {/* 新規追加フォーム */}
              <div style={{ 
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <h3 style={{ marginTop: 0 }}>新規カテゴリー追加</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="カテゴリー名"
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    onClick={addCategory}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* カテゴリー一覧 */}
              <div>
                <h3>カテゴリー一覧</h3>
                {categories.length === 0 ? (
                  <p>カテゴリーがありません</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>カテゴリー名</th>
                        <th style={{ padding: '10px', width: '150px' }}>表示順</th>
                        <th style={{ padding: '10px', width: '200px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr key={category.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px' }}>
                            {editingCategoryId === category.id ? (
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onBlur={() => updateCategoryName(category.id)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateCategoryName(category.id)
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px'
                                }}
                                autoFocus
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  setEditingCategoryId(category.id)
                                  setEditingCategoryName(category.name)
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {category.name}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button
                              onClick={() => moveCategory(category.id, 'up')}
                              disabled={index === 0}
                              style={{
                                padding: '4px 8px',
                                marginRight: '5px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                opacity: index === 0 ? 0.5 : 1
                              }}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveCategory(category.id, 'down')}
                              disabled={index === categories.length - 1}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer',
                                opacity: index === categories.length - 1 ? 0.5 : 1
                              }}
                            >
                              ↓
                            </button>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setEditingCategoryId(category.id)
                                setEditingCategoryName(category.name)
                              }}
                              style={{
                                padding: '4px 12px',
                                marginRight: '5px',
                                backgroundColor: '#2196F3',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              編集
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeMenu === 'casts' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginTop: 0 }}>キャスト管理</h2>
              <p>キャスト管理機能は準備中です...</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}