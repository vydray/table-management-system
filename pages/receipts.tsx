import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import ReceiptList from '../components/receipts/ReceiptList'
import ReceiptDetail from '../components/receipts/ReceiptDetail'

// カスタムフック
import { useReceiptsData } from '../hooks/useReceiptsData'

export default function Receipts() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // カスタムフック - 伝票データ管理
  const {
    receipts,
    selectedReceipt,
    setSelectedReceipt,
    orderItems,
    loading,
    businessDayStartHour,
    loadBusinessDayStartHour,
    loadReceipts,
    loadOrderItems,
    deleteReceipt: deleteReceiptFromDB
  } = useReceiptsData()

  // 削除ハンドラー（削除後に一覧を再読み込み）
  const handleDeleteReceipt = async (receiptId: string) => {
    const success = await deleteReceiptFromDB(receiptId)
    if (success) {
      loadReceipts(selectedDate)
    }
  }

  // 初期読み込み
  useEffect(() => {
    loadBusinessDayStartHour()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 日付変更時
  useEffect(() => {
    if (businessDayStartHour !== null) {
      loadReceipts(selectedDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, businessDayStartHour])

  // 伝票選択時
  useEffect(() => {
    if (selectedReceipt) {
      loadOrderItems(selectedReceipt.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReceipt])

  return (
    <>
      <Head>
        <title>📋 伝票管理 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#607D8B',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px',
            fontWeight: 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 伝票管理
          </h1>
        </div>

        <div style={{
          display: 'flex',
          width: '100%',
          height: 'calc(100vh - 54px)'
        }}>
          {/* 左側：伝票一覧 */}
          <div style={{ 
            width: '450px',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f9f9f9'
            }}>
              <h2 style={{ margin: 0, marginBottom: '15px', fontSize: '20px' }}>
                📋 伝票履歴
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: 'white'
                }}
              />
              <div style={{
                marginTop: '5px',
                fontSize: '12px',
                color: '#666'
              }}>
                ※ 営業日（{businessDayStartHour}時〜翌{businessDayStartHour}時）の伝票を表示
              </div>
            </div>
            
            <ReceiptList
              receipts={receipts}
              selectedReceipt={selectedReceipt}
              onSelectReceipt={setSelectedReceipt}
              loading={loading}
            />
          </div>

          {/* 右側：伝票詳細 */}
          <div style={{ 
            flex: 1,
            backgroundColor: '#fff',
            overflow: 'hidden'
          }}>
            <ReceiptDetail
              selectedReceipt={selectedReceipt}
              orderItems={orderItems}
              onDelete={handleDeleteReceipt}
            />
          </div>
        </div>
      </div>
    </>
  )
}