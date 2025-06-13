import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

// Supabaseクライアントの初期化を確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// キャストの型定義
interface Cast {
  id: number
  store_id: number
  name: string | null
  line_number: string | null
  password: string | null
  twitter: string | null
  instagram: string | null
  photo: string | null
  attributes: string | null
  status: string | null
  sales_previous_day: string | null
  experience_date: string | null
  hire_date: string | null
  show_in_pos: boolean | null
  created_at: string | null
  updated_at: string | null
}

// 新規キャストのデフォルト値
const getDefaultCast = (): Partial<Cast> => ({
  name: '',
  twitter: '',
  instagram: '',
  attributes: '',
  status: '在籍',
  sales_previous_day: '無',
  experience_date: '',
  hire_date: new Date().toISOString().split('T')[0],
  show_in_pos: true,
})

// iOSスタイルのトグルスイッチコンポーネント
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  return (
    <label style={{
      position: 'relative',
      display: 'inline-block',
      width: '51px',
      height: '31px',
      cursor: 'pointer'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked ? '#4cd964' : '#e5e5e7',
        borderRadius: '34px',
        transition: 'background-color 0.3s',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
      }}>
        <span style={{
          position: 'absolute',
          content: '',
          height: '27px',
          width: '27px',
          left: checked ? '22px' : '2px',
          bottom: '2px',
          backgroundColor: 'white',
          borderRadius: '50%',
          transition: 'left 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </span>
    </label>
  )
}

export default function CastManagement() {
  const [casts, setCasts] = useState<Cast[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCasts, setFilteredCasts] = useState<Cast[]>([])
  const [showCastModal, setShowCastModal] = useState(false)
  const [editingCast, setEditingCast] = useState<Partial<Cast> | null>(null)
  const [isNewCast, setIsNewCast] = useState(false)

  // Google Apps ScriptのURL
  const gasUrl = 'https://script.google.com/macros/s/AKfycbwp10byL5IEGbEJAKOxVAQ1dSdjQ3UNJTGJnJOZ6jp6JOCWiiFURaQiqfqyfo390NvgZg/exec'

  // キャスト一覧を読み込む
  const loadCasts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('casts')
        .select('*')
        .eq('store_id', storeId)
        .order('id')

      if (error) throw error
      console.log('Loaded casts:', data)
      setCasts(data || [])
    } catch (error) {
      console.error('Failed to load casts:', error)
    }
  }

  // 新規キャスト追加
  const addNewCast = async () => {
    if (!editingCast || !editingCast.name) {
      alert('名前を入力してください')
      return
    }

    try {
      const storeId = getCurrentStoreId()
      
      const newCastData = {
        ...editingCast,
        store_id: storeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: insertedCast, error } = await supabase
        .from('casts')
        .insert([newCastData])
        .select()
        .single()

      if (error) throw error

      // Google Apps Scriptに通知
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'INSERT',
            table: 'casts',
            record: insertedCast
          })
        })
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }

      alert('キャストを追加しました')
      await loadCasts()
      setShowCastModal(false)
      setEditingCast(null)
      setIsNewCast(false)
    } catch (error) {
      console.error('Failed to add cast:', error)
      alert('追加に失敗しました')
    }
  }

  // 売上表の有無を切り替える関数
  const toggleSalesPreviousDay = async (cast: Cast) => {
    try {
      const storeId = getCurrentStoreId()
      const newValue = cast.sales_previous_day === '有' ? '無' : '有'
      
      // Supabaseを更新
      const { error } = await supabase
        .from('casts')
        .update({ 
          sales_previous_day: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // Google Apps Scriptに通知
      try {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.name = 'hidden-iframe-' + Date.now()
        document.body.appendChild(iframe)
        
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = gasUrl
        form.target = iframe.name
        
        form.innerHTML = `
          <input name="action" value="updateSalesPreviousDay" />
          <input name="name" value="${cast.name || ''}" />
          <input name="salesPreviousDay" value="${newValue}" />
        `
        
        document.body.appendChild(form)
        form.submit()
        
        setTimeout(() => {
          document.body.removeChild(form)
          document.body.removeChild(iframe)
        }, 1000)
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }
      
      // UIを更新
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, sales_previous_day: newValue } : c
      ))
    } catch (error) {
      console.error('Error toggling sales_previous_day:', error)
      alert('更新に失敗しました')
    }
  }

  // キャストのPOS表示を切り替える関数
  const toggleCastShowInPos = async (cast: Cast) => {
    try {
      const storeId = getCurrentStoreId()
      const newValue = !cast.show_in_pos
      
      // Supabaseを更新
      const { error } = await supabase
        .from('casts')
        .update({ 
          show_in_pos: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 成功したらGoogle Apps Scriptに直接送信（即時反映）
      try {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.name = 'hidden-iframe-' + Date.now()
        document.body.appendChild(iframe)
        
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = gasUrl
        form.target = iframe.name
        
        form.innerHTML = `
          <input name="action" value="updateShowInPos" />
          <input name="name" value="${cast.name || ''}" />
          <input name="showInPos" value="${newValue}" />
        `
        
        document.body.appendChild(form)
        form.submit()
        
        setTimeout(() => {
          document.body.removeChild(form)
          document.body.removeChild(iframe)
        }, 1000)
        
        console.log('Google Apps Script called successfully')
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }
      
      // UIを更新
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, show_in_pos: newValue } : c
      ))
    } catch (error) {
      console.error('Error toggling show_in_pos:', error)
      alert('更新に失敗しました')
    }
  }

  // キャスト情報を更新する関数
  const updateCast = async () => {
    if (!editingCast || !editingCast.id) return

    try {
      const storeId = getCurrentStoreId()
      const oldCast = casts.find(c => c.id === editingCast.id)
      
      const updateData = {
        name: editingCast.name || '',
        twitter: editingCast.twitter || '',
        instagram: editingCast.instagram || '',
        attributes: editingCast.attributes || '',
        status: editingCast.status || '',
        sales_previous_day: editingCast.sales_previous_day || '無',
        experience_date: editingCast.experience_date || null,
        hire_date: editingCast.hire_date || null,
        show_in_pos: editingCast.show_in_pos ?? true,
        updated_at: new Date().toISOString()
      }

      const { data: updatedCastData, error } = await supabase
        .from('casts')
        .update(updateData)
        .eq('id', editingCast.id)
        .eq('store_id', storeId)
        .select()
        .single()

      if (error) throw error
      
      // 成功したらGoogle Apps Scriptに直接送信
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'UPDATE',
            table: 'casts',
            record: updatedCastData,
            old_record: oldCast
          })
        })
        
        console.log('Google Apps Script called successfully')
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }
      
      alert('キャスト情報を更新しました')
      await loadCasts()
      setShowCastModal(false)
      setEditingCast(null)
    } catch (error) {
      console.error('Failed to update cast:', error)
      alert('更新に失敗しました')
    }
  }

  // 初回読み込み
  useEffect(() => {
    loadCasts()
  }, [])

  // 検索処理
  useEffect(() => {
    const filtered = casts.filter(cast => {
      const name = cast.name || ''
      const attributes = cast.attributes || ''
      const status = cast.status || ''
      const searchLower = searchTerm.toLowerCase()
      
      return name.toLowerCase().includes(searchLower) ||
             attributes.toLowerCase().includes(searchLower) ||
             status.toLowerCase().includes(searchLower)
    })
    setFilteredCasts(filtered)
  }, [casts, searchTerm])

  return (
    <div style={{ backgroundColor: '#f2f2f7', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ヘッダー */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #e5e5e7',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          fontSize: '34px', 
          fontWeight: '700',
          margin: 0,
          letterSpacing: '-0.5px'
        }}>
          カテゴリー一覧
        </h1>
        <button
          onClick={() => {
            setEditingCast(getDefaultCast())
            setIsNewCast(true)
            setShowCastModal(true)
          }}
          style={{
            backgroundColor: '#007aff',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '17px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span> 並び替え
        </button>
      </div>

      {/* 検索バー */}
      <div style={{ padding: '12px 16px' }}>
        <input
          type="text"
          placeholder="検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'rgba(118, 118, 128, 0.12)',
            fontSize: '17px',
            outline: 'none'
          }}
        />
      </div>

      {/* テーブルコンテナ */}
      <div style={{ margin: '0 16px', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden' }}>
        {/* テーブルヘッダー */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          padding: '12px 16px',
          backgroundColor: '#f2f2f7',
          fontSize: '13px',
          fontWeight: '400',
          color: '#8e8e93',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <div>カテゴリー名</div>
          <div style={{ textAlign: 'center' }}>売上表</div>
          <div style={{ textAlign: 'center' }}>推し優先表示</div>
          <div style={{ textAlign: 'center' }}>操作</div>
        </div>

        {/* キャスト一覧 */}
        {filteredCasts.map((cast, index) => (
          <div key={cast.id} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '12px 16px',
            alignItems: 'center',
            borderTop: index > 0 ? '1px solid #e5e5e7' : 'none'
          }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '400' }}>{cast.name || '-'}</div>
              {cast.attributes && (
                <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '2px' }}>
                  {cast.status} • {cast.attributes}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ToggleSwitch
                checked={cast.sales_previous_day === '有'}
                onChange={() => toggleSalesPreviousDay(cast)}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ToggleSwitch
                checked={cast.show_in_pos || false}
                onChange={() => toggleCastShowInPos(cast)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setEditingCast(cast)
                  setIsNewCast(false)
                  setShowCastModal(true)
                }}
                style={{
                  backgroundColor: '#007aff',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                編集
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 編集/追加モーダル */}
      {showCastModal && editingCast && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '14px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            {/* モーダルヘッダー */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e5e7',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '17px', 
                fontWeight: '600', 
                margin: 0 
              }}>
                {isNewCast ? 'キャスト新規追加' : 'キャスト編集'}
              </h2>
              <button
                onClick={() => {
                  setShowCastModal(false)
                  setEditingCast(null)
                  setIsNewCast(false)
                }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '17px',
                  color: '#007aff',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                キャンセル
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#8e8e93',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  名前 *
                </label>
                <input
                  type="text"
                  value={editingCast.name || ''}
                  onChange={(e) => setEditingCast({...editingCast, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '8px',
                    fontSize: '17px',
                    outline: 'none'
                  }}
                  placeholder="必須"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#8e8e93',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Twitter
                </label>
                <input
                  type="text"
                  value={editingCast.twitter || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '8px',
                    fontSize: '17px',
                    outline: 'none'
                  }}
                  placeholder="@なしで入力"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#8e8e93',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Instagram
                </label>
                <input
                  type="text"
                  value={editingCast.instagram || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '8px',
                    fontSize: '17px',
                    outline: 'none'
                  }}
                  placeholder="@なしで入力"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#8e8e93',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  属性
                </label>
                <input
                  type="text"
                  value={editingCast.attributes || ''}
                  onChange={(e) => setEditingCast({...editingCast, attributes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '8px',
                    fontSize: '17px',
                    outline: 'none'
                  }}
                  placeholder="例: キャスト、店長、体験入店"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#8e8e93',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ステータス
                </label>
                <select
                  value={editingCast.status || '在籍'}
                  onChange={(e) => setEditingCast({...editingCast, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '8px',
                    fontSize: '17px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="在籍">在籍</option>
                  <option value="体験">体験</option>
                  <option value="退店">退店</option>
                  <option value="削除済み">削除済み</option>
                </select>
              </div>

              <div style={{ 
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderTop: '1px solid #e5e5e7',
                borderBottom: '1px solid #e5e5e7'
              }}>
                <label style={{ fontSize: '17px' }}>売上表の有無</label>
                <ToggleSwitch
                  checked={editingCast.sales_previous_day === '有'}
                  onChange={() => setEditingCast({
                    ...editingCast, 
                    sales_previous_day: editingCast.sales_previous_day === '有' ? '無' : '有'
                  })}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#8e8e93',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  体験入店日
                </label>
                <input
                  type="date"
                  value={editingCast.experience_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, experience_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '8px',
                    fontSize: '17px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#8e8e93',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  本入店日
                </label>
                <input
                  type="date"
                  value={editingCast.hire_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, hire_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '8px',
                    fontSize: '17px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0'
              }}>
                <label style={{ fontSize: '17px' }}>POS表示</label>
                <ToggleSwitch
                  checked={editingCast.show_in_pos ?? true}
                  onChange={() => setEditingCast({
                    ...editingCast, 
                    show_in_pos: !editingCast.show_in_pos
                  })}
                />
              </div>
            </div>

            {/* モーダルフッター */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e5e5e7'
            }}>
              <button
                onClick={isNewCast ? addNewCast : updateCast}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#007aff',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '17px',
                  fontWeight: '600'
                }}
              >
                {isNewCast ? '追加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}