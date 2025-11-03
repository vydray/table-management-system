export const useProductHandlers = (
  addProductData: (name: string, price: string, categoryId: number, needsCast: boolean) => Promise<boolean>,
  updateProductData: (id: number, name: string, price: string, categoryId: number, needsCast: boolean) => Promise<boolean>,
  setNewProductName: (name: string) => void,
  setNewProductPrice: (price: string) => void,
  setNewProductCategory: (categoryId: number | null) => void,
  setNewProductNeedsCast: (needsCast: boolean) => void,
  closeModal: () => void
) => {
  // 商品追加のラッパー関数
  const addProduct = async (
    newProductName: string,
    newProductPrice: string,
    newProductCategory: number | null,
    newProductNeedsCast: boolean
  ) => {
    const success = await addProductData(
      newProductName,
      newProductPrice,
      newProductCategory!,
      newProductNeedsCast
    )

    if (success) {
      setNewProductName('')
      setNewProductPrice('')
      setNewProductCategory(null)
      setNewProductNeedsCast(false)
    }
  }

  // 商品更新のラッパー関数
  const updateProduct = async (
    editingProduct: { id: number; category_id: number } | null,
    newProductName: string,
    newProductPrice: string,
    newProductNeedsCast: boolean
  ) => {
    if (!editingProduct) return

    const success = await updateProductData(
      editingProduct.id,
      newProductName,
      newProductPrice,
      editingProduct.category_id,
      newProductNeedsCast
    )

    if (success) {
      closeModal()
    }
  }

  return {
    addProduct,
    updateProduct
  }
}
