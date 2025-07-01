export interface Restaurant {
  restaurant_id: string;
  name: string;
  opening_hours: Record<string, string>;
  contact_info: {
    phone: string;
    email: string;
    address: string;
  };
  restaurant_story: string;
  menu: MenuItem[];
  faq: FAQItem[];
  whatsapp_number?: string; // Add WhatsApp number field
}

export interface MenuItem {
  // Legacy fields (keep for backward compatibility)
  dish?: string;
  description?: string;
  price: string;
  ingredients: string[];
  allergens: string[];
  
  // New enhanced fields
  title?: string; // New primary name field
  category?: string; // Breakfast, Brunch, Lunch, Dinner, Cocktail/Drink List
  subcategory?: string; // starter, main, dessert (conditional)
  info?: string; // Pairing notes, special info
  area?: string; // Poolside, Outdoor, Indoor, Bar, VIP, etc.
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ChatMessage {
  restaurant_id: string;
  table_id: string;
  message: string;
}

export interface ChatResponse {
  answer: string;
}

export interface RestaurantListItem {
  restaurant_id: string;
  name: string;
}

export interface RestaurantProfile {
  name: string;
  story: string;
  opening_hours: Record<string, string>;
  menu: MenuItem[];
  faq: FAQItem[];
  whatsapp_number?: string;
}