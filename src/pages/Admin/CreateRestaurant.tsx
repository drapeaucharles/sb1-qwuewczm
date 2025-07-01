import React from 'react';
import { RestaurantForm } from '../../components/Forms/RestaurantForm';
import { ApiService } from '../../services/api';

export const CreateRestaurant: React.FC = () => {
  const handleSubmit = async (data: any) => {
    await ApiService.createRestaurant(data);
  };

  return (
    <RestaurantForm onSubmit={handleSubmit} />
  );
};