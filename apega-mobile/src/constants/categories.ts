// Largô - Sistema de Categorias
// Estrutura hierárquica: Categoria > Subcategoria > Tipo

import { colors } from '../theme';

export interface ProductType {
  id: string;
  name: string;
}

export interface Subcategory {
  id: string;
  name: string;
  types: ProductType[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  colorBg: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'feminino',
    name: 'Feminino',
    icon: 'woman-outline',
    color: colors.catFeminino,
    colorBg: colors.catFemininoBg,
    subcategories: [
      {
        id: 'fem-roupas',
        name: 'Roupas',
        types: [
          { id: 'vestidos', name: 'Vestidos' },
          { id: 'blusas-tops', name: 'Blusas e Tops' },
          { id: 'calcas-shorts', name: 'Calças e Shorts' },
          { id: 'saias', name: 'Saias' },
          { id: 'casacos-jaquetas', name: 'Casacos e Jaquetas' },
          { id: 'macacoes', name: 'Macacões' },
          { id: 'conjuntos', name: 'Conjuntos' },
          { id: 'moda-praia-fem', name: 'Moda Praia' },
        ],
      },
      {
        id: 'fem-calcados',
        name: 'Calçados',
        types: [
          { id: 'tenis-fem', name: 'Tênis' },
          { id: 'sandalias-fem', name: 'Sandálias' },
          { id: 'sapatos-fem', name: 'Sapatos' },
          { id: 'botas-fem', name: 'Botas' },
        ],
      },
      {
        id: 'fem-intimo',
        name: 'Íntimo e Pijamas',
        types: [
          { id: 'sutias', name: 'Sutiãs' },
          { id: 'calcinhas', name: 'Calcinhas' },
          { id: 'pijamas-fem', name: 'Pijamas' },
          { id: 'lingerie', name: 'Lingerie' },
        ],
      },
    ],
  },
  {
    id: 'masculino',
    name: 'Masculino',
    icon: 'man-outline',
    color: colors.catMasculino,
    colorBg: colors.catMasculinoBg,
    subcategories: [
      {
        id: 'masc-roupas',
        name: 'Roupas',
        types: [
          { id: 'camisetas-polos', name: 'Camisetas e Polos' },
          { id: 'camisas', name: 'Camisas' },
          { id: 'calcas-bermudas', name: 'Calças e Bermudas' },
          { id: 'casacos-jaquetas-masc', name: 'Casacos e Jaquetas' },
          { id: 'moletons-malharia', name: 'Moletons e Malharia' },
          { id: 'moda-praia-masc', name: 'Moda Praia' },
        ],
      },
      {
        id: 'masc-calcados',
        name: 'Calçados',
        types: [
          { id: 'tenis-masc', name: 'Tênis' },
          { id: 'sapatos-masc', name: 'Sapatos' },
          { id: 'sandalias-masc', name: 'Sandálias' },
          { id: 'botas-masc', name: 'Botas' },
        ],
      },
      {
        id: 'masc-social',
        name: 'Ternos e Social',
        types: [
          { id: 'ternos', name: 'Ternos' },
          { id: 'blazers', name: 'Blazers' },
          { id: 'calcas-sociais', name: 'Calças Sociais' },
          { id: 'gravatas', name: 'Gravatas' },
        ],
      },
    ],
  },
  {
    id: 'infantil',
    name: 'Infantil',
    icon: 'happy-outline',
    color: colors.catInfantil,
    colorBg: colors.catInfantilBg,
    subcategories: [
      {
        id: 'inf-bebe',
        name: 'Bebê (0-2 anos)',
        types: [
          { id: 'bodies', name: 'Bodies' },
          { id: 'macacoes-bebe', name: 'Macacões' },
          { id: 'conjuntos-bebe', name: 'Conjuntos' },
          { id: 'vestidos-bebe', name: 'Vestidos' },
          { id: 'pijamas-bebe', name: 'Pijamas' },
        ],
      },
      {
        id: 'inf-meninas',
        name: 'Meninas (2-14)',
        types: [
          { id: 'vestidos-meninas', name: 'Vestidos' },
          { id: 'blusas-meninas', name: 'Blusas' },
          { id: 'calcas-shorts-meninas', name: 'Calças e Shorts' },
          { id: 'conjuntos-meninas', name: 'Conjuntos' },
          { id: 'casacos-meninas', name: 'Casacos' },
        ],
      },
      {
        id: 'inf-meninos',
        name: 'Meninos (2-14)',
        types: [
          { id: 'camisetas-meninos', name: 'Camisetas' },
          { id: 'calcas-bermudas-meninos', name: 'Calças e Bermudas' },
          { id: 'conjuntos-meninos', name: 'Conjuntos' },
          { id: 'casacos-meninos', name: 'Casacos' },
          { id: 'moletons-meninos', name: 'Moletons' },
        ],
      },
      {
        id: 'inf-calcados',
        name: 'Calçados Infantis',
        types: [
          { id: 'tenis-infantil', name: 'Tênis' },
          { id: 'sandalias-infantil', name: 'Sandálias' },
          { id: 'sapatos-infantil', name: 'Sapatos' },
          { id: 'botas-infantil', name: 'Botas' },
        ],
      },
      {
        id: 'inf-fantasias',
        name: 'Fantasias e Festas',
        types: [
          { id: 'fantasias', name: 'Fantasias' },
          { id: 'vestidos-festa', name: 'Vestidos de Festa' },
          { id: 'ternos-infantis', name: 'Ternos Infantis' },
        ],
      },
    ],
  },
  {
    id: 'acessorios',
    name: 'Acessórios',
    icon: 'bag-handle-outline',
    color: colors.catAcessorios,
    colorBg: colors.catAcessoriosBg,
    subcategories: [
      {
        id: 'aces-bolsas',
        name: 'Bolsas e Mochilas',
        types: [
          { id: 'bolsas-mao', name: 'Bolsas de mão' },
          { id: 'bolsas-tiracolo', name: 'Bolsas tiracolo' },
          { id: 'clutches', name: 'Clutches' },
          { id: 'mochilas', name: 'Mochilas' },
          { id: 'necessaires', name: 'Necessaires' },
        ],
      },
      {
        id: 'aces-oculos',
        name: 'Óculos',
        types: [
          { id: 'oculos-sol', name: 'Óculos de sol' },
          { id: 'armacoes', name: 'Armações' },
        ],
      },
      {
        id: 'aces-bijus',
        name: 'Bijuterias e Joias',
        types: [
          { id: 'colares', name: 'Colares' },
          { id: 'brincos', name: 'Brincos' },
          { id: 'pulseiras', name: 'Pulseiras' },
          { id: 'aneis', name: 'Anéis' },
          { id: 'relogios', name: 'Relógios' },
        ],
      },
      {
        id: 'aces-cintos',
        name: 'Cintos',
        types: [
          { id: 'cintos-femininos', name: 'Cintos Femininos' },
          { id: 'cintos-masculinos', name: 'Cintos Masculinos' },
        ],
      },
      {
        id: 'aces-chapeus',
        name: 'Chapéus e Bonés',
        types: [
          { id: 'chapeus', name: 'Chapéus' },
          { id: 'bones', name: 'Bonés' },
          { id: 'gorros', name: 'Gorros' },
          { id: 'viseiras', name: 'Viseiras' },
        ],
      },
      {
        id: 'aces-lencos',
        name: 'Lenços e Echarpes',
        types: [
          { id: 'lencos', name: 'Lenços' },
          { id: 'echarpes', name: 'Echarpes' },
          { id: 'pashminas', name: 'Pashminas' },
        ],
      },
    ],
  },
];

