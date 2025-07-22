import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AttendanceStatusItem {
  id: string
  store_id: string  // uuid型に合わせる
  name: string
  color: string
  is_active: boolean
  order_index: number
}

export default function AttendanceStatus() {
  const [attendanceStatuses, setAttendanceStatuses] = useState<AttendanceStatusItem[]>([])
  const [showAddStatus, setShowAddStatus] = useState(false)
  const [showEditStatus, setShowEditStatus] = useState(false)
  const [editingStatus, setEditingStatus] = useState<AttendanceStatusItem | null>(null)
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#4ECDC4')

  const statusColorPresets = [
    '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0',
    '#00BCD4', '#8BC34A', '#FFC107', '#795548', '#607D8B'
  ]

  // 勤怠ステータスを読み込む
  const loadAttendanceStatuses = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('attendance_statuses')
        .select('*')
        .eq('store_id', storeId)
        .order('order_index')

      if (error) {
        // テーブルが存在しない場合はデフォルトステータスを作成
        if (error.code === '42P01') {
          await createDefaultStatuses()
          return
        }
        throw error
      }
      
      if (!data || data.length === 0) {
        await createDefaultStatuses()
      } else {
        setAttendanceStatuses(data)
      }
    } catch (error) {
      console.error('Error loading attendance statuses:', error)
    }
  }

  // デフォルトステータスを作成
  const createDefaultStatuses = async () => {
    const storeId = getCurrentStoreId()
    const defaultStatuses = [
      { name: '出勤', color: '#4CAF50', is_active: true, order_index: 0 },
      { name: '遅刻', color: '#FF9800', is_active: false, order_index: 1 },
      { name: '早退', color: '#2196F3', is_active: false, order_index: 2 },
      { name: '欠勤', color: '#F44336', is_active: false, order_index: 3 },
      { name: '有給', color: '#9C27B0', is_active: false, order_index: 4 }
    ]

    const statusesToInsert = defaultStatuses.map(status => ({
      ...status,
      store_id: storeId
    }))

    const { error } = await supabase
      .from('attendance_statuses')
      .insert(statusesToInsert)

    if (!error) {
      loadAttendanceStatuses()
    }
  }

  // 勤怠ステータスを追加
  const addAttendanceStatus = async () => {
  if (!newStatusName.trim()) {
    alert('ステータス名を入力してください')
    return
  }

  try {
    // 既に同じ名前のステータスが存在するかチェック
    const isDuplicate = attendanceStatuses.some(s => 
      s.name.toLowerCase() === newStatusName.trim().toLowerCase()
    )
    
    if (isDuplicate) {
      alert(`「${newStatusName.trim()}」は既に登録されています`)
      return
    }
    
    const storeId = getCurrentStoreId()
    console.log('Adding status with store_id:', storeId)
    
    const { error } = await supabase
      .from('attendance_statuses')
      .insert({
        name: newStatusName.trim(),
        color: newStatusColor,
        is_active: false,
        order_index: attendanceStatuses.length,
        store_id: storeId  // 数値のまま使用
      })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    setNewStatusName('')
    setNewStatusColor('#4ECDC4')
    setShowAddStatus(false)
    await loadAttendanceStatuses()
    await updateActiveStatusesInSettings()
  } catch (error) {
    console.error('Error adding status:', error)
    if (error instanceof Error) {
      alert(`ステータスの追加に失敗しました: ${error.message}`)
    } else {
      alert('ステータスの追加に失敗しました')
    }
  }
}


  // ステータスを更新
  const updateStatus = async () => {
  if (!editingStatus || !newStatusName.trim()) {
    alert('ステータス名を入力してください')
    return
  }

  try {
    // 編集中のステータス以外に同じ名前が存在するかチェック
    const isDuplicate = attendanceStatuses.some(s => 
      s.id !== editingStatus.id &&
      s.name.toLowerCase() === newStatusName.trim().toLowerCase()
    )
    
    if (isDuplicate) {
      alert(`「${newStatusName.trim()}」は既に登録されています`)
      return
    }
    
    const { error } = await supabase
      .from('attendance_statuses')
      .update({
        name: newStatusName.trim(),
        color: newStatusColor
      })
      .eq('id', editingStatus.id)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    setEditingStatus(null)
    setNewStatusName('')
    setNewStatusColor('#4ECDC4')
    setShowEditStatus(false)
    await loadAttendanceStatuses()
    await updateActiveStatusesInSettings()
  } catch (error) {
    console.error('Error updating status:', error)
    if (error instanceof Error) {
      alert(`ステータスの更新に失敗しました: ${error.message}`)
    } else {
      alert('ステータスの更新に失敗しました')
    }
  }
}

  // ステータスの有効/無効を切り替え
  const toggleStatusActive = async (statusId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('attendance_statuses')
        .update({ is_active: !currentActive })
        .eq('id', statusId)

      if (error) throw error

      loadAttendanceStatuses()
      updateActiveStatusesInSettings()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  // ステータスを削除
  const deleteStatus = async (statusId: string) => {
    if (!confirm('このステータスを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('attendance_statuses')
        .delete()
        .eq('id', statusId)

      if (error) throw error

      loadAttendanceStatuses()
      updateActiveStatusesInSettings()
    } catch (error) {
      console.error('Error deleting status:', error)
      alert('ステータスの削除に失敗しました')
    }
  }

  // system_settingsのactive_attendance_statusesを更新
  const updateActiveStatusesInSettings = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('attendance_statuses')
        .select('name')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('order_index')

      if (data) {
        const activeStatuses = data.map(s => s.name)
        
        // upsertのonConflictを修正
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: 'active_attendance_statuses',
            setting_value: JSON.stringify(activeStatuses),
            store_id: storeId
          })

        if (error) {
          console.error('Error upserting system_settings:', error)
        }
      }
    } catch (error) {
      console.error('Error updating active statuses in settings:', error)
    }
  }

  useEffect(() => {
    loadAttendanceStatuses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h2 style={{ margin: 0, fontSize: '20px' }}>勤怠ステータス管理</h2>
      <button
        onClick={() => setShowAddStatus(true)}
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
        + ステータス追加
      </button>
    </div>
    
      <div style={{
        backgroundColor: '#e8f5e9',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#2e7d32'
      }}>
        <strong>💡 ヒント:</strong> 有効にしたステータスは業務日報の人数集計で「出勤」として扱われます
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {attendanceStatuses.map((status, index) => (
          <div
            key={status.id}
            style={{
              padding: '15px 20px',
              borderBottom: index < attendanceStatuses.length - 1 ? '1px solid #eee' : 'none',
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
                  backgroundColor: status.color
                }}
              />
              <span style={{ fontSize: '16px', fontWeight: '500' }}>{status.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={status.is_active}
                  onChange={() => toggleStatusActive(status.id, status.is_active)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: status.is_active ? '#4CAF50' : '#666' }}>
                  {status.is_active ? '有効' : '無効'}
                </span>
              </label>
              <button
                onClick={() => {
                  setEditingStatus(status)
                  setNewStatusName(status.name)
                  setNewStatusColor(status.color)
                  setShowEditStatus(true)
                }}
                style={{
                  padding: '5px 15px',
                  backgroundColor: '#2196F3',
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
                onClick={() => deleteStatus(status.id)}
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
          </div>
        ))}
      </div>

      {/* ステータス追加モーダル */}
      {showAddStatus && (
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>ステータス追加</h3>
            
            <input
              type="text"
              placeholder="ステータス名"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
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
                {statusColorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewStatusColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '5px',
                      backgroundColor: color,
                      border: newStatusColor === color ? '3px solid #333' : '1px solid #ddd',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddStatus(false)
                  setNewStatusName('')
                  setNewStatusColor('#4ECDC4')
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
                onClick={addAttendanceStatus}
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

      {/* ステータス編集モーダル */}
      {showEditStatus && (
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>ステータス編集</h3>
            
            <input
              type="text"
              placeholder="ステータス名"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
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
                {statusColorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewStatusColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '5px',
                      backgroundColor: color,
                      border: newStatusColor === color ? '3px solid #333' : '1px solid #ddd',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditStatus(false)
                  setEditingStatus(null)
                  setNewStatusName('')
                  setNewStatusColor('#4ECDC4')
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
                onClick={updateStatus}
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