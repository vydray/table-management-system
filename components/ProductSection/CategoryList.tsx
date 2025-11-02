import React from 'react'

interface CategoryListProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="main-categories">
      <div className="category-title">商品カテゴリー</div>
      {categories.map((category) => (
        <div
          key={category}
          className={`main-category-item ${selectedCategory === category ? 'selected' : ''}`}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </div>
      ))}
    </div>
  )
}