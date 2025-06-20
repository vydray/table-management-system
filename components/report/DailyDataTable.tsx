import { DailyData } from '../../types/report'

interface DailyDataTableProps {
  dailyData: DailyData[]
  onRowClick: (day: DailyData) => void
}

export default function DailyDataTable({ dailyData, onRowClick }: DailyDataTableProps) {
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

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflowX: 'auto'
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>日別データ</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px', textAlign: 'left', minWidth: '80px' }}>日付</th>
            <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>総売上</th>
            <th style={{ padding: '10px', textAlign: 'right', minWidth: '60px' }}>会計数</th>
            <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>現金売上</th>
            <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>カード売上</th>
            <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>その他</th>
            <th style={{ padding: '10px', textAlign: 'center', minWidth: '50px' }}>初回</th>
            <th style={{ padding: '10px', textAlign: 'center', minWidth: '50px' }}>再訪</th>
            <th style={{ padding: '10px', textAlign: 'center', minWidth: '50px' }}>常連</th>
          </tr>
        </thead>
        <tbody>
          {dailyData.map((day, index) => (
            <tr 
              key={index} 
              style={{ 
                borderBottom: '1px solid #eee',
                backgroundColor: day.orderCount === 0 ? '#f9f9f9' : 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => onRowClick(day)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = day.orderCount === 0 ? '#f9f9f9' : 'white'}
            >
              <td style={{ padding: '10px' }}>{day.date}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                ¥{day.totalSales.toLocaleString()}
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                {day.orderCount}
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                ¥{day.cashSales.toLocaleString()}
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                ¥{day.cardSales.toLocaleString()}
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                ¥{day.otherSales.toLocaleString()}
              </td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {day.firstTimeCount > 0 ? day.firstTimeCount : '-'}
              </td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {day.returnCount > 0 ? day.returnCount : '-'}
              </td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {day.regularCount > 0 ? day.regularCount : '-'}
              </td>
            </tr>
          ))}
          {/* 合計行 */}
          <tr style={{ 
            borderTop: '2px solid #333',
            backgroundColor: '#f0f0f0',
            fontWeight: 'bold'
          }}>
            <td style={{ padding: '10px' }}>合計</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
              ¥{monthlyTotal.totalSales.toLocaleString()}
            </td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
              {monthlyTotal.orderCount}
            </td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
              ¥{monthlyTotal.cashSales.toLocaleString()}
            </td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
              ¥{monthlyTotal.cardSales.toLocaleString()}
            </td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
              ¥{monthlyTotal.otherSales.toLocaleString()}
            </td>
            <td style={{ padding: '10px', textAlign: 'center' }}>
              {monthlyTotal.firstTimeCount}
            </td>
            <td style={{ padding: '10px', textAlign: 'center' }}>
              {monthlyTotal.returnCount}
            </td>
            <td style={{ padding: '10px', textAlign: 'center' }}>
              {monthlyTotal.regularCount}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}