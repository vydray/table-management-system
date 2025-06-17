import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import CastManagement from '../components/settings/CastManagement'
import CategoryManagement from '../components/settings/CategoryManagement'
import ProductManagement from '../components/settings/ProductManagement'
import SystemSettings from '../components/settings/SystemSettings'
import AttendanceStatus from '../components/settings/AttendanceStatus'

export default function Settings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('categories')

  return (
    <>
      <Head>
        <title>設定 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingBottom: '100px'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#4A90E2',
          color: 'white',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              marginRight: '20px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>設定</h1>
        </div>

        {/* タブ */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #eee',
          display: 'flex',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {[
            { id: 'categories', label: 'カテゴリー管理' },
            { id: 'products', label: '商品管理' },
            { id: 'cast', label: 'キャスト管理' },
            { id: 'system', label: 'システム設定' },
            { id: 'attendance', label: '勤怠ステータス' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '15px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #4A90E2' : '3px solid transparent',
                color: activeTab === tab.id ? '#4A90E2' : '#666',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '16px',
                whiteSpace: 'nowrap',
                minWidth: 'auto'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'cast' && <CastManagement />}
          {activeTab === 'system' && <SystemSettings />}
          {activeTab === 'attendance' && <AttendanceStatus />}
        </div>
      </div>
    </>
  )
}