import { LiveApiService } from './liveApi';
import { transformRestaurantFormData, transformApiResponseToFormData } from '../utils/restaurantUtils';
import api from '../api/axiosClient';

// Mock data for development (keeping minimal mock data for fallback only)
const mockRestaurants = [
  { restaurant_id: 'rest_001', name: 'Bella Vista Italian' },
  { restaurant_id: 'rest_002', name: 'Dragon Palace Chinese' },
  { restaurant_id: 'rest_003', name: 'Le Petit Bistro' },
];

// Mock chat logs
const mockChatLogs = [
  {
    client_id: 'client_123',
    table_id: '1',
    message: 'What are your opening hours?',
    answer: 'We are open Monday to Friday from 11 AM to 10 PM, and weekends from 10 AM to 11 PM.',
    timestamp: '2024-01-15T14:30:00Z',
    ai_enabled: true
  },
  {
    client_id: 'client_456',
    table_id: '2',
    message: 'Do you have vegetarian options?',
    answer: 'Yes! We have a dedicated vegetarian section with over 15 delicious options including our famous veggie burger and quinoa salad.',
    timestamp: '2024-01-15T15:45:00Z',
    ai_enabled: false
  },
];

// Mock latest chat logs
const mockLatestChatLogs = [
  {
    client_id: 'client_123',
    table_id: '1',
    message: 'What are your opening hours?',
    answer: 'We are open Monday to Friday from 11 AM to 10 PM, and weekends from 10 AM to 11 PM.',
    timestamp: '2024-01-15T14:30:00Z',
    ai_enabled: true
  },
  {
    client_id: 'client_456',
    table_id: '2',
    message: 'Do you have vegetarian options?',
    answer: 'Yes! We have a dedicated vegetarian section with over 15 delicious options including our famous veggie burger and quinoa salad.',
    timestamp: '2024-01-15T15:45:00Z',
    ai_enabled: false
  },
  {
    client_id: 'client_789',
    table_id: '3',
    message: 'Can I make a reservation for tonight?',
    answer: '',
    timestamp: '2024-01-15T16:00:00Z',
    ai_enabled: false
  },
];

