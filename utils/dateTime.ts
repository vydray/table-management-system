/**
 * 日本時間をYYYY-MM-DD HH:mm:ss形式で取得
 */
export const getJapanTimeString = (date: Date): string => {
  const japanTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))

  const year = japanTime.getFullYear()
  const month = String(japanTime.getMonth() + 1).padStart(2, '0')
  const day = String(japanTime.getDate()).padStart(2, '0')
  const hours = String(japanTime.getHours()).padStart(2, '0')
  const minutes = String(japanTime.getMinutes()).padStart(2, '0')
  const seconds = String(japanTime.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * YYYY-MM-DD形式の日付文字列を取得
 */
export const getDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 営業日の開始時刻と終了時刻を計算
 * @param date 基準日（営業日の終了日）
 * @param businessDayStartHour 営業日の開始時刻（例: 13）
 * @returns { startTime: string, endTime: string } YYYY-MM-DD HH:mm:ss形式
 *
 * 例: date="2025-11-04", businessDayStartHour=13の場合
 * startTime: "2025-11-03 13:00:00"
 * endTime:   "2025-11-04 12:59:59"
 * （11月4日の営業日 = 11月3日13:00～11月4日13:00の直前）
 */
export const getBusinessDayRange = (
  date: Date,
  businessDayStartHour: number
): { startTime: string; endTime: string } => {
  // 終了時刻 = 指定日の営業開始時刻の直前
  const end = new Date(date)
  end.setHours(businessDayStartHour, 0, 0, 0)
  end.setSeconds(-1) // 13:00の直前（12:59:59）

  // 開始時刻 = 前日の営業開始時刻
  const start = new Date(date)
  start.setDate(start.getDate() - 1)
  start.setHours(businessDayStartHour, 0, 0, 0)

  return {
    startTime: getJapanTimeString(start),
    endTime: getJapanTimeString(end)
  }
}

/**
 * 営業日の開始時刻と終了時刻を計算（文字列版）
 * @param dateStr 基準日（営業日の終了日、YYYY-MM-DD形式）
 * @param businessDayStartHour 営業日の開始時刻（例: 13）
 * @returns { startTime: string, endTime: string } YYYY-MM-DD HH:mm:ss形式
 */
export const getBusinessDayRangeFromString = (
  dateStr: string,
  businessDayStartHour: number
): { startTime: string; endTime: string } => {
  const date = new Date(dateStr + 'T00:00:00')
  return getBusinessDayRange(date, businessDayStartHour)
}

/**
 * 営業日の開始・終了時刻を計算（Dateオブジェクト版）
 * @param date 基準日（営業日の終了日）
 * @param businessDayStartHour 営業日の開始時刻（例: 13）
 * @returns { start: Date, end: Date }
 *
 * 例: date="2025-11-04", businessDayStartHour=13の場合
 * start: 2025-11-03 13:00:00
 * end:   2025-11-04 13:00:00
 * （11月4日の営業日 = 11月3日13:00～11月4日13:00）
 */
export const getBusinessDayRangeDates = (
  date: Date,
  businessDayStartHour: number
): { start: Date; end: Date } => {
  // 終了時刻 = 指定日の営業開始時刻
  const end = new Date(date)
  end.setHours(businessDayStartHour, 0, 0, 0)

  // 開始時刻 = 前日の営業開始時刻
  const start = new Date(date)
  start.setDate(start.getDate() - 1)
  start.setHours(businessDayStartHour, 0, 0, 0)

  return { start, end }
}
