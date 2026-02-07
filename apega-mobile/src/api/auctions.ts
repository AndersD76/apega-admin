import api from './config';
import { Product } from './products';

export interface AuctionSession {
  id: string;
  start_time: string;
  end_time: string;
  discount_percentage: number;
  status: 'upcoming' | 'active' | 'ended';
  products_count: number;
  total_sales?: number;
}

export interface AuctionProduct extends Product {
  auction_discount: number;
  auction_price: number;
  auction_enrolled_at: string;
}

export interface AuctionInvite {
  id: string;
  seller_id: string;
  auction_id: string;
  status: 'pending' | 'accepted' | 'declined';
  products_eligible: number;
  created_at: string;
}

export const auctionsService = {
  // Get current or next auction session
  async getCurrentAuction(): Promise<{ success: boolean; auction: AuctionSession | null }> {
    try {
      const response = await api.get('/auctions/current');
      return response.data;
    } catch (error) {
      // Return mock data for now
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
      const nextWednesday = new Date(now);
      nextWednesday.setDate(now.getDate() + daysUntilWednesday);
      nextWednesday.setHours(10, 0, 0, 0);

      const endTime = new Date(nextWednesday);
      endTime.setHours(22, 0, 0, 0);

      return {
        success: true,
        auction: {
          id: 'mock-auction-1',
          start_time: nextWednesday.toISOString(),
          end_time: endTime.toISOString(),
          discount_percentage: 30,
          status: dayOfWeek === 3 && now.getHours() >= 10 && now.getHours() < 22 ? 'active' : 'upcoming',
          products_count: 0,
        },
      };
    }
  },

  // Get products in current auction
  async getAuctionProducts(auctionId?: string): Promise<{ success: boolean; products: AuctionProduct[] }> {
    try {
      const params = auctionId ? `?auction_id=${auctionId}` : '';
      const response = await api.get(`/auctions/products${params}`);
      return response.data;
    } catch (error) {
      return { success: true, products: [] };
    }
  },

  // Get seller's products enrolled in auction
  async getMyAuctionProducts(): Promise<{ success: boolean; products: AuctionProduct[] }> {
    try {
      const response = await api.get('/auctions/my-products');
      return response.data;
    } catch (error) {
      return { success: true, products: [] };
    }
  },

  // Enroll products in auction
  async enrollProducts(productIds: string[]): Promise<{ success: boolean; enrolled: number }> {
    try {
      const response = await api.post('/auctions/enroll', { product_ids: productIds });
      return response.data;
    } catch (error) {
      // Simulate success for now
      return { success: true, enrolled: productIds.length };
    }
  },

  // Remove product from auction
  async removeFromAuction(productId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete(`/auctions/products/${productId}`);
      return response.data;
    } catch (error) {
      return { success: true };
    }
  },

  // Check if seller has pending auction invite
  async checkAuctionInvite(): Promise<{ success: boolean; invite: AuctionInvite | null }> {
    try {
      const response = await api.get('/auctions/invite');
      return response.data;
    } catch (error) {
      return { success: true, invite: null };
    }
  },

  // Respond to auction invite
  async respondToInvite(inviteId: string, accept: boolean): Promise<{ success: boolean }> {
    try {
      const response = await api.post(`/auctions/invite/${inviteId}`, { accept });
      return response.data;
    } catch (error) {
      return { success: true };
    }
  },

  // Get auction history for seller
  async getAuctionHistory(): Promise<{ success: boolean; history: AuctionSession[] }> {
    try {
      const response = await api.get('/auctions/history');
      return response.data;
    } catch (error) {
      return { success: true, history: [] };
    }
  },
};

export default auctionsService;
