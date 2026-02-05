// Largo - Onboarding Quiz Constants

export interface StyleOption {
  id: string;
  name: string;
  icon: string;
}

export interface BrandOption {
  id: string;
  name: string;
}

// Opcoes de estilo para o quiz
export const STYLE_OPTIONS: StyleOption[] = [
  { id: 'casual', name: 'Casual', icon: 'shirt-outline' },
  { id: 'streetwear', name: 'Streetwear', icon: 'fitness-outline' },
  { id: 'vintage', name: 'Vintage', icon: 'time-outline' },
  { id: 'minimalista', name: 'Minimalista', icon: 'remove-outline' },
  { id: 'social', name: 'Social', icon: 'briefcase-outline' },
  { id: 'esportivo', name: 'Esportivo', icon: 'football-outline' },
  { id: 'boho', name: 'Boho', icon: 'flower-outline' },
];

// Marcas populares
export const POPULAR_BRANDS: BrandOption[] = [
  { id: 'zara', name: 'Zara' },
  { id: 'farm', name: 'Farm' },
  { id: 'nike', name: 'Nike' },
  { id: 'adidas', name: 'Adidas' },
  { id: 'renner', name: 'Renner' },
  { id: 'cea', name: 'C&A' },
  { id: 'shein', name: 'Shein' },
  { id: 'hering', name: 'Hering' },
  { id: 'reserva', name: 'Reserva' },
  { id: 'osklen', name: 'Osklen' },
];

// Tamanhos de roupas para onboarding
export const SIZE_OPTIONS_CLOTHES: string[] = [
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'Plus Size',
];

// Tamanhos de calcados para onboarding (33-44)
export const SIZE_OPTIONS_SHOES: string[] = [
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
];

export default {
  STYLE_OPTIONS,
  POPULAR_BRANDS,
  SIZE_OPTIONS_CLOTHES,
  SIZE_OPTIONS_SHOES,
};
