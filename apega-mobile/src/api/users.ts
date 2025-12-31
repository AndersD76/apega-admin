import api from './config';

export interface SellerProfile {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  store_name?: string;
  store_description?: string;
  subscription_type: string;
  rating: number;
  total_reviews: number;
  total_sales: number;
  total_followers: number;
  total_following: number;
  is_verified: boolean;
  is_following?: boolean;
  created_at: string;
}

export interface SellerProduct {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  image_url?: string;
  condition: string;
  size?: string;
  brand?: string;
  status: string;
}

export interface UpdateProfileData {
  name: string;
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  store_name?: string;
  store_description?: string;
  instagram?: string;
  // Dados bancarios
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pix_key?: string;
  bank_code?: string;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: 'corrente' | 'poupanca';
  cpf?: string;
}

export const usersService = {
  async getSellerProfile(sellerId: string): Promise<{ success: boolean; user: SellerProfile }> {
    const response = await api.get(`/users/${sellerId}`);
    return response.data;
  },

  async getSellerProducts(sellerId: string, status = 'active'): Promise<{ success: boolean; products: SellerProduct[] }> {
    const response = await api.get(`/users/${sellerId}/products?status=${status}`);
    return response.data;
  },

  async followUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  async unfollowUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string; user: any }> {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  async uploadImage(imageUri: string, type: 'avatar' | 'banner'): Promise<{ success: boolean; url: string; user: any }> {
    const formData = new FormData();

    // Get file name and type from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const fileName = `${type}_${Date.now()}.${fileType}`;

    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    } as any);
    formData.append('type', type);

    const response = await api.post('/users/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default usersService;
