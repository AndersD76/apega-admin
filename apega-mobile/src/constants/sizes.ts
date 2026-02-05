// Largô - Sistema de Tamanhos Dinâmico
// Os tamanhos variam conforme a subcategoria selecionada

export interface SizeGroup {
  subcategoryIds: string[];
  sizes: string[];
}

// Tamanhos por grupo de subcategoria
export const SIZE_GROUPS: SizeGroup[] = [
  // Roupas femininas - inclui Plus Size
  {
    subcategoryIds: ['fem-roupas', 'fem-intimo'],
    sizes: ['PP', 'P', 'M', 'G', 'GG', '46', '48', '50', '52', '54'],
  },
  // Roupas masculinas
  {
    subcategoryIds: ['masc-roupas', 'masc-social'],
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  // Bebê (0-2 anos)
  {
    subcategoryIds: ['inf-bebe'],
    sizes: ['RN', '3M', '6M', '9M', '12M', '18M', '24M'],
  },
  // Infantil (2-14 anos)
  {
    subcategoryIds: ['inf-meninas', 'inf-meninos', 'inf-fantasias'],
    sizes: ['2', '4', '6', '8', '10', '12', '14'],
  },
  // Calçados femininos
  {
    subcategoryIds: ['fem-calcados'],
    sizes: ['33', '34', '35', '36', '37', '38', '39', '40'],
  },
  // Calçados masculinos
  {
    subcategoryIds: ['masc-calcados'],
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
  },
  // Calçados infantis
  {
    subcategoryIds: ['inf-calcados'],
    sizes: ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35'],
  },
  // Acessórios (tamanho único)
  {
    subcategoryIds: [
      'aces-bolsas',
      'aces-oculos',
      'aces-bijus',
      'aces-chapeus',
      'aces-lencos',
    ],
    sizes: ['Único'],
  },
  // Cintos (tamanhos padrão)
  {
    subcategoryIds: ['aces-cintos'],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
];

/**
 * Retorna os tamanhos disponíveis para uma subcategoria
 */
export function getSizesForSubcategory(subcategoryId: string): string[] {
  const group = SIZE_GROUPS.find(g => g.subcategoryIds.includes(subcategoryId));
  return group?.sizes || ['Único'];
}

/**
 * Verifica se a subcategoria tem tamanhos (não é "Único")
 */
export function hasMultipleSizes(subcategoryId: string): boolean {
  const sizes = getSizesForSubcategory(subcategoryId);
  return sizes.length > 1 || sizes[0] !== 'Único';
}

/**
 * Retorna o label do campo de tamanho baseado na subcategoria
 */
export function getSizeLabel(subcategoryId: string): string {
  if (subcategoryId.includes('calcados')) {
    return 'Número';
  }
  if (subcategoryId.includes('bebe')) {
    return 'Idade';
  }
  if (subcategoryId.includes('meninas') || subcategoryId.includes('meninos') || subcategoryId.includes('fantasias')) {
    return 'Idade';
  }
  return 'Tamanho';
}

// Faixas de preço para filtros
export const PRICE_RANGES = [
  { id: 'ate-30', label: 'Até R$ 30', min: 0, max: 30 },
  { id: '30-70', label: 'R$ 30 - R$ 70', min: 30, max: 70 },
  { id: '70-150', label: 'R$ 70 - R$ 150', min: 70, max: 150 },
  { id: '150-300', label: 'R$ 150 - R$ 300', min: 150, max: 300 },
  { id: 'acima-300', label: 'Acima de R$ 300', min: 300, max: Infinity },
];

// Opções de ordenação
export const SORT_OPTIONS = [
  { id: 'recent', label: 'Mais recentes' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'popular', label: 'Mais curtidos' },
  { id: 'nearby', label: 'Perto de mim' },
];

export default {
  SIZE_GROUPS,
  getSizesForSubcategory,
  hasMultipleSizes,
  getSizeLabel,
  PRICE_RANGES,
  SORT_OPTIONS,
};
