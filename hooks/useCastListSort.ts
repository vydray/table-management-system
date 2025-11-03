export const useCastListSort = (
  castList: string[],
  currentOshi?: string,
  showOshiFirst?: boolean
) => {
  // キャストリストをソート（推し優先表示設定に基づく）
  const getSortedCastList = () => {
    if (!currentOshi || !castList.includes(currentOshi)) {
      return castList
    }

    if (showOshiFirst) {
      return [currentOshi, ...castList.filter(name => name !== currentOshi)]
    }

    return castList
  }

  return {
    sortedCastList: getSortedCastList()
  }
}
