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
  status?: string
}

export default function Attendance() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([])
  const [casts, setCasts] = useState<Cast[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // ドロップダウンの表示状態
  const [showDropdowns, setShowDropdowns] = useState<{[key: string]: boolean}>({})

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
        .select('id, name, status')
        .eq('store_id', storeId)
        .in('status', ['在籍', '体験'])  // 在籍と体験のみ表示
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

  // 行を更新（金額フォーマット対応）
  const updateRow = (index: number, field: keyof AttendanceRow, value: string | number) => {
    const newRows = [...attendanceRows]
    
    // 日払い金額の場合は特別処理
    if (field === 'daily_payment') {
      // 数値以外の文字を削除してから数値に変換
      const numericValue = parseInt(value.toString().replace(/[^\d]/g, '') || '0')
      newRows[index] = { ...newRows[index], [field]: numericValue }
    } else {
      newRows[index] = { ...newRows[index], [field]: value }
    }
    
    setAttendanceRows(newRows)
  }

  // キャスト名の選択
  const selectCast = (index: number, castName: string) => {
    updateRow(index, 'cast_name', castName)
    setShowDropdowns({ ...showDropdowns, [index]: false })
  }

  // ドロップダウンの表示/非表示
  const toggleDropdown = (index: number, show: boolean) => {
    setShowDropdowns({ ...showDropdowns, [index]: show })
  }

  // 金額をフォーマット（¥とカンマ付き）
  const formatCurrency = (value: number): string => {
    if (!value) return ''
    return `¥${value.toLocaleString()}`
  }

  // 金額入力をハンドル
  const handleCurrencyInput = (index: number, value: string) => {
    // ¥とカンマを除去して数値のみ抽出
    const numericValue = value.replace(/[¥,]/g, '')
    updateRow(index, 'daily_payment', numericValue)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // クリックイベントの処理（ドロップダウンを閉じる）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.cast-name-container')) {
        setShowDropdowns({})
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

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

      <style jsx global>{`
        /* 勤怠登録ページ専用のスタイル */
        body {
          overflow: auto !important;
          position: static !important;
        }
        
        /* テーブルのフォントサイズを強制 */
        .attendance-page table {
          font-size: 14px !important;
        }
        
        .attendance-page td,
        .attendance-page th {
          font-size: 14px !important;
        }
        
        .attendance-page select,
        .attendance-page input {
          font-size: 14px !important;
        }
        
        /* スクロールバーのスタイル */
        .attendance-page ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .attendance-page ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .attendance-page ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .attendance-page ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      <div className="attendance-page" style={{
        width: '1024px',
        height: '768px',
        margin: '0 auto',
        backgroundColor: '#f2f2f7',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                color: '#007AFF',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ← 戻る
            </button>
            <h1 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: '600',
              color: '#000'
            }}>
              勤怠登録
            </h1>
          </div>

          <div style={{ 
            fontSize: '18px', 
            fontWeight: '500',
            color: '#000'
          }}>
            {new Date(selectedDate).toLocaleDateString('ja-JP', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </div>
        </div>

        {/* 日付選択 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '16px',
              color: '#000',
              fontWeight: '500'
            }}>
              日付:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: '#f8f8f8',
                color: '#000',
                fontWeight: '500',
                WebkitAppearance: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#007AFF'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
            />
          </div>
        </div>

        {/* テーブル */}
        <div style={{
          flex: 1,
          backgroundColor: '#fff',
          margin: '0 16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {loading ? (
            <div style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8e8e93',
              fontSize: '18px'
            }}>
              読み込み中...
            </div>
          ) : (
            <div style={{ 
              flex: 1,
              overflowX: 'auto',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                fontSize: '14px'
              }}>
                <thead style={{ 
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f8f8f8',
                  zIndex: 10
                }}>
                  <tr>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'left', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '140px'
                    }}>
                      名前
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '100px'
                    }}>
                      出勤
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '100px'
                    }}>
                      退勤
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '100px'
                    }}>
                      状況
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '90px'
                    }}>
                      遅刻
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '90px'
                    }}>
                      休憩
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '110px'
                    }}>
                      日払
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((row, index) => (
                    <tr key={row.id} style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '8px', position: 'relative' }}>
                        <div className="cast-name-container" style={{ position: 'relative' }}>
                          <div
                            onClick={() => toggleDropdown(index, !showDropdowns[index])}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              paddingRight: '30px',
                              border: '1px solid #d0d0d0',
                              borderRadius: '6px',
                              fontSize: '14px',
                              backgroundColor: '#fff',
                              color: row.cast_name ? '#000' : '#999',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box',
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#007AFF'
                              e.currentTarget.style.backgroundColor = '#f8f8f8'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#d0d0d0'
                              e.currentTarget.style.backgroundColor = '#fff'
                            }}
                          >
                            {row.cast_name || 'キャストを選択'}
                          </div>
                          
                          {/* ドロップダウン矢印 */}
                          <span style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: '#666',
                            fontSize: '12px'
                          }}>
                            ▼
                          </span>
                          
                          {/* ドロップダウンリスト */}
                          {showDropdowns[index] && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              maxHeight: '300px',
                              overflowY: 'auto',
                              backgroundColor: '#fff',
                              border: '1px solid #007AFF',
                              borderRadius: '6px',
                              marginTop: '2px',
                              zIndex: 1000,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                              {casts.length === 0 ? (
                                <div style={{
                                  padding: '10px 12px',
                                  fontSize: '14px',
                                  color: '#888',
                                  textAlign: 'center'
                                }}>
                                  キャストが登録されていません
                                </div>
                              ) : (
                                <>
                                  {/* 未選択オプション */}
                                  <div
                                    onClick={() => selectCast(index, '')}
                                    style={{
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      borderBottom: '1px solid #f0f0f0',
                                      transition: 'background-color 0.2s',
                                      color: '#999'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    -- 未選択 --
                                  </div>
                                  {casts.map(cast => (
                                    <div
                                      key={cast.id}
                                      onClick={() => selectCast(index, cast.name)}
                                      style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background-color 0.2s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <span>{cast.name}</span>
                                      {cast.status === '体験' && (
                                        <span style={{
                                          fontSize: '12px',
                                          color: '#888',
                                          marginLeft: '8px'
                                        }}>
                                          (体験)
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.check_in_time}
                          onChange={(e) => updateRow(index, 'check_in_time', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
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
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
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
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: row.status === '出勤' ? '#e6f7e6' : 
                                           row.status === '当欠' ? '#ffe6e6' : 
                                           row.status === '無欠' ? '#ffe6e6' : 
                                           row.status === '遅刻' ? '#fff7e6' : 
                                           row.status === '早退' ? '#fff7e6' : 
                                           row.status === '公欠' ? '#e6e6ff' : 
                                           row.status === '事前欠' ? '#f0e6ff' : '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            fontWeight: '600',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#007AFF'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#d0d0d0'}
                        >
                          <option value="未設定">未設定</option>
                          <option value="出勤">出勤</option>
                          <option value="当欠">当欠</option>
                          <option value="無欠">無欠</option>
                          <option value="遅刻">遅刻</option>
                          <option value="早退">早退</option>
                          <option value="公欠">公欠</option>
                          <option value="事前欠">事前欠</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.late_minutes}
                          onChange={(e) => updateRow(index, 'late_minutes', Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
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
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
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
                          type="text"
                          value={formatCurrency(row.daily_payment)}
                          onChange={(e) => handleCurrencyInput(index, e.target.value)}
                          placeholder="¥0"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'right',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ボタンエリア */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={addRow}
            style={{
              padding: '14px 28px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              color: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span> 行を追加
          </button>

          <button
            onClick={saveAttendance}
            disabled={saving}
            style={{
              padding: '14px 48px',
              backgroundColor: saving ? '#c0c0c0' : '#007AFF',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(0,122,255,0.3)'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#0051D5'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,255,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#007AFF'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,122,255,0.3)'
              }
            }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </>
  )
}