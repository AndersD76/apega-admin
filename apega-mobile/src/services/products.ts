import api from './api';
import { trackProductView } from './analytics';

export interface Product {
  id: string;
  seller_id: string;
  category_id?: string;
  title: string;
  description?: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: 'novo' | 'seminovo' | 'usado';
  price: number;
  original_price?: number;
  status: 'active' | 'paused' | 'sold' | 'deleted';
  is_premium: boolean;
  is_featured: boolean;
  views: number;
  favorites: number;
  city?: string;
  state?: string;
  created_at: string;
  // Joins
  seller_name?: string;
  seller_avatar?: string;
  seller_rating?: number;
  seller_city?: string;
  category_name?: string;
  image_url?: string;
  is_favorited?: boolean;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  size?: string;
  brand?: string;
  city?: string;
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Listar produtos
export const getProducts = async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  const endpoint = queryString ? `/products?${queryString}` : '/products';

  return api.get<ProductsResponse>(endpoint);
};

// Obter produto por ID
export const getProduct = async (id: string, source?: string): Promise<{ product: Product }> => {
  // Track product view for analytics
  trackProductView(id, source);

  return api.get<{ product: Product }>(`/products/${id}`);
};

// Criar produto
export const createProduct = async (data: Partial<Product>): Promise<{ product: Product }> => {
  return api.post<{ product: Product }>('/products', data);
};

// Atualizar produto
export const updateProduct = async (
  id: string,
  data: Partial<Product>
): Promise<{ product: Product }> => {
  return api.put<{ product: Product }>(`/products/${id}`, data);
};

// Deletar produto
export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

// Meus produtos
export const getMyProducts = async (status?: string): Promise<{ products: Product[] }> => {
  const endpoint = status ? `/products/my?status=${status}` : '/products/my';
  return api.get<{ products: Product[] }>(endpoint);
};

// Produtos de um vendedor
export const getSellerProducts = async (
  sellerId: string,
  status: string = 'active'
): Promise<{ products: Product[] }> => {
  return api.get<{ products: Product[] }>(`/users/${sellerId}/products?status=${status}`);
};

// Upload de imagens do produto
export const uploadProductImages = async (
  productId: string,
  imageUris: string[]
): Promise<{ success: boolean; images: ProductImage[] }> => {
  const formData = new FormData();

  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    const filename = uri.split('/').pop() || `image-${i}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('images', {
      uri,
      name: filename,
      type,
    } as any);
  }

  return api.upload<{ success: boolean; images: ProductImage[] }>(
    `/products/${productId}/images`,
    formData
  );
};

// Upload de uma única imagem (retorna URL)
export const uploadSingleImage = async (
  imageUri: string
): Promise<{ success: boolean; url: string; filename: string }> => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  return api.upload<{ success: boolean; url: string; filename: string }>(
    '/products/upload',
    formData
  );
};

// Obter contagem de produtos por categoria
export const getCategoryCounts = async (): Promise<{ [key: string]: number }> => {
  try {
    const response = await getProducts({ limit: 500 });
    const products = response.products || [];

    const counts: { [key: string]: number } = {};
    products.forEach((product) => {
      const category = product.category_name || 'Outros';
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  } catch {
    return {};
  }
};

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getSellerProducts,
  uploadProductImages,
  uploadSingleImage,
  getCategoryCounts,
};
