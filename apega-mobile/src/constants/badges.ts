// Largo - Badges do Largometro
// Sistema de badges para reconhecimento de vendedores

export interface SellerBadge {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  description: string;
  color: string;
}

export const SELLER_BADGES: SellerBadge[] = [
  {
    id: 'fast_shipper',
    name: 'Envia rapido',
    emoji: '🚀',
    icon: 'rocket-outline',
    description: 'Media de envio < 2 dias',
    color: '#4A90A4',
  },
  {
    id: 'quick_responder',
    name: 'Responde na hora',
    emoji: '💬',
    icon: 'chatbubble-outline',
    description: 'Tempo de resposta < 1h',
    color: '#5B8C5A',
  },
  {
    id: 'good_photos',
    name: 'Capricha nas fotos',
    emoji: '📸',
    icon: 'camera-outline',
    description: 'Nota media fotos > 4.5',
    color: '#F2C94C',
  },
  {
    id: 'eco_friendly',
    name: 'Eco-friendly',
    emoji: '♻️',
    icon: 'leaf-outline',
    description: '+50 pecas vendidas',
    color: '#5B8C5A',
  },
  {
    id: 'fan_favorite',
    name: 'Favorito da galera',
    emoji: '⭐',
    icon: 'star-outline',
    description: '+100 favoritos recebidos',
    color: '#D4A574',
  },
  {
    id: 'top_seller',
    name: 'Top vendedor',
    emoji: '🏆',
    icon: 'trophy-outline',
    description: 'Top 10% do mes',
    color: '#C75C3A',
  },
];

// Helper para obter badge por ID
export const getBadgeById = (id: string): SellerBadge | undefined => {
  return SELLER_BADGES.find((badge) => badge.id === id);
};

// Helper para obter multiplos badges por IDs
export const getBadgesByIds = (ids: string[]): SellerBadge[] => {
  return ids
    .map((id) => getBadgeById(id))
    .filter((badge): badge is SellerBadge => badge !== undefined);
};

export default SELLER_BADGES;
