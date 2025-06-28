import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import CastManagement from '../components/settings/CastManagement'
import CategoryManagement from '../components/settings/CategoryManagement'
import ProductManagement from '../components/settings/ProductManagement'
import SystemSettings from '../components/settings/SystemSettings'
import AttendanceStatus from '../components/settings/AttendanceStatus'
import ReceiptSettings from '../components/settings/ReceiptSettings'

export default function Settings() {
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState('system')

  const menuItems = [
    { id: 'system', label: 'システム設定', icon: '⚙️' },
    { id: 'products', label: '商品管理', icon: '🛍️' },
    { id: 'categories', label: 'カテゴリー管理', icon: '📁' },
    { id: 'cast', label: 'キャスト管理', icon: '👥' },
    { id: 'attendance', label: '勤怠ステータス', icon: '📊' },
    { id: 'receipt', label: 'レシート設定', icon: '🧾' }
  ]

  return (
    <>
      <Head>
        <title>設定 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#FF9800',
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
            ⚙️ 設定
          </h1>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          display: 'flex',
          flex: 1,
          minHeight: 'calc(100vh - 54px)'
        }}>
          {/* 左側サイドメニュー */}
          <div style={{
            width: '220px',
            backgroundColor: '#f5f5f5',
            borderRight: '1px solid #e0e0e0'
          }}>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: 'none',
                  background: activeMenu === item.id ? '#FF9800' : 'transparent',
                  color: activeMenu === item.id ? 'white' : '#333',
                  fontSize: '14px',
                  fontWeight: activeMenu === item.id ? 'bold' : 'normal',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeMenu !== item.id) {
                    e.currentTarget.style.backgroundColor = '#e0e0e0'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeMenu !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* 右側コンテンツエリア */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            padding: '30px 40px',
            paddingBottom: '100px',
            overflowY: 'auto',
            height: 'calc(100vh - 54px)',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: '-ms-autohiding-scrollbar',
            position: 'relative'
          }}>
            <h2 style={{
              margin: '0 0 30px 0',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              {menuItems.find(item => item.id === activeMenu)?.label}
            </h2>
            
            {activeMenu === 'system' && <SystemSettings />}
            {activeMenu === 'products' && <ProductManagement />}
            {activeMenu === 'categories' && <CategoryManagement />}
            {activeMenu === 'cast' && <CastManagement />}
            {activeMenu === 'attendance' && <AttendanceStatus />}
            {activeMenu === 'receipt' && <ReceiptSettings />}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="padding: '30px 40px'"] {
            padding: 20px !important;
            padding-bottom: 120px !important;
          }
        }
      `}</style>
    </>
  )
}