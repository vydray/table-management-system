import { DailyData } from '../../types/report'

interface MonthlySummaryProps {
  dailyData: DailyData[]
}

export default function MonthlySummary({ dailyData }: MonthlySummaryProps) {
  const monthlyTotal = dailyData.reduce((acc, cur) => ({
    totalSales: acc.totalSales + cur.totalSales,
    orderCount: acc.orderCount + cur.orderCount,
    cashSales: acc.cashSales + cur.cashSales,
    cardSales: acc.cardSales + cur.cardSales,
    otherSales: acc.otherSales + cur.otherSales,
    firstTimeCount: acc.firstTimeCount + cur.firstTimeCount,
    returnCount: acc.returnCount + cur.returnCount,
    regularCount: acc.regularCount + cur.regularCount
  }), {
    totalSales: 0,
    orderCount: 0,
    cashSales: 0,
    cardSales: 0,
    otherSales: 0,
    firstTimeCount: 0,
    returnCount: 0,
    regularCount: 0
  })

  const averagePrice = monthlyTotal.orderCount > 0 
    ? Math.floor(monthlyTotal.totalSales / monthlyTotal.orderCount) 
    : 0

  const businessDays = dailyData.filter(d => d.orderCount > 0).length

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>月次集計</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>総売上</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            ¥{monthlyTotal.totalSales.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>会計数</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {monthlyTotal.orderCount}件
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>客単価</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            ¥{averagePrice.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>営業日数</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
            {businessDays}日
          </div>
        </div>
      </div>
    </div>
  )
}