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
 * @param date 基準日（Date型）
 * @param businessDayStartHour 営業日の開始時刻（例: 18）
 * @returns { startTime: string, endTime: string } YYYY-MM-DD HH:mm:ss形式
 */
export const getBusinessDayRange = (
  date: Date,
  businessDayStartHour: number
): { startTime: string; endTime: string } => {
  const start = new Date(date)
  start.setHours(businessDayStartHour, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  end.setSeconds(-1) // 23:59:59まで

  return {
    startTime: getJapanTimeString(start),
    endTime: getJapanTimeString(end)
  }
}

/**
 * 営業日の開始時刻と終了時刻を計算（文字列版）
 * @param dateStr 基準日（YYYY-MM-DD形式）
 * @param businessDayStartHour 営業日の開始時刻（例: 18）
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
 * @param date 基準日
 * @param businessDayStartHour 営業日の開始時刻（例: 18）
 * @returns { start: Date, end: Date }
 */
export const getBusinessDayRangeDates = (
  date: Date,
  businessDayStartHour: number
): { start: Date; end: Date } => {
  const start = new Date(date)
  start.setHours(businessDayStartHour, 0, 0, 0)

  const end = new Date(date)
  end.setDate(end.getDate() + 1)
  end.setHours(businessDayStartHour, 0, 0, 0)

  return { start, end }
}
