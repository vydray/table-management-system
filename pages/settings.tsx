import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'
import CastManagement from '../components/settings/CastManagement'
import CategoryManagement from '../components/settings/CategoryManagement'
import ProductManagement from '../components/settings/ProductManagement'
import SystemSettings from '../components/settings/SystemSettings'
import AttendanceStatus from '../components/settings/AttendanceStatus'
import ReceiptSettings from '../components/settings/ReceiptSettings'

// カスタムフック
import { useSettingsMenu } from '../hooks/useSettingsMenu'

// スタイル定数
import {
  containerStyle,
  headerStyle,
  backButtonStyle,
  headerTitleStyle,
  mainContentStyle,
  sideMenuStyle,
  getMenuButtonStyle,
  contentAreaStyle,
  contentTitleStyle,
  menuIconStyle
} from '../styles/settingsStyles'

export default function Settings() {
  const router = useRouter()
  const { activeMenu, setActiveMenu, menuItems, getActiveMenuLabel } = useSettingsMenu()

  // URLクエリパラメータでタブを切り替え
  useEffect(() => {
    const { tab } = router.query
    if (tab && typeof tab === 'string') {
      setActiveMenu(tab)
    }
  }, [router.query, setActiveMenu])

  // クリーンアップ: ページアンマウント時にmodal-openクラスを削除
  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  return (
    <>
      <Head>
        <title>設定 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={containerStyle}>
        {/* ヘッダー */}
        <div style={headerStyle}>
          <button onClick={() => router.push('/')} style={backButtonStyle}>
            ←
          </button>
          <h1 style={headerTitleStyle}>
            ⚙️ 設定
          </h1>
        </div>

        {/* メインコンテンツ */}
        <div style={mainContentStyle}>
          {/* 左側サイドメニュー */}
          <div style={sideMenuStyle}>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={getMenuButtonStyle(activeMenu === item.id)}
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
                <span style={menuIconStyle}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* 右側コンテンツエリア */}
          <div style={contentAreaStyle}>
            <h2 style={contentTitleStyle}>
              {getActiveMenuLabel()}
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