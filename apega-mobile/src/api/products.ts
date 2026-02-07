import api from './config';

export interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: 'novo' | 'seminovo' | 'usado' | 'vintage';
  price: number;
  original_price?: number;
  image_url?: string;
  images?: ProductImage[];
  category_id?: string;
  category_name?: string;
  seller_id: string;
  seller_name: string;
  seller_avatar?: string;
  seller_rating?: number;
  seller_city?: string;
  views?: number;
  is_favorited?: boolean;
  status: 'active' | 'sold' | 'reserved' | 'deleted';
  created_at: string;
  // Auction fields
  in_auction?: boolean;
  auction_discount?: number;
  auction_price?: number;
  auction_enrolled_at?: string;
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

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const productsService = {
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  async getProduct(id: string): Promise<{ success: boolean; product: Product }> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async getMyProducts(status?: string): Promise<{ success: boolean; products: Product[] }> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/products/my${params}`);
    return response.data;
  },

  async createProduct(data: Partial<Product>): Promise<{ success: boolean; product: Product }> {
    const response = await api.post('/products', data);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<{ success: boolean; product: Product }> {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  async uploadImage(file: FormData): Promise<{ success: boolean; url: string }> {
    const response = await api.post('/products/upload', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadProductImages(productId: string, files: FormData): Promise<{ success: boolean; images: ProductImage[] }> {
    const response = await api.post(`/products/${productId}/images`, files, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default productsService;
