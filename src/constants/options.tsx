export const MENU_CATEGORIES = [
  { value: 'all', label: 'Semua' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'non coffee', label: 'Non Coffee' },
  { value: 'food', label: 'Food' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Dessert' },
] as const;

export const MENU_STATUS = [
  { value: 'tersedia', label: 'Tersedia' },
  { value: 'habis', label: 'Habis' },
] as const;

export const SORT_OPTIONS = [
  { value: 'relevancy', label: 'Relevancy' },
  { value: 'price_asc', label: 'Harga Termurah' },
  { value: 'price_desc', label: 'Harga Termahal' },
] as const;