import { CSSProperties } from 'react'

export const containerStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5'
}

export const headerStyle: CSSProperties = {
  backgroundColor: '#FF9800',
  color: 'white',
  padding: '15px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px'
}

export const backButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '5px',
  display: 'flex',
  alignItems: 'center'
}

export const headerTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 'normal',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

export const mainContentStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 'calc(100vh - 54px)'
}

export const sideMenuStyle: CSSProperties = {
  width: '220px',
  backgroundColor: '#f5f5f5',
  borderRight: '1px solid #e0e0e0'
}

export const getMenuButtonStyle = (isActive: boolean): CSSProperties => ({
  width: '100%',
  padding: '15px 20px',
  border: 'none',
  background: isActive ? '#FF9800' : 'transparent',
  color: isActive ? 'white' : '#333',
  fontSize: '14px',
  fontWeight: isActive ? 'bold' : 'normal',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  transition: 'all 0.2s'
})

export const contentAreaStyle: CSSProperties = {
  flex: 1,
  backgroundColor: 'white',
  padding: '30px 40px',
  paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
  overflowY: 'auto',
  height: 'calc(100vh - 54px)',
  WebkitOverflowScrolling: 'touch',
  msOverflowStyle: '-ms-autohiding-scrollbar',
  position: 'relative'
}

export const contentTitleStyle: CSSProperties = {
  margin: '0 0 30px 0',
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333'
}

export const menuIconStyle: CSSProperties = {
  fontSize: '16px'
}
