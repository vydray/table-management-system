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
 * @param date 基準日（営業日の開始日）
 * @param businessDayStartHour 営業日の開始時刻（例: 13）
 * @returns { startTime: string, endTime: string } YYYY-MM-DD HH:mm:ss形式
 *
 * 例: date="2025-11-04", businessDayStartHour=13の場合
 * startTime: "2025-11-04 13:00:00"
 * endTime:   "2025-11-05 12:59:59"
 * （11月4日の営業日 = 11月4日13:00～11月5日13:00の直前）
 */
export const getBusinessDayRange = (
  date: Date,
  businessDayStartHour: number
): { startTime: string; endTime: string } => {
  // 開始時刻 = 指定日の営業開始時刻
  const start = new Date(date)
  start.setHours(businessDayStartHour, 0, 0, 0)

  // 終了時刻 = 翌日の営業開始時刻の直前
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  end.setSeconds(-1) // 翌日13:00の直前（12:59:59）

  return {
    startTime: getJapanTimeString(start),
    endTime: getJapanTimeString(end)
  }
}

/**
 * 営業日の開始時刻と終了時刻を計算（文字列版）
 * @param dateStr 基準日（営業日の開始日、YYYY-MM-DD形式）
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
 * @param date 基準日（営業日の開始日）
 * @param businessDayStartHour 営業日の開始時刻（例: 13）
 * @returns { start: Date, end: Date }
 *
 * 例: date="2025-11-04", businessDayStartHour=13の場合
 * start: 2025-11-04 13:00:00
 * end:   2025-11-05 13:00:00
 * （11月4日の営業日 = 11月4日13:00～11月5日13:00）
 */
export const getBusinessDayRangeDates = (
  date: Date,
  businessDayStartHour: number
): { start: Date; end: Date } => {
  // 開始時刻 = 指定日の営業開始時刻
  const start = new Date(date)
  start.setHours(businessDayStartHour, 0, 0, 0)

  // 終了時刻 = 翌日の営業開始時刻
  const end = new Date(date)
  end.setDate(end.getDate() + 1)
  end.setHours(businessDayStartHour, 0, 0, 0)

  return { start, end }
}

/**
 * 指定日時から営業日（YYYY-MM-DD）を計算
 * @param datetime 日時
 * @param businessDayStartHour 営業日の開始時刻（例: 15）
 * @returns 営業日（YYYY-MM-DD形式）
 *
 * 例: datetime="2025-11-08 03:03:24", businessDayStartHour=15の場合
 * 3時は15時より前なので、前日の営業日とみなす
 * return: "2025-11-07"
 *
 * 例: datetime="2025-11-08 16:00:00", businessDayStartHour=15の場合
 * 16時は15時以降なので、当日の営業日とみなす
 * return: "2025-11-08"
 */
export const getBusinessDateFromDateTime = (
  datetime: Date,
  businessDayStartHour: number
): string => {
  const hour = datetime.getHours()
  const businessDate = new Date(datetime)

  // 営業開始時刻より前の場合は前日の営業日とする
  if (hour < businessDayStartHour) {
    businessDate.setDate(businessDate.getDate() - 1)
  }

  return getDateString(businessDate)
}