// Helper functions
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

export function getSubcategoryById(categoryId: string, subcategoryId: string): Subcategory | undefined {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(sub => sub.id === subcategoryId);
}

export function getCategoryColor(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.color || colors.primary;
}

export function getCategoryColorBg(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.colorBg || colors.primaryMuted;
}

// Flat list of all subcategories for filtering
export function getAllSubcategories(): { categoryId: string; subcategory: Subcategory }[] {
  const result: { categoryId: string; subcategory: Subcategory }[] = [];
  CATEGORIES.forEach(cat => {
    cat.subcategories.forEach(sub => {
      result.push({ categoryId: cat.id, subcategory: sub });
    });
  });
  return result;
}

// Icon mapping for categories (Ionicons)
export const CATEGORY_ICONS: Record<string, string> = {
  feminino: 'woman-outline',
  masculino: 'man-outline',
  infantil: 'happy-outline',
  acessorios: 'bag-handle-outline',
  'fem-roupas': 'shirt-outline',
  'fem-calcados': 'footsteps-outline',
  'fem-intimo': 'heart-outline',
  'masc-roupas': 'shirt-outline',
  'masc-calcados': 'footsteps-outline',
  'masc-social': 'briefcase-outline',
  'inf-bebe': 'happy-outline',
  'inf-meninas': 'flower-outline',
  'inf-meninos': 'football-outline',
  'inf-calcados': 'footsteps-outline',
  'inf-fantasias': 'sparkles-outline',
  'aces-bolsas': 'bag-handle-outline',
  'aces-oculos': 'glasses-outline',
  'aces-bijus': 'diamond-outline',
  'aces-cintos': 'remove-outline',
  'aces-chapeus': 'sunny-outline',
  'aces-lencos': 'ribbon-outline',
};

export default CATEGORIES;
