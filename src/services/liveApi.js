const BASE_URL = 'https://restaurantchat-production.up.railway.app';

/**
 * Live API service for connecting to the deployed backend
 * All methods here are PUBLIC and do not require authentication
 */
export class LiveApiService {
  /**
   * Send a chat message to the backend (PUBLIC - no auth required)
   */
  static async sendMessage({ restaurantId, clientId, tableId, message }) {
    try {
      const requestPayload = {
        restaurant_id: restaurantId,
        client_id: clientId,
        table_id: tableId,
        message,
        sender_type: 'client'  // ✅ VERIFIED: Explicitly set sender_type for client messages
      };
      
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to send message to backend');
    }
  }

  /**
   * Health check to verify backend connectivity (PUBLIC)
   */
  static async healthCheck() {
    try {
      const response = await fetch(`${BASE_URL}/healthcheck`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get restaurant information (PUBLIC - no auth required)
   */
  static async getRestaurantInfo(restaurantId) {
    try {
      const response = await fetch(`${BASE_URL}/restaurant/info?restaurant_id=${restaurantId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get restaurant info:', error);
      return null;
    }
  }

  /**
   * Get client conversation (PUBLIC - no auth required)
   * This allows customers to see their own conversation history
   */
  static async getClientConversation(restaurantId, clientId) {
    try {
      const response = await fetch(`${BASE_URL}/clients/logs?restaurant_id=${restaurantId}&client_id=${clientId}`);
      if (!response.ok) {
        // If endpoint doesn't exist or fails, return empty array (graceful degradation)
        console.warn('Client conversation endpoint not available');
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to get client conversation:', error);
      // Graceful degradation - return empty array so chat still works
      return [];
    }
  }

  /**
   * Create a new restaurant in the backend (ADMIN ONLY - but public endpoint)
   */
  static async createRestaurant(restaurantData) {
    try {
      const response = await fetch(`${BASE_URL}/restaurant/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create restaurant API Error:', error);
      throw new Error(error.message || 'Failed to create restaurant');
    }
  }

  /**
   * Update an existing restaurant in the backend (ADMIN ONLY - but public endpoint)
   */
  static async updateRestaurant(restaurantData) {
    try {
      const response = await fetch(`${BASE_URL}/restaurant/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update restaurant API Error:', error);
      throw new Error(error.message || 'Failed to update restaurant');
    }
  }

  /**
   * List all restaurants from the backend (PUBLIC)
   */
  static async listRestaurants() {
    try {
      const response = await fetch(`${BASE_URL}/restaurant/list`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List restaurants API Error:', error);
      throw new Error('Failed to fetch restaurants');
    }
  }

  /**
   * Delete a restaurant from the backend (ADMIN ONLY - but public endpoint)
   */
  static async deleteRestaurant(restaurantId) {
    try {
      const response = await fetch(`${BASE_URL}/restaurant/delete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurant_id: restaurantId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete restaurant API Error:', error);
      throw new Error(error.message || 'Failed to delete restaurant');
    }
  }
}