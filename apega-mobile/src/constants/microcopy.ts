// Largô - Microcopy e Terminologia
// Tom de voz: "Largou, desapegou, e alguém amou."

export const MICROCOPY = {
  // Marca
  appName: 'Largô',
  tagline: 'Largou? Pegou!',
  slogan: 'Moda circular para um mundo melhor',

  // Ações principais
  actions: {
    sell: 'Largar',
    selling: 'Largando...',
    sold: 'Largou!',
    buy: 'Pegar',
    buying: 'Pegando...',
    favorite: 'Quero!',
    unfavorite: 'Não quero mais',
    addToCart: 'Adicionar na sacola',
    removeFromCart: 'Remover da sacola',
    publish: 'Largar!',
    publishing: 'Largando...',
    published: 'Largou! Seu anúncio foi publicado',
  },

  // Navegação
  nav: {
    home: 'Home',
    search: 'Buscar',
    sell: 'Largar',
    favorites: 'Quero!',
    profile: 'Perfil',
  },

  // Sacola / Checkout
  cart: {
    title: 'Sacola',
    empty: 'Sua sacola tá vazia... bora garimpar?',
    checkout: 'Fechar a sacola',
    total: 'Total da sacola',
    itemsCount: (count: number) => count === 1 ? '1 peça' : `${count} peças`,
  },

  // Produto
  product: {
    available: 'Tá sobrando',
    sold: 'Largou!',
    reserved: 'Reservado',
    condition: 'Estado da peça',
    size: 'Tamanho',
    brand: 'Marca',
    price: 'Preço',
    suggestedPrice: 'Preço sugerido',
    commission: 'Comissão Largô',
    youReceive: 'Você recebe',
    measurements: 'Medidas',
    description: 'Descrição',
    photos: 'Fotos',
    photosHint: 'Mínimo 2, máximo 8 fotos',
  },

  // Seções da Home
  sections: {
    newArrivals: 'Acabaram de largar',
    popular: 'Os mais largados',
    deals: 'Achados até R$30',
    bags: 'Bolsas que largaram',
    categories: 'Categorias',
    forYou: 'Pra você',
    trending: 'Em alta',
  },

  // Perfil do vendedor
  seller: {
    itemsCount: (count: number) => `${count} peças largadas`,
    rating: 'Avaliação',
    sales: 'Vendas',
    followers: 'Seguidores',
    following: 'Seguindo',
  },

  // Estados vazios
  empty: {
    search: 'Ninguém largou isso ainda...',
    favorites: 'Você ainda não curtiu nada. Bora garimpar?',
    products: 'Você ainda não largou nada. Que tal começar?',
    orders: 'Nenhuma compra ainda. Bora pegar umas peças?',
    messages: 'Nenhuma conversa ainda.',
  },

  // Loading
  loading: {
    default: 'Buscando achados...',
    products: 'Carregando peças...',
    publishing: 'Largando sua peça...',
    analyzing: 'Nossa IA está analisando...',
  },

  // Mensagens de sucesso
  success: {
    published: '🎉 Largou! Sua peça está no ar!',
    purchased: '🎉 Pegou! Compra confirmada!',
    favorited: 'Adicionado aos seus Quero!',
    sold: '🎉 Alguém pegou sua peça!',
    priceDropped: 'Largou o preço? Agora vai!',
  },

  // Erros
  errors: {
    generic: 'Ih, deu ruim 😅 Tenta de novo?',
    network: 'Sem conexão. Verifica sua internet?',
    notFound: 'Opa, não encontramos isso.',
    unauthorized: 'Você precisa entrar na conta.',
  },

  // Auth
  auth: {
    welcome: 'Bora largar?',
    login: 'Entrar',
    register: 'Chega mais!',
    logout: 'Sair',
    forgotPassword: 'Esqueci a senha',
    createAccount: 'Criar conta',
    alreadyHaveAccount: 'Já tem conta? Entrar',
    noAccount: 'Não tem conta? Chega mais!',
  },

  // Notificações
  notifications: {
    newSale: '🎉 Alguém pegou sua peça!',
    priceDrop: 'Largou o preço? Agora vai!',
    newMessage: 'Nova mensagem de',
    orderShipped: 'Sua compra foi enviada!',
    orderDelivered: 'Sua compra chegou!',
  },

  // Premium
  premium: {
    title: 'Largô Premium',
    subtitle: 'Desbloqueie recursos exclusivos',
    benefits: {
      unlimited: 'Anúncios ilimitados',
      ai: 'IA para fotos',
      reducedFee: 'Taxa de apenas 10%',
      priority: 'Destaque nas buscas',
      support: 'Suporte prioritário',
    },
  },

  // Contato
  contact: {
    email: 'suporte@largo.com.br',
    instagram: '@largo.app',
    whatsapp: '(11) 99999-9999',
  },

  // Footer
  footer: {
    copyright: '© 2025 Largô',
    tagline: 'Moda Sustentável',
  },
};

// Função helper para formatar preço
export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// Função helper para calcular comissão
export function calculateCommission(price: number, isPremium: boolean): { commission: number; receives: number; rate: number } {
  const rate = isPremium ? 0.10 : 0.20;
  const commission = price * rate;
  const receives = price - commission;
  return { commission, receives, rate };
}

export default MICROCOPY;
