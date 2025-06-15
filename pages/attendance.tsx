import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 型定義
interface AttendanceRow {
  id: string
  cast_name: string
  check_in_time: string
  check_out_time: string
  status: string
  late_minutes: number
  break_minutes: number
  daily_payment: number
}

interface Cast {
  id: number
  name: string
}

export default function Attendance() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([])
  const [casts, setCasts] = useState<Cast[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 初期行を5行作成
  const initializeRows = () => {
    const rows: AttendanceRow[] = []
    for (let i = 0; i < 5; i++) {
      rows.push({
        id: `new-${Date.now()}-${i}`,
        cast_name: '',
        check_in_time: '',
        check_out_time: '',
        status: '未設定',
        late_minutes: 0,
        break_minutes: 0,
        daily_payment: 0
      })
    }
    return rows
  }

  // キャスト一覧を取得
  const loadCasts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('casts')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setCasts(data || [])
    } catch (error) {
      console.error('Error loading casts:', error)
    }
  }

  // 勤怠データを読み込む
  const loadAttendance = async () => {
    setLoading(true)
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('store_id', storeId)
        .eq('date', selectedDate)
        .order('cast_name')

      if (error) throw error

      if (data && data.length > 0) {
        // 既存データをフォーマット
        const formattedData = data.map(item => ({
          id: item.id.toString(),
          cast_name: item.cast_name,
          check_in_time: item.check_in_datetime ? new Date(item.check_in_datetime).toTimeString().slice(0, 5) : '',
          check_out_time: item.check_out_datetime ? new Date(item.check_out_datetime).toTimeString().slice(0, 5) : '',
          status: item.status,
          late_minutes: item.late_minutes,
          break_minutes: item.break_minutes,
          daily_payment: item.daily_payment
        }))

        // 既存データ + 空行で5行になるように調整
        const emptyRowsCount = Math.max(5 - formattedData.length, 0)
        const emptyRows = []
        for (let i = 0; i < emptyRowsCount; i++) {
          emptyRows.push({
            id: `new-${Date.now()}-${i}`,
            cast_name: '',
            check_in_time: '',
            check_out_time: '',
            status: '未設定',
            late_minutes: 0,
            break_minutes: 0,
            daily_payment: 0
          })
        }

        setAttendanceRows([...formattedData, ...emptyRows])
      } else {
        // データがない場合は初期行を表示
        setAttendanceRows(initializeRows())
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      setAttendanceRows(initializeRows())
    } finally {
      setLoading(false)
    }
  }

  // 行を追加
  const addRow = () => {
    setAttendanceRows([...attendanceRows, {
      id: `new-${Date.now()}`,
      cast_name: '',
      check_in_time: '',
      check_out_time: '',
      status: '未設定',
      late_minutes: 0,
      break_minutes: 0,
      daily_payment: 0
    }])
  }

  // 行を更新
  const updateRow = (index: number, field: keyof AttendanceRow, value: string | number) => {
    const newRows = [...attendanceRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setAttendanceRows(newRows)
  }

  // 保存
  const saveAttendance = async () => {
    setSaving(true)
    try {
      const storeId = getCurrentStoreId()
      
      // 入力のある行のみ処理
      const validRows = attendanceRows.filter(row => row.cast_name.trim() !== '')
      
      for (const row of validRows) {
        // 日時の作成（日付跨ぎ対応）
        let checkInDatetime = null
        let checkOutDatetime = null
        
        if (row.check_in_time) {
          checkInDatetime = `${selectedDate} ${row.check_in_time}:00`
        }
        
        if (row.check_out_time) {
          checkOutDatetime = `${selectedDate} ${row.check_out_time}:00`
          
          // 退勤が出勤より早い時間なら翌日として扱う
          if (row.check_in_time && row.check_out_time < row.check_in_time) {
            const nextDay = new Date(selectedDate)
            nextDay.setDate(nextDay.getDate() + 1)
            checkOutDatetime = `${nextDay.toISOString().split('T')[0]} ${row.check_out_time}:00`
          }
        }

        const attendanceData = {
          store_id: storeId,
          date: selectedDate,
          cast_name: row.cast_name,
          check_in_datetime: checkInDatetime,
          check_out_datetime: checkOutDatetime,
          status: row.status,
          late_minutes: row.late_minutes,
          break_minutes: row.break_minutes,
          daily_payment: row.daily_payment,
          updated_at: new Date().toISOString()
        }

        // upsert（更新または挿入）
        const { error } = await supabase
          .from('attendance')
          .upsert(attendanceData, {
            onConflict: 'store_id,date,cast_name'
          })

        if (error) throw error
      }

      alert('保存しました')
      // 再読み込みして最新状態を表示
      loadAttendance()
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadCasts()
  }, [])

  useEffect(() => {
    loadAttendance()
  }, [selectedDate])

  // 時間の選択肢を生成（10:00〜29:00）
  const generateTimeOptions = () => {
    const options = ['']
    for (let hour = 10; hour <= 29; hour++) {
      const displayHour = hour > 24 ? hour - 24 : hour
      for (const minute of ['00', '30']) {
        options.push(`${displayHour.toString().padStart(2, '0')}:${minute}`)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  return (
    <>
      <Head>
        <title>👥 勤怠登録 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        width: '1024px',
        height: '768px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ←
            </button>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
              👥 勤怠登録
            </h1>
          </div>

          <div style={{ fontSize: '18px', fontWeight: '500' }}>
            {selectedDate}
          </div>
        </div>

        {/* 日付選択 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>📅 日付選択:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* テーブル */}
        <div style={{
          flex: 1,
          backgroundColor: '#fff',
          margin: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'auto'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              読み込み中...
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f8f8' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', minWidth: '120px' }}>
                    名前
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', minWidth: '90px' }}>
                    出勤時間
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', minWidth: '90px' }}>
                    退勤時間
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', minWidth: '90px' }}>
                    出勤状況
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', minWidth: '70px' }}>
                    遅刻
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', minWidth: '70px' }}>
                    休憩
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', minWidth: '90px' }}>
                    日払い
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.cast_name}
                        onChange={(e) => updateRow(index, 'cast_name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">選択</option>
                        {casts.map(cast => (
                          <option key={cast.id} value={cast.name}>{cast.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.check_in_time}
                        onChange={(e) => updateRow(index, 'check_in_time', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time || '--:--'}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.check_out_time}
                        onChange={(e) => updateRow(index, 'check_out_time', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time || '--:--'}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.status}
                        onChange={(e) => updateRow(index, 'status', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="未設定">----</option>
                        <option value="出勤">出勤</option>
                        <option value="出勤中">出勤中</option>
                        <option value="欠勤">欠勤</option>
                        <option value="遅刻">遅刻</option>
                        <option value="早退">早退</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.late_minutes}
                        onChange={(e) => updateRow(index, 'late_minutes', Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value={0}>0分</option>
                        <option value={15}>15分</option>
                        <option value={30}>30分</option>
                        <option value={45}>45分</option>
                        <option value={60}>60分</option>
                        <option value={90}>90分</option>
                        <option value={120}>120分</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.break_minutes}
                        onChange={(e) => updateRow(index, 'break_minutes', Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value={0}>0分</option>
                        <option value={30}>30分</option>
                        <option value={60}>60分</option>
                        <option value={90}>90分</option>
                        <option value={120}>120分</option>
                        <option value={150}>150分</option>
                        <option value={180}>180分</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        value={row.daily_payment}
                        onChange={(e) => updateRow(index, 'daily_payment', Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          textAlign: 'right'
                        }}
                        step="1000"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ボタンエリア */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={addRow}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            + 行を追加
          </button>

          <button
            onClick={saveAttendance}
            disabled={saving}
            style={{
              padding: '12px 40px',
              backgroundColor: saving ? '#ccc' : '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </>
  )
}