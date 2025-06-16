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
  line: string | null  // line_user_id を line に変更
  password: string | null
  twitter: string | null
  twitter_password: string | null  // 追加
  instagram: string | null
  instagram_password: string | null  // 追加
  photo: string | null
  position: string | null  // attributes を position に変更
  is_writer: boolean | null
  submission_date: string | null
  back_number: string | null
  status: string | null
  sales_previous_day: string | null  // boolean から string に変更
  cast_point: number | null
  show_in_pos: boolean | null
  birth_date: string | null  // 追加
  created_at: string | null
  updated_at: string | null
  retirement_date: string | null
}

// 役職の型定義
interface Position {
  id: number
  store_id: number
  name: string
  display_order: number
  is_active: boolean
}

export default function CastManagement() {
  const [casts, setCasts] = useState<Cast[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCasts, setFilteredCasts] = useState<Cast[]>([])
  const [showCastModal, setShowCastModal] = useState(false)
  const [editingCast, setEditingCast] = useState<Cast | null>(null)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [newPositionName, setNewPositionName] = useState('')
  const [showRetirementModal, setShowRetirementModal] = useState(false)
  const [retirementDate, setRetirementDate] = useState('')
  const [retirementCast, setRetirementCast] = useState<Cast | null>(null)

  // Google Apps ScriptのURL
  const gasUrl = 'https://script.google.com/macros/s/AKfycbw193siFFyTAHwlDIJGFh6GonwWSYsIPHaGA3_0wMNIkm2-c8LGl7ny6vqZmzagdFQFCw/exec'

  // GASに送信（シンプルな形式）
  const sendToGAS = (cast: Cast) => {
    const data = {
      name: cast.name,
      showInPos: cast.show_in_pos,
      position: cast.position,
      status: cast.status,
      line: cast.line,
      twitter: cast.twitter,
      twitter_password: cast.twitter_password,
      instagram: cast.instagram,
      instagram_password: cast.instagram_password,
      birth_date: cast.birth_date
    }
    
    console.log('Sending to GAS:', data)
    
    fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }).catch(error => {
      console.error('GAS送信エラー:', error)
    })
  }

  // ステータスの背景色を取得
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case '在籍':
        return '#e6f7e6'
      case '体験':
        return '#fff7e6'
      case '退店':
        return '#f0f0f0'
      case '削除済み':
        return '#ffe6e6'
      default:
        return '#ffffff'
    }
  }

  // 役職一覧を読み込む
  const loadPositions = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('cast_positions')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      setPositions(data || [])
    } catch (error) {
      console.error('Failed to load positions:', error)
    }
  }

  // 役職を追加
  const addPosition = async () => {
    if (!newPositionName.trim()) return

    try {
      const storeId = getCurrentStoreId()
      const maxOrder = Math.max(...positions.map(p => p.display_order), 0)
      
      const { error } = await supabase
        .from('cast_positions')
        .insert({
          store_id: storeId,
          name: newPositionName,
          display_order: maxOrder + 10,
          is_active: true
        })

      if (error) throw error
      
      setNewPositionName('')
      loadPositions()
      alert('役職を追加しました')
    } catch (error) {
      console.error('Failed to add position:', error)
      alert('役職の追加に失敗しました')
    }
  }

  // 役職を削除（非アクティブ化）
  const deletePosition = async (id: number) => {
    if (!confirm('この役職を削除しますか？')) return

    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('cast_positions')
        .update({ is_active: false })
        .eq('id', id)
        .eq('store_id', storeId)

      if (error) throw error
      
      loadPositions()
      alert('役職を削除しました')
    } catch (error) {
      console.error('Failed to delete position:', error)
      alert('役職の削除に失敗しました')
    }
  }

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
      
      // データベースの attributes を position に、line_user_id を line にマッピング
      const mappedData = (data || []).map(cast => ({
        ...cast,
        position: cast.attributes || cast.position,
        line: cast.line_user_id || cast.line,
        sales_previous_day: cast.sales_previous_day || '無'
      }))
      
      setCasts(mappedData)
    } catch (error) {
      console.error('Failed to load casts:', error)
    }
  }

  // キャストの役職を更新
  const updateCastPosition = async (cast: Cast, newPosition: string) => {
    try {
      const storeId = getCurrentStoreId()
      
      const { data, error } = await supabase
        .from('casts')
        .update({ 
          attributes: newPosition,  // データベースでは attributes として保存
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 更新されたキャストをGASに送信
      const updatedCast = { ...cast, position: newPosition }
      sendToGAS(updatedCast)
      
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, position: newPosition } : c
      ))
    } catch (error) {
      console.error('Error updating position:', error)
      alert('役職の更新に失敗しました')
    }
  }

  // キャストのステータスを更新
  const updateCastStatus = async (cast: Cast, newStatus: string) => {
    // 退店を選択した場合は退店日設定モーダルを表示
    if (newStatus === '退店') {
      setRetirementCast(cast)
      setRetirementDate(new Date().toISOString().split('T')[0])
      setShowRetirementModal(true)
      return
    }

    try {
      const storeId = getCurrentStoreId()
      
      interface UpdateData {
        status: string
        updated_at: string
        retirement_date?: string | null
      }
      
      const updateData: UpdateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // 退店以外のステータスに変更する場合は退店日をクリア
      if (newStatus !== '退店') {
        updateData.retirement_date = null
      }
      
      const { data, error } = await supabase
        .from('casts')
        .update(updateData)
        .eq('id', cast.id)
        .eq('store_id', storeId)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 更新されたキャストをGASに送信
      const updatedCast = { ...cast, status: newStatus, retirement_date: updateData.retirement_date || null }
      sendToGAS(updatedCast)
      
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...updatedCast } : c
      ))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('ステータス更新に失敗しました')
    }
  }

  // 退店処理
  const confirmRetirement = async () => {
    if (!retirementCast || !retirementDate) return

    try {
      const storeId = getCurrentStoreId()
      
      const { data, error } = await supabase
        .from('casts')
        .update({ 
          status: '退店',
          retirement_date: retirementDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', retirementCast.id)
        .eq('store_id', storeId)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 更新されたキャストをGASに送信
      const updatedCast = { ...retirementCast, status: '退店', retirement_date: retirementDate }
      sendToGAS(updatedCast)
      
      setCasts(prev => prev.map(c => 
        c.id === retirementCast.id ? { ...updatedCast } : c
      ))
      
      setShowRetirementModal(false)
      setRetirementCast(null)
      setRetirementDate('')
      alert('退店処理が完了しました')
    } catch (error) {
      console.error('Error updating retirement:', error)
      alert('退店処理に失敗しました')
    }
  }

  // キャストのPOS表示を切り替える関数
  const toggleCastShowInPos = async (cast: Cast) => {
    try {
      const storeId = getCurrentStoreId()
      const newValue = !cast.show_in_pos
      
      const { data, error } = await supabase
        .from('casts')
        .update({ 
          show_in_pos: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 更新されたキャストをGASに送信
      const updatedCast = { ...cast, show_in_pos: newValue }
      sendToGAS(updatedCast)
      
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
    if (!editingCast) return

    try {
      const storeId = getCurrentStoreId()
      
      const { data, error } = await supabase
        .from('casts')
        .update({
          name: editingCast.name || '',
          line_user_id: editingCast.line || '',  // line を line_user_id として保存
          twitter: editingCast.twitter || '',
          twitter_password: editingCast.twitter_password || '',
          instagram: editingCast.instagram || '',
          instagram_password: editingCast.instagram_password || '',
          attributes: editingCast.position || '',  // position を attributes として保存
          status: editingCast.status || '',
          show_in_pos: editingCast.show_in_pos ?? true,
          birth_date: editingCast.birth_date || null,
          retirement_date: editingCast.retirement_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCast.id)
        .eq('store_id', storeId)
        .select()
        .single()

      if (error) throw error
      
      // 更新されたキャストをGASに送信
      sendToGAS(editingCast)
      
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
    loadPositions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 検索処理
  useEffect(() => {
    const filtered = casts.filter(cast => {
      const name = cast.name || ''
      const position = cast.position || ''
      const status = cast.status || ''
      const searchLower = searchTerm.toLowerCase()
      
      return name.toLowerCase().includes(searchLower) ||
             position.toLowerCase().includes(searchLower) ||
             status.toLowerCase().includes(searchLower)
    })
    setFilteredCasts(filtered)
  }, [casts, searchTerm])

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>キャスト管理</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowPositionModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            役職管理
          </button>
          <button
            onClick={async () => {
              console.log('=== GASデバッグ開始 ===')
              
              // 実在のキャストを使用
              const firstCast = filteredCasts[0]
              if (!firstCast) {
                alert('キャストが存在しません')
                return
              }
              
              console.log('送信するキャスト:', firstCast.name)
              console.log('現在のPOS表示:', firstCast.show_in_pos)
              
              // POS表示を反転してテスト送信
              const testData = {
                name: firstCast.name,
                showInPos: !firstCast.show_in_pos,
                position: firstCast.position || '',
                status: firstCast.status || '在籍',
                line: firstCast.line || '',
                twitter: firstCast.twitter || '',
                twitter_password: firstCast.twitter_password || '',
                instagram: firstCast.instagram || '',
                instagram_password: firstCast.instagram_password || '',
                birth_date: firstCast.birth_date || ''
              }
              
              console.log('送信データ:', JSON.stringify(testData, null, 2))
              console.log('GAS URL:', gasUrl)
              
              try {
                console.log('送信中...')
                await fetch(gasUrl, {
                  method: 'POST',
                  mode: 'no-cors',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(testData)
                })
                console.log('送信完了')
                alert(`送信完了！\n${firstCast.name}のPOS表示を${testData.showInPos ? 'ON' : 'OFF'}に送信しました。\nスプレッドシートを確認してください。`)
              } catch (error) {
                console.error('エラー:', error)
                alert('エラーが発生しました。コンソールを確認してください')
              }
              
              console.log('=== デバッグ終了 ===')
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF5722',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            GASデバッグ
          </button>
        </div>
      </div>

      {/* 検索バー */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="名前、役職、ステータスで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 15px',
            border: '1px solid #e5e5e7',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* キャスト一覧テーブル */}
      <div style={{ 
        backgroundColor: '#f8f8f8',
        borderRadius: '8px',
        padding: '1px'
      }}>
        <div style={{ 
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <table data-cast-table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff'
          }}>
            <thead style={{ 
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>名前</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>役職</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>ステータス</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>POS表示</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCasts.map((cast) => (
                <tr key={cast.id} style={{ 
                  borderBottom: '1px solid #e5e5e7',
                  backgroundColor: '#fff'
                }}>
                  <td style={{ 
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}>
                    {cast.name || '-'}
                    {cast.retirement_date && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        ({new Date(cast.retirement_date).toLocaleDateString('ja-JP')}退店)
                      </span>
                    )}
                  </td>
                  <td style={{ 
                    padding: '12px 16px'
                  }}>
                    <select
                      value={cast.position || ''}
                      onChange={(e) => updateCastPosition(cast, e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '150px',
                        padding: '6px 10px',
                        border: '1px solid #e5e5e7',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        color: '#000',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">未設定</option>
                      {positions.map(pos => (
                        <option key={pos.id} value={pos.name}>{pos.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ 
                    padding: '12px 16px'
                  }}>
                    <select
                      value={cast.status || '在籍'}
                      onChange={(e) => updateCastStatus(cast, e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '120px',
                        padding: '6px 10px',
                        border: '1px solid #e5e5e7',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: getStatusColor(cast.status),
                        color: '#000',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="在籍">在籍</option>
                      <option value="体験">体験</option>
                      <option value="退店">退店</option>
                      <option value="削除済み">削除済み</option>
                    </select>
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    textAlign: 'center'
                  }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '51px',
                      height: '31px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={cast.show_in_pos || false}
                        onChange={() => toggleCastShowInPos(cast)}
                        style={{
                          opacity: 0,
                          width: 0,
                          height: 0
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: cast.show_in_pos ? '#34c759' : '#e5e5e7',
                        borderRadius: '34px',
                        transition: 'background-color 0.3s',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '27px',
                          width: '27px',
                          left: cast.show_in_pos ? '22px' : '2px',
                          bottom: '2px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.3s',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}></span>
                      </span>
                    </label>
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => {
                        setEditingCast(cast)
                        setShowCastModal(true)
                      }}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#007aff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
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
        </div>
      </div>

      {/* 退店日設定モーダル */}
      {showRetirementModal && retirementCast && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px' 
            }}>
              退店日の設定
            </h3>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              {retirementCast.name}さんの退店日を設定してください
            </p>
            
            <input
              type="date"
              value={retirementDate}
              onChange={(e) => setRetirementDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e5e7',
                borderRadius: '6px',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={() => {
                  setShowRetirementModal(false)
                  setRetirementCast(null)
                  setRetirementDate('')
                }}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={confirmRetirement}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#ff4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                退店処理
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 役職管理モーダル */}
      {showPositionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px' 
            }}>
              役職管理
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="新しい役職名"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={addPosition}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  追加
                </button>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {positions.map((pos) => (
                  <div key={pos.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #e5e5e7'
                  }}>
                    <span>{pos.name}</span>
                    <button
                      onClick={() => deletePosition(pos.id)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#ff4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={() => setShowPositionModal(false)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showCastModal && editingCast && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px' 
            }}>
              キャスト編集
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  名前
                </label>
                <input
                  type="text"
                  value={editingCast.name || ''}
                  onChange={(e) => setEditingCast({...editingCast, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  LINE
                </label>
                <input
                  type="text"
                  value={editingCast.line || ''}
                  onChange={(e) => setEditingCast({...editingCast, line: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  Twitter
                </label>
                <input
                  type="text"
                  value={editingCast.twitter || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  Twitterパスワード
                </label>
                <input
                  type="text"
                  value={editingCast.twitter_password || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter_password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  Instagram
                </label>
                <input
                  type="text"
                  value={editingCast.instagram || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  Instagramパスワード
                </label>
                <input
                  type="text"
                  value={editingCast.instagram_password || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram_password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  誕生日
                </label>
                <input
                  type="date"
                  value={editingCast.birth_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, birth_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  役職
                </label>
                <select
                  value={editingCast.position || ''}
                  onChange={(e) => setEditingCast({...editingCast, position: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">未設定</option>
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.name}>{pos.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  ステータス
                </label>
                <select
                  value={editingCast.status || '在籍'}
                  onChange={(e) => setEditingCast({...editingCast, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="在籍">在籍</option>
                  <option value="体験">体験</option>
                  <option value="退店">退店</option>
                  <option value="削除済み">削除済み</option>
                </select>
              </div>

              {editingCast.status === '退店' && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '4px' 
                  }}>
                    退店日
                  </label>
                  <input
                    type="date"
                    value={editingCast.retirement_date || ''}
                    onChange={(e) => setEditingCast({...editingCast, retirement_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e5e5e7',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingCast.show_in_pos ?? true}
                    onChange={(e) => setEditingCast({...editingCast, show_in_pos: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px' }}>POS表示</span>
                </label>
              </div>
            </div>

            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={() => {
                  setShowCastModal(false)
                  setEditingCast(null)
                }}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={updateCast}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#007aff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}