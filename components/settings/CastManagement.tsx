import { useState, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// getCurrentStoreIdの結果を数値に変換するヘルパー関数
const getStoreIdAsNumber = (): number => {
  // 型アサーションを使って一時的に回避
  const storeId = getCurrentStoreId() as unknown as string
  const numericId = parseInt(storeId)
  
  // デバッグ用ログ
  console.log('Store ID conversion:', { original: storeId, numeric: numericId })
  
  // デフォルトは1ではなく、エラーを明確にする
  if (isNaN(numericId) || numericId <= 0) {
    console.error('Invalid store ID:', storeId)
    return 1 // または throw new Error('Invalid store ID')
  }
  
  return numericId
}

// キャストの型定義（正しいカラム名）
interface Cast {
  id: number
  store_id: number
  name: string | null
  line_number: string | null
  twitter: string | null
  password: string | null
  instagram: string | null
  password2: string | null
  photo: string | null
  attributes: string | null
  is_writer: boolean | null
  submission_date: string | null
  back_number: string | null
  status: string | null
  sales_previous_day: string | null
  cast_point: number | null
  show_in_pos: boolean | null
  birthday: string | null
  created_at: string | null
  updated_at: string | null
  resignation_date: string | null
  attendance_certificate: boolean | null
  residence_record: boolean | null
  contract_documents: boolean | null
  submission_contract: string | null
  employee_name: string | null
  experience_date: string | null
  hire_date: string | null
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
  const [isNewCast, setIsNewCast] = useState(false)

  // スプレッドシート連携機能を削除（コメントアウト）
  // const gasUrl = 'https://script.google.com/macros/s/AKfycbw193siFFyTAHwlDIJGFh6GonwWSYsIPHaGA3_0wMNIkm2-c8LGl7ny6vqZmzagdFQFCw/exec'
  
  // GAS送信機能を無効化（完全に削除）
  // const sendToGAS = async (cast: Cast, isNewCast: boolean = false) => {
  //   console.log('スプレッドシート連携は無効化されています')
  //   return true
  // }

  // ステータスの背景色を取得
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case '在籍':
        return '#e6f7e6'
      case '体験':
        return '#fff7e6'
      case '退店':
        return '#f0f0f0'
      default:
        return '#ffffff'
    }
  }

  // 役職一覧を読み込む
  const loadPositions = async () => {
    try {
      const storeId = getStoreIdAsNumber()
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
      const storeId = getStoreIdAsNumber()
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
      const storeId = getStoreIdAsNumber()
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

  // キャスト一覧を読み込む（管理者対応版）
  const loadCasts = async () => {
    try {
      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証されていません')
      
      // ユーザーの詳細情報を取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('store_id, is_admin')  // is_adminフィールドがある場合
        .eq('id', user.id)
        .single()
      
      if (userError) throw userError
      
      let query = supabase.from('casts').select('*')
      
      // 管理者でない場合は、自分の店舗のみ表示
      if (!userData?.is_admin) {
        const storeId = userData?.store_id || getStoreIdAsNumber()
        console.log('Loading casts for store_id:', storeId)
        query = query.eq('store_id', storeId)
      } else {
        console.log('Loading all casts (admin mode)')
      }
      
      const { data, error } = await query.order('id')
      
      if (error) {
        console.error('Failed to load casts:', error)
        throw error
      }
      
      console.log('Loaded casts:', data)
      setCasts(data || [])
    } catch (error) {
      console.error('Failed to load casts:', error)
      alert('キャスト一覧の読み込みに失敗しました: ' + (error as Error).message)
    }
  }

  // 新規キャスト追加
  const addNewCast = async () => {
    if (!editingCast) return
    
    // 必須フィールドを含む新規キャストデータ
    const newCast = {
      name: editingCast.name || '新規キャスト',
      store_id: getStoreIdAsNumber(),
      status: editingCast.status || '体験',
      show_in_pos: editingCast.show_in_pos ?? false,
      attributes: editingCast.attributes || null,
      twitter: editingCast.twitter || null,
      instagram: editingCast.instagram || null,
      birthday: editingCast.birthday || null,
      experience_date: editingCast.experience_date || null,
      hire_date: editingCast.hire_date || null,
      // 以下のフィールドはデフォルト値を設定
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    try {
      const { error } = await supabase
        .from('casts')
        .insert(newCast)
      
      if (error) throw error
      
      alert('新規キャストを追加しました')
      await loadCasts()
      setShowCastModal(false)
      setEditingCast(null)
      setShowCastModal(false)
      setEditingCast(null)
    } catch (error) {
      console.error('Failed to add new cast:', error)
      alert('キャストの追加に失敗しました')
    }
  }

  // キャストを完全削除
  const deleteCast = async () => {
    if (!editingCast || !editingCast.id) return
    
    if (!confirm(`${editingCast.name}を完全に削除しますか？\n\n※この操作は取り消せません`)) return
    
    try {
      const storeId = getStoreIdAsNumber()
      
      // Supabaseから完全削除
      const { error } = await supabase
        .from('casts')
        .delete()
        .eq('id', editingCast.id)
        .eq('store_id', storeId)

      if (error) throw error
      
      alert('キャストを削除しました')
      await loadCasts()
      setShowCastModal(false)
      setEditingCast(null)
    } catch (error) {
      console.error('Failed to delete cast:', error)
      alert('削除に失敗しました')
    }
  }

  // キャストの役職を更新（修正版）
  const updateCastPosition = async (cast: Cast, newPosition: string) => {
    try {
      const storeId = getStoreIdAsNumber()
      
      const { error } = await supabase
        .from('casts')
        .update({ 
          attributes: newPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, attributes: newPosition } : c
      ))
      
      console.log(`${cast.name}の役職を更新しました`)
    } catch (error) {
      console.error('Error updating position:', error)
      alert('役職の更新に失敗しました')
    }
  }

  // キャストのステータスを更新（修正版）
  const updateCastStatus = async (cast: Cast, newStatus: string) => {
    // 退店を選択した場合は退店日設定モーダルを表示
    if (newStatus === '退店') {
      setRetirementCast(cast)
      setRetirementDate(new Date().toISOString().split('T')[0])
      setShowRetirementModal(true)
      return
    }

    try {
      const storeId = getStoreIdAsNumber()
      
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // 退店以外のステータスに変更する場合は退店日をクリア
      if (newStatus !== '退店') {
        updateData.resignation_date = null
      }
      
      const { error } = await supabase
        .from('casts')
        .update(updateData)
        .eq('id', cast.id)
        .eq('store_id', storeId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 更新されたキャストの状態を定義
      const updatedCast = { 
        ...cast, 
        status: newStatus, 
        resignation_date: (updateData.resignation_date as string | null) || null 
      }
      
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...updatedCast } : c
      ))
      
      console.log(`${cast.name}のステータスを更新しました`)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('ステータス更新に失敗しました')
    }
  }

  // 退店処理
  const confirmRetirement = async () => {
    if (!retirementCast || !retirementDate) return

    try {
      const storeId = getStoreIdAsNumber()
      
      const { error } = await supabase
        .from('casts')
        .update({ 
          status: '退店',
          resignation_date: retirementDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', retirementCast.id)
        .eq('store_id', storeId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 更新されたキャストの状態を定義
      const updatedCast = { ...retirementCast, status: '退店', resignation_date: retirementDate }
      
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

  // キャストのPOS表示を切り替える関数（修正版）
  const toggleCastShowInPos = async (cast: Cast) => {
    try {
      const storeId = getStoreIdAsNumber()
      const newValue = !cast.show_in_pos
      
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
      
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, show_in_pos: newValue } : c
      ))
      
      console.log(`${cast.name}のPOS表示を更新しました`)
    } catch (error) {
      console.error('Error toggling show_in_pos:', error)
      alert('更新に失敗しました')
    }
  }

  // キャスト情報を更新する関数（修正版）
  const updateCast = async () => {
    if (!editingCast) return

    try {
      const storeId = getStoreIdAsNumber()
      
      const updateData: Record<string, unknown> = {
        name: editingCast.name || '',
        twitter: editingCast.twitter || '',
        instagram: editingCast.instagram || '',
        attributes: editingCast.attributes || '',
        status: editingCast.status || '',
        show_in_pos: editingCast.show_in_pos ?? true,
        birthday: editingCast.birthday || null,
        resignation_date: editingCast.resignation_date,
        attendance_certificate: editingCast.attendance_certificate || false,
        residence_record: editingCast.residence_record || false,
        contract_documents: editingCast.contract_documents || false,
        submission_contract: editingCast.submission_contract || '',
        employee_name: editingCast.employee_name || '',
        experience_date: editingCast.experience_date || null,
        hire_date: editingCast.hire_date || null,
        sales_previous_day: editingCast.sales_previous_day || '無',
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('casts')
        .update(updateData)
        .eq('id', editingCast.id)
        .eq('store_id', storeId)

      if (error) throw error
      
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
    // Supabase接続テスト
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('casts')
          .select('count')
          .single()
        
        console.log('Supabase connection test:', { data, error })
      } catch (err) {
        console.error('Supabase connection error:', err)
      }
    }
    
    testConnection()
    loadCasts()
    loadPositions()
  }, [])

  // 検索処理
  useEffect(() => {
    const filtered = casts.filter(cast => {
      const name = cast.name || ''
      const position = cast.attributes || ''
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
            onClick={() => {
              setEditingCast({
                id: 0,
                store_id: getStoreIdAsNumber(),
                name: '',
                line_number: null,
                twitter: null,
                password: null,
                instagram: null,
                password2: null,
                photo: null,
                attributes: null,
                is_writer: null,
                submission_date: null,
                back_number: null,
                status: '体験',
                sales_previous_day: null,
                cast_point: null,
                show_in_pos: false,
                birthday: null,
                created_at: null,
                updated_at: null,
                resignation_date: null,
                attendance_certificate: null,
                residence_record: null,
                contract_documents: null,
                submission_contract: null,
                employee_name: null,
                experience_date: null,
                hire_date: null
              })
              setIsNewCast(true)
              setShowCastModal(true)
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            新規追加
          </button>
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
                    {cast.resignation_date && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        ({new Date(cast.resignation_date).toLocaleDateString('ja-JP')}退店)
                      </span>
                    )}
                  </td>
                  <td style={{ 
                    padding: '12px 16px'
                  }}>
                    <select
                      value={cast.attributes || ''}
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
                        setIsNewCast(false)
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
              {isNewCast ? '新規キャスト追加' : 'キャスト編集'}
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
                  誕生日（4桁: 例 0401）
                </label>
                <input
                  type="text"
                  value={editingCast.birthday || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setEditingCast({...editingCast, birthday: value})
                  }}
                  placeholder="0401"
                  maxLength={4}
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
                  体験入店日
                </label>
                <input
                  type="date"
                  value={editingCast.experience_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, experience_date: e.target.value})}
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
                  本入店日
                </label>
                <input
                  type="date"
                  value={editingCast.hire_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, hire_date: e.target.value})}
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
                  value={editingCast.attributes || ''}
                  onChange={(e) => setEditingCast({...editingCast, attributes: e.target.value})}
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
                    value={editingCast.resignation_date || ''}
                    onChange={(e) => setEditingCast({...editingCast, resignation_date: e.target.value})}
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
              justifyContent: 'space-between', 
              gap: '12px' 
            }}>
              <div>
                {!isNewCast && editingCast?.id && (
                  <button
                    onClick={deleteCast}
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
                    削除
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowCastModal(false)
                    setEditingCast(null)
                    setIsNewCast(false)
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
                  onClick={isNewCast ? addNewCast : updateCast}
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
                  {isNewCast ? '追加' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}