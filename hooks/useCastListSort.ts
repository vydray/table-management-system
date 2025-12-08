export const useCastListSort = (
  castList: string[],
  currentOshi?: string[],
  showOshiFirst?: boolean
) => {
  // キャストリストをソート（推し優先表示設定に基づく）
  const getSortedCastList = () => {
    if (!currentOshi || currentOshi.length === 0) {
      return castList
    }

    // 推しリストに含まれるキャストを抽出
    const oshiInList = currentOshi.filter(name => castList.includes(name))

    if (oshiInList.length === 0) {
      return castList
    }

    if (showOshiFirst) {
      // 推しを先頭に、それ以外は元の順序で
      return [...oshiInList, ...castList.filter(name => !currentOshi.includes(name))]
    }

    return castList
  }

  return {
    sortedCastList: getSortedCastList()
  }
}
