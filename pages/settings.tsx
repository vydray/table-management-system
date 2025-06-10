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

interface Product {
  id: number
  category_id: number
  name: string
  price: number
  needs_cast: boolean
  display_order: number
  is_active: boolean
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
  const [isCategorySortMode, setIsCategorySortMode] = useState(false)
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)

  // 商品管理の状態
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    needsCast: false,
    categoryId: null as number | null
  })
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSortMode, setIsSortMode] = useState(false)
  const [draggedItem, setDraggedItem] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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

  // カテゴリーのドラッグ&ドロップ
  const handleCategoryDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedCategory(category)
  }

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleCategoryDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault()
    if (!draggedCategory || draggedCategory.id === targetCategory.id) return

    const draggedIndex = categories.findIndex(c => c.id === draggedCategory.id)
    const targetIndex = categories.findIndex(c => c.id === targetCategory.id)

    const newCategories = [...categories]
    newCategories.splice(draggedIndex, 1)
    newCategories.splice(targetIndex, 0, draggedCategory)

    // 表示順序を更新
    const updates = newCategories.map((category, index) => ({
      ...category,
      display_order: index + 1
    }))

    setCategories(updates)

    // データベースを更新
    try {
      for (const [index, category] of updates.entries()) {
        await supabase
          .from('product_categories')
          .update({ display_order: index + 1 })
          .eq('id', category.id)
      }
    } catch (error) {
      console.error('Error updating category order:', error)
      alert('順序の更新に失敗しました')
      loadCategories()
    }

    setDraggedCategory(null)
  }

  // 商品を読み込む関数
  const loadProducts = async (categoryId?: number) => {
    try {
      let query = supabase.from('products').select('*')
      
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      
      const { data, error } = await query.order('display_order')
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // 商品を追加する関数
  const addProduct = async () => {
    if (!newProduct.categoryId) {
      alert('カテゴリーを選択してください')
      return
    }
    
    if (!newProduct.name.trim()) {
      alert('商品名を入力してください')
      return
    }
    
    if (newProduct.price <= 0) {
      alert('価格を正しく入力してください')
      return
    }

    try {
      const maxOrder = Math.max(...products.map(p => p.display_order), 0)
      
      const { error } = await supabase
        .from('products')
        .insert({
          category_id: newProduct.categoryId,
          name: newProduct.name,
          price: newProduct.price,
          needs_cast: newProduct.needsCast,
          display_order: maxOrder + 1,
          is_active: true
        })
      
      if (error) throw error
      
      setNewProduct({
        name: '',
        price: 0,
        needsCast: false,
        categoryId: null
      })
      loadProducts(selectedCategoryId || undefined)
      alert('商品を追加しました')
    } catch (error) {
      console.error('Error adding product:', error)
      alert('追加に失敗しました')
    }
  }

  // 商品を更新する関数
  const updateProduct = async () => {
    if (!editingProduct) return

    try {
      const { error } = await supabase
        .from('products')
        .update({
          category_id: editingProduct.category_id,
          name: editingProduct.name,
          price: editingProduct.price,
          needs_cast: editingProduct.needs_cast,
          is_active: editingProduct.is_active
        })
        .eq('id', editingProduct.id)
      
      if (error) throw error
      
      setEditingProductId(null)
      setEditingProduct(null)
      setIsEditModalOpen(false)
      loadProducts(selectedCategoryId || undefined)
      alert('商品を更新しました')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('更新に失敗しました')
    }
  }

  // ドラッグ&ドロップで商品の順序を変更
  const handleDragStart = (e: React.DragEvent, product: Product) => {
    setDraggedItem(product)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetProduct: Product) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetProduct.id) return

    const draggedIndex = products.findIndex(p => p.id === draggedItem.id)
    const targetIndex = products.findIndex(p => p.id === targetProduct.id)

    const newProducts = [...products]
    newProducts.splice(draggedIndex, 1)
    newProducts.splice(targetIndex, 0, draggedItem)

    // 表示順序を更新
    const updates = newProducts.map((product, index) => ({
      ...product,
      display_order: index + 1
    }))

    setProducts(updates)

    // データベースを更新
    try {
      for (const [index, product] of updates.entries()) {
        await supabase
          .from('products')
          .update({ display_order: index + 1 })
          .eq('id', product.id)
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('順序の更新に失敗しました')
      loadProducts(selectedCategoryId || undefined)
    }

    setDraggedItem(null)
  }

  // 商品の有効/無効を切り替える関数
  const toggleProductActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)
      
      if (error) throw error
      
      loadProducts(selectedCategoryId || undefined)
    } catch (error) {
      console.error('Error toggling product:', error)
      alert('更新に失敗しました')
    }
  }

  // キャスト必要フラグを切り替える関数
  const toggleProductNeedsCast = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ needs_cast: !product.needs_cast })
        .eq('id', product.id)
      
      if (error) throw error
      
      loadProducts(selectedCategoryId || undefined)
    } catch (error) {
      console.error('Error toggling needs_cast:', error)
      alert('更新に失敗しました')
    }
  }

  // useEffectで読み込み
  useEffect(() => {
    loadSystemSettings()
    if (activeMenu === 'categories' || activeMenu === 'products') {
      loadCategories()
    }
  }, [activeMenu])

  // カテゴリーが選択されたら商品を読み込む
  useEffect(() => {
    if (activeMenu === 'products') {
      loadProducts(selectedCategoryId || undefined)
    }
  }, [selectedCategoryId, activeMenu])

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
          position: 'absolute',
          left: '250px',
          top: '60px',
          right: 0,
          bottom: 0,
          padding: '20px 40px 40px',
          overflowY: 'auto',
          overflowX: 'hidden'
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
              
              {/* カテゴリー選択 */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  カテゴリーで絞り込み
                </label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value) || null)}
                  style={{
                    width: '300px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">-- 全て表示 --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* 新規商品追加フォーム */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                marginBottom: '30px'
              }}>
                <h3 style={{ marginTop: 0 }}>新規商品追加</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>カテゴリー *</label>
                    <select
                      value={newProduct.categoryId || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, categoryId: Number(e.target.value) || null })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">-- カテゴリーを選択 --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>商品名 *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="商品名"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>価格 *</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      placeholder="価格"
                      style={{
                        width: '200px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={newProduct.needsCast}
                        onChange={(e) => setNewProduct({ ...newProduct, needsCast: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                      />
                      キャスト必要
                    </label>
                  </div>
                  
                  <button
                    onClick={addProduct}
                    style={{
                      padding: '10px 30px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    商品を追加
                  </button>
                </div>
              </div>

              {/* 商品一覧 */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: 0 }}>商品一覧</h3>
                  <button
                    onClick={() => setIsSortMode(!isSortMode)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isSortMode ? '#ff9800' : '#2196F3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>↕</span>
                    {isSortMode ? '並び替え完了' : '並び替え'}
                  </button>
                </div>
                {products.length === 0 ? (
                  <p>商品がありません</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', textAlign: 'left', width: '40%' }}>商品名</th>
                        <th style={{ padding: '10px', width: '120px', textAlign: 'right' }}>価格</th>
                        <th style={{ padding: '10px', width: '100px', textAlign: 'center' }}>キャスト</th>
                        <th style={{ padding: '10px', width: '80px', textAlign: 'center' }}>表示</th>
                        <th style={{ padding: '10px', width: '100px', textAlign: 'center' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr 
                          key={product.id} 
                          style={{ 
                            borderBottom: '1px solid #eee',
                            cursor: isSortMode ? 'grab' : 'default',
                            backgroundColor: draggedItem?.id === product.id ? '#f0f0f0' : 'white'
                          }}
                          draggable={isSortMode}
                          onDragStart={(e) => handleDragStart(e, product)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, product)}
                        >
                          <td style={{ padding: '10px' }}>
                            {isSortMode && (
                              <span style={{ marginRight: '10px', color: '#999' }}>≡</span>
                            )}
                            {product.name}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            ¥{product.price.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <label style={{
                              position: 'relative',
                              display: 'inline-block',
                              width: '40px',
                              height: '22px',
                              cursor: 'pointer'
                            }}>
                              <input
                                type="checkbox"
                                checked={product.needs_cast}
                                onChange={() => toggleProductNeedsCast(product)}
                                style={{ display: 'none' }}
                              />
                              <span style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: product.needs_cast ? '#4CAF50' : '#ccc',
                                borderRadius: '22px',
                                transition: 'all 0.3s'
                              }}>
                                <span style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: product.needs_cast ? '20px' : '2px',
                                  width: '18px',
                                  height: '18px',
                                  backgroundColor: 'white',
                                  borderRadius: '50%',
                                  transition: 'all 0.3s'
                                }}></span>
                              </span>
                            </label>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <label style={{
                              position: 'relative',
                              display: 'inline-block',
                              width: '50px',
                              height: '24px',
                              cursor: 'pointer'
                            }}>
                              <input
                                type="checkbox"
                                checked={product.is_active}
                                onChange={() => toggleProductActive(product)}
                                style={{ display: 'none' }}
                              />
                              <span style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: product.is_active ? '#4CAF50' : '#ccc',
                                borderRadius: '24px',
                                transition: 'all 0.3s'
                              }}>
                                <span style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: product.is_active ? '26px' : '2px',
                                  width: '20px',
                                  height: '20px',
                                  backgroundColor: 'white',
                                  borderRadius: '50%',
                                  transition: 'all 0.3s'
                                }}></span>
                              </span>
                            </label>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {!isSortMode && (
                              <button
                                onClick={() => {
                                  setEditingProductId(product.id)
                                  setEditingProduct(product)
                                  setIsEditModalOpen(true)
                                }}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#2196F3',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                編集
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: 0 }}>カテゴリー一覧</h3>
                  <button
                    onClick={() => setIsCategorySortMode(!isCategorySortMode)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isCategorySortMode ? '#ff9800' : '#2196F3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>↕</span>
                    {isCategorySortMode ? '並び替え完了' : '並び替え'}
                  </button>
                </div>
                {categories.length === 0 ? (
                  <p>カテゴリーがありません</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>カテゴリー名</th>
                        <th style={{ padding: '10px', width: '100px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr 
                          key={category.id} 
                          style={{ 
                            borderBottom: '1px solid #eee',
                            cursor: isCategorySortMode ? 'grab' : 'default',
                            backgroundColor: draggedCategory?.id === category.id ? '#f0f0f0' : 'white'
                          }}
                          draggable={isCategorySortMode}
                          onDragStart={(e) => handleCategoryDragStart(e, category)}
                          onDragOver={handleCategoryDragOver}
                          onDrop={(e) => handleCategoryDrop(e, category)}
                        >
                          <td style={{ padding: '10px' }}>
                            {isCategorySortMode && (
                              <span style={{ marginRight: '10px', color: '#999' }}>≡</span>
                            )}
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
                                  width: 'calc(100% - 30px)',
                                  padding: '4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px'
                                }}
                                autoFocus
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  if (!isCategorySortMode) {
                                    setEditingCategoryId(category.id)
                                    setEditingCategoryName(category.name)
                                  }
                                }}
                                style={{ cursor: isCategorySortMode ? 'grab' : 'pointer' }}
                              >
                                {category.name}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {!isCategorySortMode && (
                              <button
                                onClick={() => {
                                  setEditingCategoryId(category.id)
                                  setEditingCategoryName(category.name)
                                }}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#2196F3',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                編集
                              </button>
                            )}
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

      {/* 編集モーダル */}
      {isEditModalOpen && editingProduct && (
        <>
          {/* モーダル背景 */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              setIsEditModalOpen(false)
              setEditingProductId(null)
              setEditingProduct(null)
            }}
          >
            {/* モーダル本体 */}
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 閉じるボタン */}
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingProductId(null)
                  setEditingProduct(null)
                }}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>

              <h2 style={{ marginTop: 0, marginBottom: '25px' }}>商品編集</h2>

              {/* 編集フォーム */}
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    カテゴリー
                  </label>
                  <select
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    商品名
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    価格
                  </label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                    <input
                      type="checkbox"
                      checked={editingProduct.needs_cast}
                      onChange={(e) => setEditingProduct({ ...editingProduct, needs_cast: e.target.checked })}
                      style={{ 
                        width: '20px', 
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                    キャスト必要
                  </label>
                </div>

                <div>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                    <input
                      type="checkbox"
                      checked={editingProduct.is_active}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                      style={{ 
                        width: '20px', 
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                    表示する
                  </label>
                </div>

                {/* ボタン */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '20px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingProductId(null)
                      setEditingProduct(null)
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#f5f5f5',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={updateProduct}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}