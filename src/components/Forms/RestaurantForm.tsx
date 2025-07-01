import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Phone, ChevronDown } from 'lucide-react';
import { Restaurant, MenuItem, FAQItem } from '../../types/restaurant';
import { useNavigate } from 'react-router-dom';
import { generateRestaurantId } from '../../utils/restaurantUtils';

interface RestaurantFormProps {
  restaurant?: Restaurant;
  onSubmit: (data: any) => Promise<void>;
  isEditing?: boolean;
  isOwnerEdit?: boolean; // New prop to distinguish owner edit from admin edit
}

export const RestaurantForm: React.FC<RestaurantFormProps> = ({
  restaurant,
  onSubmit,
  isEditing = false,
  isOwnerEdit = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Helper function to safely initialize menu items with all required fields
  const initializeMenuItem = (item?: Partial<MenuItem>): MenuItem => {
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
  };

  // Helper function to safely initialize menu array
  const initializeMenu = (menu?: MenuItem[]): MenuItem[] => {
    if (!Array.isArray(menu) || menu.length === 0) {
      return [initializeMenuItem()];
    }
    
    return menu.map(item => initializeMenuItem(item));
  };

  const [formData, setFormData] = useState({
    restaurant_id: restaurant?.restaurant_id || generateRestaurantId(),
    password: '', // Added password field for new restaurants
    name: restaurant?.name || '',
    opening_hours: restaurant?.opening_hours || {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    },
    contact_info: restaurant?.contact_info || {
      phone: '',
      email: '',
      address: '',
    },
    restaurant_story: restaurant?.restaurant_story || '',
    menu: initializeMenu(restaurant?.menu), // ✅ Safe initialization
    faq: restaurant?.faq || [{ question: '', answer: '' }],
    whatsapp_number: (restaurant as any)?.whatsapp_number || '', // Add WhatsApp number field
  });

  // Menu category options
  const categoryOptions = [
    { value: '', label: 'None (No Category)' },
    { value: 'Breakfast', label: 'Breakfast' },
    { value: 'Brunch', label: 'Brunch' },
    { value: 'Lunch', label: 'Lunch' },
    { value: 'Dinner', label: 'Dinner' },
    { value: 'Cocktail/Drink List', label: 'Cocktail/Drink List' },
  ];

  // Subcategory options (only for certain categories)
  const subcategoryOptions = [
    { value: '', label: 'None' },
    { value: 'starter', label: 'Starter' },
    { value: 'main', label: 'Main' },
    { value: 'dessert', label: 'Dessert' },
  ];

  // Area options
  const areaOptions = [
    'Poolside',
    'Outdoor', 
    'Indoor',
    'Bar',
    'VIP',
    'Main Dining',
    'Terrace',
    'Garden'
  ];

  // Common allergen options
  const allergenOptions = [
    'none',
    'wheat',
    'milk',
    'eggs',
    'fish',
    'shellfish',
    'tree nuts',
    'peanuts',
    'soy',
    'sesame'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    
    try {
      let submitData: any;
      
      if (isOwnerEdit) {
        // For owner edit, submit directly to profile endpoint
        submitData = {
          restaurant_data: {
            name: formData.name,
            opening_hours: formData.opening_hours,
            contact_info: formData.contact_info,
            restaurant_story: formData.restaurant_story,
            menu: formData.menu,
            faq: formData.faq,
            whatsapp_number: formData.whatsapp_number,
          },
        };
      } else {
        // For admin create/edit, use the existing format
        submitData = {
          restaurant_id: formData.restaurant_id,
          restaurant_data: {
            name: formData.name,
            opening_hours: formData.opening_hours,
            contact_info: formData.contact_info,
            restaurant_story: formData.restaurant_story,
            menu: formData.menu,
            faq: formData.faq,
            whatsapp_number: formData.whatsapp_number,
          },
        };

        // Add password for new restaurants only
        if (!isEditing && formData.password) {
          submitData.password = formData.password;
        }
      }

      await onSubmit(submitData);
      
      setSubmitStatus('success');
      
      // Show success message briefly, then navigate
      setTimeout(() => {
        if (isOwnerEdit) {
          navigate('/owner');
        } else {
          navigate('/admin/restaurants');
        }
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save restaurant');
    } finally {
      setLoading(false);
    }
  };

  const generateNewId = () => {
    setFormData({ ...formData, restaurant_id: generateRestaurantId() });
  };

  const addMenuItem = () => {
    setFormData({
      ...formData,
      menu: [...(formData.menu || []), initializeMenuItem()], // ✅ Use safe initialization
    });
  };

  const removeMenuItem = (index: number) => {
    setFormData({
      ...formData,
      menu: (formData.menu || []).filter((_, i) => i !== index),
    });
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string | string[]) => {
    const updatedMenu = [...(formData.menu || [])];
    
    // ✅ Ensure the menu item exists and has all required fields
    if (!updatedMenu[index]) {
      updatedMenu[index] = initializeMenuItem();
    }
    
    updatedMenu[index] = { ...updatedMenu[index], [field]: value };
    
    // Clear subcategory if category doesn't support it
    if (field === 'category') {
      const category = value as string;
      const supportsSubcategory = ['Breakfast', 'Brunch', 'Lunch', 'Dinner'].includes(category);
      if (!supportsSubcategory) {
        updatedMenu[index].subcategory = '';
      }
    }
    
    setFormData({ ...formData, menu: updatedMenu });
  };

  const addFAQ = () => {
    setFormData({
      ...formData,
      faq: [...(formData.faq || []), { question: '', answer: '' }],
    });
  };

  const removeFAQ = (index: number) => {
    setFormData({
      ...formData,
      faq: (formData.faq || []).filter((_, i) => i !== index),
    });
  };

  const updateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    const updatedFAQ = [...(formData.faq || [])];
    
    // ✅ Ensure the FAQ item exists
    if (!updatedFAQ[index]) {
      updatedFAQ[index] = { question: '', answer: '' };
    }
    
    updatedFAQ[index] = { ...updatedFAQ[index], [field]: value };
    setFormData({ ...formData, faq: updatedFAQ });
  };

  // Helper function to check if category supports subcategory
  const categorySupportsSubcategory = (category: string) => {
    return ['Breakfast', 'Brunch', 'Lunch', 'Dinner'].includes(category);
  };

  const backUrl = isOwnerEdit ? '/owner' : '/admin/restaurants';
  const pageTitle = isOwnerEdit 
    ? (isEditing ? 'Edit Restaurant Profile' : 'Create Restaurant Profile')
    : (isEditing ? 'Edit Restaurant' : 'Create New Restaurant');
  const pageDescription = isOwnerEdit
    ? 'Update your restaurant information and AI assistant data'
    : (isEditing 
      ? 'Update restaurant information and AI assistant data'
      : 'Set up a new restaurant with AI assistant capabilities');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(backUrl)}
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {isOwnerEdit ? 'Dashboard' : 'Restaurants'}
        </button>
        <h1 className="text-3xl font-bold text-slate-800">
          {pageTitle}
        </h1>
        <p className="text-slate-600 mt-2">
          {pageDescription}
        </p>
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-green-800 font-medium">Restaurant saved successfully!</h3>
              <p className="text-green-700 text-sm">Redirecting...</p>
            </div>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error saving restaurant</h3>
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Restaurant ID - Only show for admin, not for owner edit */}
            {!isOwnerEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Restaurant ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.restaurant_id}
                    onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                    placeholder="unique-restaurant-id"
                    required
                    disabled={isEditing}
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={generateNewId}
                      className="px-3 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                      title="Generate new ID"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!isEditing && (
                  <p className="text-xs text-slate-500 mt-1">
                    This ID will be used for login and in QR codes
                  </p>
                )}
              </div>
            )}
            
            <div className={isOwnerEdit ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Amazing Restaurant"
                required
              />
            </div>
          </div>

          {/* Password field for new restaurants only (admin only) */}
          {!isOwnerEdit && !isEditing && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter a secure password for the restaurant owner"
                required
                minLength={6}
              />
              <p className="text-xs text-slate-500 mt-1">
                This password will be used by the restaurant owner to log in
              </p>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Restaurant Story
            </label>
            <textarea
              value={formData.restaurant_story}
              onChange={(e) => setFormData({ ...formData, restaurant_story: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Tell the story of your restaurant... This will help the AI assistant provide better responses to customers."
            />
            <p className="text-xs text-slate-500 mt-1">
              This information helps the AI assistant understand your restaurant's personality and history
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={(formData.contact_info || {}).phone || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  contact_info: { ...(formData.contact_info || {}), phone: e.target.value }
                })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={(formData.contact_info || {}).email || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  contact_info: { ...(formData.contact_info || {}), email: e.target.value }
                })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="info@restaurant.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={(formData.contact_info || {}).address || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  contact_info: { ...(formData.contact_info || {}), address: e.target.value }
                })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="123 Main St, City, State"
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              WhatsApp Business Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="+1234567890"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Optional: Enter your WhatsApp Business number for customer communication integration
            </p>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Opening Hours</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(formData.opening_hours || {}).map((day) => (
              <div key={day}>
                <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">
                  {day}
                </label>
                <input
                  type="text"
                  value={(formData.opening_hours || {})[day] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    opening_hours: { ...(formData.opening_hours || {}), [day]: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="11:00 AM - 10:00 PM"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Menu Items</h2>
              <p className="text-sm text-slate-600 mt-1">Add your menu items with enhanced categorization and details</p>
            </div>
            <button
              type="button"
              onClick={addMenuItem}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>
          
          <div className="space-y-8">
            {(formData.menu || []).map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-slate-800">Menu Item #{index + 1}</h3>
                  {(formData.menu || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMenuItem(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Basic Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateMenuItem(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dish name (e.g., Buffalo Ribeye)"
                  />
                  <input
                    type="text"
                    value={item.price || ''}
                    onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Price (e.g., 320K IDR)"
                  />
                </div>
                
                {/* Description */}
                <textarea
                  value={item.description || ''}
                  onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  placeholder="Description of the dish"
                  rows={2}
                />

                {/* Category and Subcategory Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={item.category || ''}
                        onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Conditional Subcategory */}
                  {categorySupportsSubcategory(item.category || '') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Subcategory
                      </label>
                      <div className="relative">
                        <select
                          value={item.subcategory || ''}
                          onChange={(e) => updateMenuItem(index, 'subcategory', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          {subcategoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info and Area Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Info (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.info || ''}
                      onChange={(e) => updateMenuItem(index, 'info', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Pairs well with Malbec"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Area (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.area || ''}
                      onChange={(e) => updateMenuItem(index, 'area', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Main Dining, Poolside"
                      list={`area-options-${index}`}
                    />
                    <datalist id={`area-options-${index}`}>
                      {areaOptions.map((area) => (
                        <option key={area} value={area} />
                      ))}
                    </datalist>
                  </div>
                </div>
                
                {/* Ingredients and Allergens Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ingredients
                    </label>
                    <input
                      type="text"
                      value={(Array.isArray(item.ingredients) ? item.ingredients : ['']).join(', ')}
                      onChange={(e) =>
                        updateMenuItem(index, 'ingredients', e.target.value.split(', ').filter(i => i.trim()))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ingredients (comma separated)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Allergens
                    </label>
                    <input
                      type="text"
                      value={(Array.isArray(item.allergens) ? item.allergens : ['none']).join(', ')}
                      onChange={(e) => {
                        const allergens = e.target.value.split(', ').filter(a => a.trim());
                        updateMenuItem(index, 'allergens', allergens.length > 0 ? allergens : ['none']);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Allergens (comma separated, or 'none')"
                      list={`allergen-options-${index}`}
                    />
                    <datalist id={`allergen-options-${index}`}>
                      {allergenOptions.map((allergen) => (
                        <option key={allergen} value={allergen} />
                      ))}
                    </datalist>
                    <p className="text-xs text-slate-500 mt-1">
                      Defaults to "none" if empty
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Example Entries Preview */}
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Example Entries</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg">
                <h5 className="font-medium text-slate-800 mb-2">Buffalo Ribeye (Full Entry)</h5>
                <div className="space-y-1 text-slate-600">
                  <p><strong>Category:</strong> Dinner → Main</p>
                  <p><strong>Price:</strong> 320K IDR</p>
                  <p><strong>Info:</strong> Pairs well with Malbec</p>
                  <p><strong>Area:</strong> Main Dining</p>
                  <p><strong>Allergens:</strong> none</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h5 className="font-medium text-slate-800 mb-2">Truffle Pasta (Minimal)</h5>
                <div className="space-y-1 text-slate-600">
                  <p><strong>Category:</strong> None</p>
                  <p><strong>Price:</strong> 180K IDR</p>
                  <p><strong>Allergens:</strong> wheat, milk</p>
                  <p><em>Other fields optional</em></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">FAQ</h2>
              <p className="text-sm text-slate-600 mt-1">Common questions and answers to help the AI assistant</p>
            </div>
            <button
              type="button"
              onClick={addFAQ}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </button>
          </div>
          
          <div className="space-y-4">
            {(formData.faq || []).map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-800">FAQ #{index + 1}</h3>
                  {(formData.faq || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={faq?.question || ''}
                    onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Question"
                  />
                  <textarea
                    value={faq?.answer || ''}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Answer"
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || submitStatus === 'success'}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full w-5 h-5 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : submitStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Success!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {isEditing ? 'Update Restaurant' : 'Create Restaurant'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* QR Code Preview - Only show for admin creating new restaurants */}
      {!isOwnerEdit && !isEditing && formData.restaurant_id && (
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">QR Code Preview</h3>
          <p className="text-blue-800 text-sm mb-3">
            After creating this restaurant, customers will scan QR codes that link to:
          </p>
          <div className="bg-white rounded-lg p-3 font-mono text-sm text-slate-700 break-all">
            {window.location.origin}/chat?restaurant_id={formData.restaurant_id}&table_id=1
          </div>
        </div>
      )}
    </div>
  );
};