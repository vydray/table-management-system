export interface DailyData {
  date: string
  totalSales: number
  orderCount: number
  cashSales: number
  cardSales: number
  otherSales: number
  firstTimeCount: number
  returnCount: number
  regularCount: number
}

export interface DailyReportData {
  date: string
  eventName: string
  weather?: string
  totalReceipt: number
  totalSales: number
  cashReceipt: number
  cardReceipt: number
  payPayReceipt: number
  otherSales: number
  notTransmittedReceipt: number
  notTransmittedAmount: number
  incomeAmount: number
  expenseAmount: number
  balance: number
  staffCount: number
  castCount: number
  remarks: string
  twitterFollowers: number
  instagramFollowers: number
  tiktokFollowers: number
  dailyPaymentTotal: number
}

export interface MonthlyTargets {
  salesTarget: number
  customerTarget: number
}