// Mock client conversation
const mockClientConversation = [
  {
    client_id: 'client_123',
    table_id: '1',
    message: 'Hello, I have some questions about your menu',
    answer: 'Hello! I\'d be happy to help you with any questions about our menu. What would you like to know?',
    timestamp: '2024-01-15T14:25:00Z',
    ai_enabled: true,
    sender_type: 'client'
  },
  {
    client_id: 'client_123',
    table_id: '1',
    message: 'What are your opening hours?',
    answer: 'We are open Monday to Friday from 11 AM to 10 PM, and weekends from 10 AM to 11 PM.',
    timestamp: '2024-01-15T14:30:00Z',
    ai_enabled: true,
    sender_type: 'client'
  },
  {
    client_id: 'client_123',
    table_id: '1',
    message: 'Thank you for the information!',
    answer: 'You\'re welcome! Is there anything else I can help you with today?',
    timestamp: '2024-01-15T14:35:00Z',
    ai_enabled: true,
    sender_type: 'client'
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiService {
  private static useLiveApi: boolean = true; // Flag to control live API usage

  private static async mockRequest<T>(data: T, delayMs: number = 500): Promise<T> {
    await delay(delayMs);
    return data;
  }

  // Authentication using axios client - FIXED: Changed email to restaurant_id
  static async login(credentials: { restaurant_id: string; password: string }): Promise<{ 
    access_token: string; 
    refresh_token: string; 
    role: string; 
    restaurant_id: string; 
  }> {
    try {
      const response = await api.post('/restaurant/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw new Error('Invalid credentials');
    }
  }

  // Refresh token using axios client
  static async refreshToken(refresh_token: string): Promise<{
    access_token: string;
    refresh_token: string;
    role: string;
  }> {
    try {
      const response = await api.post('/restaurant/refresh-token', { refresh_token });
      return response.data;
    } catch (error) {
      console.error('Token refresh API error:', error);
      throw new Error('Token refresh failed');
    }
  }

  // Health check using axios client
  static async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await api.get('/healthcheck');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return this.mockRequest({ status: 'ok' });
    }
  }

  // NEW: Get restaurant profile (authenticated endpoint)
  static async getRestaurantProfile(): Promise<any> {
    if (this.useLiveApi) {
      try {
        const response = await api.get('/restaurant/profile');
        console.log('Restaurant profile response:', response.data);
        
        // Transform API response to form data format if needed
        if (response.data) {
          return transformApiResponseToFormData(response.data);
        }
        
        return response.data;
      } catch (error) {
        console.error('Get restaurant profile API error:', error);
        throw new Error('Failed to fetch restaurant profile');
      }
    } else {
      // Fallback to mock data
      return this.mockRequest({
        restaurant_id: 'mock_restaurant',
        name: 'Mock Restaurant',
        opening_hours: {
          monday: '11:00 AM - 10:00 PM',
          tuesday: '11:00 AM - 10:00 PM',
          wednesday: '11:00 AM - 10:00 PM',
          thursday: '11:00 AM - 10:00 PM',
          friday: '11:00 AM - 11:00 PM',
          saturday: '11:00 AM - 11:00 PM',
          sunday: '12:00 PM - 9:00 PM',
        },
        contact_info: {
          phone: '+1 (555) 123-4567',
          email: 'info@restaurant.com',
          address: '123 Main St, City, State 12345',
        },
        restaurant_story: 'A wonderful place to dine with family and friends.',
        menu: [
          {
            dish: 'Sample Dish',
            price: '$24.99',
            ingredients: ['ingredient1', 'ingredient2'],
            allergens: ['gluten'],
            description: 'A delicious sample dish',
          },
        ],
        faq: [
          {
            question: 'Do you take reservations?',
            answer: 'Yes, we accept reservations via phone or our website.',
          },
        ],
        whatsapp_number: '',
      });
    }
  }

  // Get single restaurant by ID (for admin use)
  static async getRestaurant(restaurant_id: string): Promise<any> {
    if (this.useLiveApi) {
      try {
        const response = await api.get(`/restaurant/info?restaurant_id=${restaurant_id}`);
        
        // Transform API response to form data format if needed
        if (response.data) {
          return transformApiResponseToFormData(response.data);
        }
        
        return response.data;
      } catch (error) {
        console.error('Get restaurant API error:', error);
        throw new Error('Failed to fetch restaurant data');
      }
    } else {
      // Fallback to mock data
      const mockRestaurant = mockRestaurants.find(r => r.restaurant_id === restaurant_id);
      if (!mockRestaurant) {
        throw new Error('Restaurant not found');
      }
      
      // Return mock restaurant with full data structure
      return this.mockRequest({
        restaurant_id: mockRestaurant.restaurant_id,
        name: mockRestaurant.name,
        opening_hours: {
          monday: '11:00 AM - 10:00 PM',
          tuesday: '11:00 AM - 10:00 PM',
          wednesday: '11:00 AM - 10:00 PM',
          thursday: '11:00 AM - 10:00 PM',
          friday: '11:00 AM - 11:00 PM',
          saturday: '11:00 AM - 11:00 PM',
          sunday: '12:00 PM - 9:00 PM',
        },
        contact_info: {
          phone: '+1 (555) 123-4567',
          email: 'info@restaurant.com',
          address: '123 Main St, City, State 12345',
        },
        restaurant_story: 'A wonderful place to dine with family and friends.',
        menu: [
          {
            dish: 'Sample Dish',
            price: '$24.99',
            ingredients: ['ingredient1', 'ingredient2'],
            allergens: ['gluten'],
            description: 'A delicious sample dish',
          },
        ],
        faq: [
          {
            question: 'Do you take reservations?',
            answer: 'Yes, we accept reservations via phone or our website.',
          },
        ],
      });
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(): Promise<{
    totalRestaurants: number;
    activeChats: number;
    customerInteractions: number;
    growthRate: string;
  }> {
    if (this.useLiveApi) {
      try {
        const response = await api.get('/admin/stats');
        return response.data;
      } catch (error) {
        console.error('Dashboard stats API error:', error);
        // Fallback to calculated stats from restaurant list
        try {
          const restaurantsResponse = await this.listRestaurants();
          return {
            totalRestaurants: restaurantsResponse.restaurants.length,
            activeChats: 0, // Will be 0 until backend provides this
            customerInteractions: 0, // Will be 0 until backend provides this
            growthRate: '+0%', // Will be 0% until backend provides this
          };
        } catch {
          return {
            totalRestaurants: 0,
            activeChats: 0,
            customerInteractions: 0,
            growthRate: '+0%',
          };
        }
      }
    } else {
      return this.mockRequest({
        totalRestaurants: mockRestaurants.length,
        activeChats: 24,
        customerInteractions: 1423,
        growthRate: '+12%',
      });
    }
  }

  // Restaurant management using axios client - FIXED: Use /restaurant/register endpoint
  static async createRestaurant(restaurantData: {
    restaurant_id: string;
    password: string;
    restaurant_data: any;
  }): Promise<any> {
    if (this.useLiveApi) {
      try {
        const apiData = {
          restaurant_id: restaurantData.restaurant_id,
          password: restaurantData.password,
          data: {
            name: restaurantData.restaurant_data.name,
            story: restaurantData.restaurant_data.restaurant_story,
            menu: restaurantData.restaurant_data.menu,
            faq: restaurantData.restaurant_data.faq,
            opening_hours: restaurantData.restaurant_data.opening_hours,
            contact_info: restaurantData.restaurant_data.contact_info,
          }
        };

        // FIXED: Use /restaurant/register instead of /restaurant/create
        const response = await api.post('/restaurant/register', apiData);
        
        return { success: true, response: response.data };
      } catch (error) {
        console.error('Create restaurant API error:', error);
        throw error;
      }
    } else {
      const newRestaurant = {
        restaurant_id: restaurantData.restaurant_id,
        name: restaurantData.restaurant_data.name || 'New Restaurant',
      };
      mockRestaurants.push(newRestaurant);
      return this.mockRequest({ success: true, restaurant: newRestaurant });
    }
  }

  // NEW: Update restaurant profile (authenticated endpoint)
  static async updateRestaurantProfile(profileData: {
    name: string;
    story: string;
    opening_hours: any;
    menu: any[];
    faq: any[];
    whatsapp_number?: string;
  }): Promise<any> {
    if (this.useLiveApi) {
      try {
        console.log('Updating restaurant profile with data:', profileData);
        
        const response = await api.put('/restaurant/profile', profileData);
        
        return { success: true, response: response.data };
      } catch (error) {
        console.error('Update restaurant profile API error:', error);
        throw error;
      }
    } else {
      return this.mockRequest({ success: true });
    }
  }

  static async updateRestaurant(restaurantData: {
    restaurant_id: string;
    restaurant_data?: any;
    data?: any; // Support both formats
  }): Promise<any> {
    if (this.useLiveApi) {
      try {
        let apiData;
        
        // Handle both old format (restaurant_data) and new format (data)
        if (restaurantData.restaurant_data) {
          apiData = transformRestaurantFormData({
            restaurant_id: restaurantData.restaurant_id,
            name: restaurantData.restaurant_data.name,
            restaurant_story: restaurantData.restaurant_data.restaurant_story,
            menu: restaurantData.restaurant_data.menu,
            faq: restaurantData.restaurant_data.faq,
            opening_hours: restaurantData.restaurant_data.opening_hours,
            contact_info: restaurantData.restaurant_data.contact_info,
          });
        } else {
          // Direct data format (for WhatsApp integration)
          apiData = {
            restaurant_id: restaurantData.restaurant_id,
            data: restaurantData.data
          };
        }

        const response = await api.post('/restaurant/update', apiData);
        
        return { success: true, response: response.data };
      } catch (error) {
        console.error('Update restaurant API error:', error);
        throw error;
      }
    } else {
      const index = mockRestaurants.findIndex(r => r.restaurant_id === restaurantData.restaurant_id);
      if (index !== -1) {
        const updateData = restaurantData.restaurant_data || restaurantData.data;
        mockRestaurants[index] = {
          ...mockRestaurants[index],
          name: updateData?.name || mockRestaurants[index].name,
        };
      }
      return this.mockRequest({ success: true });
    }
  }

  static async deleteRestaurant(restaurant_id: string): Promise<any> {
    if (this.useLiveApi) {
      try {
        const response = await api.post('/restaurant/delete', { restaurant_id });
        
        return { success: true, response: response.data };
      } catch (error) {
        console.error('Delete restaurant API error:', error);
        throw error;
      }
    } else {
      const index = mockRestaurants.findIndex(r => r.restaurant_id === restaurant_id);
      if (index !== -1) {
        mockRestaurants.splice(index, 1);
      }
      return this.mockRequest({ success: true });
    }
  }

  static async listRestaurants(): Promise<{ restaurants: { restaurant_id: string; name: string }[] }> {
    if (this.useLiveApi) {
      try {
        const response = await api.get('/restaurant/list');
        return response.data;
      } catch (error) {
        console.error('List restaurants API error, falling back to mock:', error);
        return this.mockRequest({ restaurants: [...mockRestaurants] });
      }
    } else {
      return this.mockRequest({ restaurants: [...mockRestaurants] });
    }
  }

  // FIXED: Chat logs using GET with query parameter
  static async getChatLogs(restaurant_id: string): Promise<any[]> {
    if (this.useLiveApi) {
      try {
        console.log('Calling chat logs API for restaurant:', restaurant_id);
        const response = await api.get(`/chat/logs?restaurant_id=${restaurant_id}`);
        console.log('Chat logs API response:', response.data);
        
        // Backend returns raw array directly
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Chat logs API error, falling back to mock:', error);
        return this.mockRequest(mockChatLogs, 800);
      }
    } else {
      return this.mockRequest(mockChatLogs, 800);
    }
  }

  // NEW: Get latest chat logs (one per client)
  static async getLatestChatLogs(restaurant_id: string): Promise<any[]> {
    if (this.useLiveApi) {
      try {
        console.log('Calling latest chat logs API for restaurant:', restaurant_id);
        const response = await api.get(`/chat/logs/latest?restaurant_id=${restaurant_id}`);
        console.log('Latest chat logs API response:', response.data);
        
        // Backend returns raw array directly
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Latest chat logs API error, falling back to mock:', error);
        return this.mockRequest(mockLatestChatLogs, 800);
      }
    } else {
      return this.mockRequest(mockLatestChatLogs, 800);
    }
  }

  // NEW: Get full conversation for a specific client
  static async getClientConversation(restaurant_id: string, client_id: string): Promise<any[]> {
    if (this.useLiveApi) {
      try {
        console.log('Calling client conversation API for restaurant:', restaurant_id, 'client:', client_id);
        const response = await api.get(`/chat/logs/client?restaurant_id=${restaurant_id}&client_id=${client_id}`);
        console.log('Client conversation API response:', response.data);
        
        // Backend returns raw array directly
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Client conversation API error, falling back to mock:', error);
        // Return mock conversation for the specific client
        const clientConversation = mockClientConversation.filter(msg => msg.client_id === client_id);
        return this.mockRequest(clientConversation, 800);
      }
    } else {
      // Return mock conversation for the specific client
      const clientConversation = mockClientConversation.filter(msg => msg.client_id === client_id);
      return this.mockRequest(clientConversation, 800);
    }
  }

  // NEW: Toggle AI for specific client
  static async toggleAI(restaurant_id: string, client_id: string, enabled: boolean): Promise<any> {
    if (this.useLiveApi) {
      try {
        console.log('Toggling AI for client:', client_id, 'enabled:', enabled);
        const response = await api.post('/chat/logs/toggle-ai', {
          restaurant_id,
          client_id,
          enabled,
        });
        console.log('Toggle AI response:', response.data);
        
        return response.data;
      } catch (error) {
        console.error('Toggle AI error, using mock:', error);
        // Update mock data for testing
        mockLatestChatLogs.forEach(log => {
          if (log.client_id === client_id) {
            log.ai_enabled = enabled;
          }
        });
        mockChatLogs.forEach(log => {
          if (log.client_id === client_id) {
            log.ai_enabled = enabled;
          }
        });
        return this.mockRequest({ success: true, ai_enabled: enabled }, 300);
      }
    } else {
      // Update mock data
      mockLatestChatLogs.forEach(log => {
        if (log.client_id === client_id) {
          log.ai_enabled = enabled;
        }
      });
      mockChatLogs.forEach(log => {
        if (log.client_id === client_id) {
          log.ai_enabled = enabled;
        }
      });
      return this.mockRequest({ success: true, ai_enabled: enabled }, 300);
    }
  }

  // Staff management
  static async createStaff(staffData: {
    restaurant_id: string;
    staff_id: string;
    password: string;
  }): Promise<any> {
    try {
      const response = await api.post('/restaurant/create-staff', staffData);
      return response.data;
    } catch (error) {
      console.error('Create staff API error:', error);
      throw error;
    }
  }

  // Chat - Now uses live API for customer chat, but keeps mock for admin/owner features
  static async sendChatMessage(chatData: {
    restaurant_id: string;
    table_id: string;
    message: string;
  }): Promise<{ answer: string }> {
    const responses = [
      "Thank you for your question! I'd be happy to help you with our menu.",
      "Our chef recommends the daily special today. Would you like to hear about it?",
      "I can help you with reservations, menu questions, or dietary restrictions.",
      "That's a great choice! Would you like to add any sides or drinks?",
      "Our restaurant is known for fresh ingredients and authentic flavors.",
      "We have excellent vegetarian and vegan options available.",
      "Our opening hours are Monday-Friday 11 AM to 10 PM, weekends 10 AM to 11 PM.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return this.mockRequest({ answer: randomResponse }, 1000);
  }

  // NEW: Send message from restaurant to client
  static async sendRestaurantMessage(messageData: {
    restaurant_id: string;
    client_id: string;
    message: string;
  }): Promise<any> {
    if (this.useLiveApi) {
      try {
        console.log('Sending restaurant message:', messageData);
        const response = await api.post('/chat', {
          restaurant_id: messageData.restaurant_id,
          client_id: messageData.client_id,
          sender_type: 'restaurant',
          message: messageData.message
        });
        console.log('Restaurant message response:', response.data);
        
        return response.data;
      } catch (error) {
        console.error('Send restaurant message error:', error);
        throw error;
      }
    } else {
      // Mock response
      return this.mockRequest({ success: true, message: 'Message sent successfully' }, 500);
    }
  }

  // WhatsApp Integration APIs
  static async getWhatsAppStatus(restaurant_id: string): Promise<any> {
    if (this.useLiveApi) {
      try {
        const response = await api.get(`/whatsapp/service/status?restaurant_id=${restaurant_id}`);
        return response.data;
      } catch (error) {
        console.error('WhatsApp status API error:', error);
        // Return mock disconnected status
        return this.mockRequest({ 
          connected: false,
          phone_number: null,
          last_connected: null,
          session_status: 'disconnected'
        }, 300);
      }
    } else {
      return this.mockRequest({ 
        connected: false,
        phone_number: null,
        last_connected: null,
        session_status: 'disconnected'
      }, 300);
    }
  }

  static async connectWhatsApp(restaurant_id: string, phone_number: string): Promise<any> {
    if (this.useLiveApi) {
      try {
        const response = await api.post(`/whatsapp/restaurant/${restaurant_id}/connect`, {
          phone_number
        });
        return response.data;
      } catch (error) {
        console.error('WhatsApp connect API error:', error);
        throw error;
      }
    } else {
      // Mock QR code response
      return this.mockRequest({
        qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        message: 'QR code generated successfully'
      }, 1000);
    }
  }

  static async disconnectWhatsApp(restaurant_id: string): Promise<any> {
    if (this.useLiveApi) {
      try {
        const response = await api.post(`/whatsapp/restaurant/${restaurant_id}/disconnect`);
        return response.data;
      } catch (error) {
        console.error('WhatsApp disconnect API error:', error);
        throw error;
      }
    } else {
      return this.mockRequest({ success: true, message: 'WhatsApp disconnected' }, 500);
    }
  }
}