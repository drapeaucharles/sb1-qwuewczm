/**
 * Utility functions for restaurant management
 */

import { MenuItem, FAQItem } from '../types/restaurant';

/**
 * Generate a unique restaurant ID
 */
export function generateRestaurantId(): string {
  // Generate a short, URL-friendly ID
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `rest_${timestamp}_${randomPart}`;
}

/**
 * Transform form data to API format
 */
export interface RestaurantProfileUpdatePayload {
  name: string;
  story: string;
  opening_hours: Record<string, string>;
  menu: MenuItem[];
  faq: FAQItem[];
  whatsapp_number?: string;
}

/**
 * Safely initialize a menu item with all required fields
 */
export function safeInitializeMenuItem(item?: Partial<MenuItem>): MenuItem {
  return {
    // Legacy fields (backward compatibility)
    dish: item?.dish || item?.title || '',
    description: item?.description || '',
    price: item?.price || '',
    ingredients: Array.isArray(item?.ingredients) ? item.ingredients : [''],
    allergens: Array.isArray(item?.allergens) ? item.allergens : ['none'],
    
    // New enhanced fields
    title: item?.title || item?.dish || '',
    category: item?.category || '',
    subcategory: item?.subcategory || '',
    info: item?.info || '',
    area: item?.area || '',
  };
}

/**
 * Safely initialize a menu array
 */
export function safeInitializeMenu(menu?: MenuItem[]): MenuItem[] {
  if (!Array.isArray(menu) || menu.length === 0) {
    return [safeInitializeMenuItem()];
  }
  
  return menu.map(item => safeInitializeMenuItem(item));
}

export function transformRestaurantFormData(formData: any) {
  // ✅ Add safety checks for all form data properties
  const safeFormData = formData || {};
  
  return {
    restaurant_id: safeFormData.restaurant_id || '',
    data: {
      name: safeFormData.name || '',
      story: safeFormData.restaurant_story || '',
      menu: safeInitializeMenu(safeFormData.menu).map((item: MenuItem) => ({
        // ✅ Required fields (backend expects these)
        title: item?.title || item?.dish || '',
        description: item?.description || '',
        price: item?.price || '',
        
        // ✅ Optional enhanced fields - send null instead of empty strings
        category: item?.category || null,
        subcategory: item?.subcategory || null,
        info: item?.info || null,
        area: item?.area || null,
        ingredients: Array.isArray(item?.ingredients) && item.ingredients.length > 0 ? item.ingredients : [],
        allergens: Array.isArray(item?.allergens) && item.allergens.length > 0 ? item.allergens : [],
        
        // ✅ Legacy fields (for backward compatibility)
        dish: item?.dish || item?.title || '',
      })),
      faq: (safeFormData.faq || []).map((item: FAQItem) => ({
        question: item?.question || '',
        answer: item?.answer || ''
      })),
      opening_hours: safeFormData.opening_hours || {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: '',
      },
      contact_info: safeFormData.contact_info || {
        phone: '',
        email: '',
        address: '',
      }
    }
  };
}

/**
 * Transform API response to form data format
 */
export function transformApiResponseToFormData(apiData: any) {
  // Handle both direct data format and nested data format
  const data = apiData?.data || apiData || {};
  
  return {
    restaurant_id: apiData?.restaurant_id || data?.restaurant_id || '',
    name: data?.name || '',
    restaurant_story: data?.story || '',
    opening_hours: data?.opening_hours || {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    },
    contact_info: data?.contact_info || {
      phone: '',
      email: '',
      address: '',
    },
    menu: safeInitializeMenu(data?.menu), // ✅ Use safe initialization
    faq: Array.isArray(data?.faq) && data.faq.length > 0 ? data.faq : [{ 
      question: '', 
      answer: '' 
    }],
    whatsapp_number: data?.whatsapp_number || '',
  };
}

/**
 * Transform form data to profile API format
 */
export function transformFormDataToProfile(formData: any): RestaurantProfileUpdatePayload {
  // ✅ Add comprehensive safety checks and debugging
  console.log('transformFormDataToProfile input:', formData);
  
  const safeFormData = formData || {};
  
  // ✅ Ensure FAQ is always an array
  let safeFaq = [];
  if (Array.isArray(safeFormData.faq)) {
    safeFaq = safeFormData.faq;
  } else if (Array.isArray(safeFormData.restaurant_data?.faq)) {
    safeFaq = safeFormData.restaurant_data.faq;
  } else {
    safeFaq = [{ question: '', answer: '' }];
  }
  
  // ✅ Ensure menu is always an array
  let safeMenu = [];
  if (Array.isArray(safeFormData.menu)) {
    safeMenu = safeFormData.menu;
  } else if (Array.isArray(safeFormData.restaurant_data?.menu)) {
    safeMenu = safeFormData.restaurant_data.menu;
  } else {
    safeMenu = [];
  }
  
  const result = {
    name: safeFormData.name || safeFormData.restaurant_data?.name || '',
    story: safeFormData.restaurant_story || safeFormData.story || safeFormData.restaurant_data?.story || '',
    opening_hours: safeFormData.opening_hours || safeFormData.restaurant_data?.opening_hours || {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    },
    menu: safeInitializeMenu(safeMenu).map((item: MenuItem) => ({
      // ✅ Required fields (backend expects these)
      title: item?.title || item?.dish || '',
      description: item?.description || '',
      price: item?.price || '',
      
      // ✅ Optional enhanced fields - send null instead of empty strings
      category: item?.category || null,
      subcategory: item?.subcategory || null,
      info: item?.info || null,
      area: item?.area || null,
      ingredients: Array.isArray(item?.ingredients) && item.ingredients.length > 0 ? item.ingredients : [],
      allergens: Array.isArray(item?.allergens) && item.allergens.length > 0 ? item.allergens : [],
      
      // ✅ Legacy fields (for backward compatibility)
      dish: item?.dish || item?.title || '',
    })),
    faq: safeFaq.map((item: any) => ({
      question: item?.question || '',
      answer: item?.answer || ''
    })),
    whatsapp_number: safeFormData.whatsapp_number || safeFormData.restaurant_data?.whatsapp_number || '',
  };
  
  console.log('transformFormDataToProfile output:', result);
  return result;
}