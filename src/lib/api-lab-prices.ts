import { getCustomAxios } from './api-utils';
import type { LabService, LabServicePrice, PaginatedArray } from './types';
import axios from 'axios';

const customAxios = getCustomAxios();

// ===== LAB SERVICES =====

export const getLabServices = async (
  branchId: number,
  page: number = 1,
  limit: number = 20,
  filters?: {
    search?: string;
    category?: string;
    active?: boolean;
  }
): Promise<PaginatedArray<LabService>> => {
  console.log('API CALL: getLabServices', { branchId, page, filters });
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());

    const response = await customAxios.get(`/lab-services?${params.toString()}`);
    const data = response.data;

    if (Array.isArray(data)) {
      return data as unknown as PaginatedArray<LabService>;
    }

    return data as PaginatedArray<LabService>;
  } catch (error) {
    console.error('Error fetching lab services:', error);
    throw error;
  }
};

export const getLabService = async (id: number): Promise<LabService> => {
  console.log('API CALL: getLabService', { id });
  try {
    const response = await customAxios.get(`/lab-services/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching lab service:', error);
    throw error;
  }
};

export const createLabService = async (data: {
  service_name: string;
  category?: string;
  is_active?: boolean;
}): Promise<LabService> => {
  console.log('API CALL: createLabService', { data });
  try {
    const response = await customAxios.post('/lab-services', {
      service_name: data.service_name,
      category: data.category || null,
      is_active: data.is_active ?? true,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating lab service:', error);
    throw error;
  }
};

export const updateLabService = async (
  id: number,
  data: Partial<{
    service_name: string;
    category?: string;
    is_active?: boolean;
  }>
): Promise<LabService> => {
  console.log('API CALL: updateLabService', { id, data });
  try {
    const response = await customAxios.put(`/lab-services/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating lab service:', error);
    throw error;
  }
};

export const deleteLabService = async (id: number): Promise<void> => {
  console.log('API CALL: deleteLabService', { id });
  try {
    await customAxios.delete(`/lab-services/${id}`);
  } catch (error) {
    console.error('Error deleting lab service:', error);
    throw error;
  }
};

export const getServicePrices = async (serviceId: number): Promise<LabServicePrice[]> => {
  console.log('API CALL: getServicePrices', { serviceId });
  try {
    const response = await customAxios.get(`/lab-services/${serviceId}/prices`);
    return response.data;
  } catch (error) {
    console.error('Error fetching service prices:', error);
    throw error;
  }
};

// ===== LAB SERVICE PRICES =====

export const getLabServicePrices = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    search?: string;
    lab?: string;
    service_id?: number;
    min_price?: number;
    max_price?: number;
    active?: boolean;
  }
): Promise<PaginatedArray<LabServicePrice>> => {
  console.log('API CALL: getLabServicePrices', { page, filters });
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.lab) params.append('lab', filters.lab);
    if (filters?.service_id) params.append('service_id', filters.service_id.toString());
    if (filters?.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters?.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters?.active !== undefined) params.append('active', filters.active.toString());

    const response = await customAxios.get(`/lab-service-prices?${params.toString()}`);
    const data = response.data;

    if (Array.isArray(data)) {
      return data as unknown as PaginatedArray<LabServicePrice>;
    }

    return data as PaginatedArray<LabServicePrice>;
  } catch (error) {
    console.error('Error fetching lab service prices:', error);
    throw error;
  }
};

export const createLabServicePrice = async (data: {
  lab_service_id: number;
  lab: string;
  base_price: number;
  is_active?: boolean;
}): Promise<LabServicePrice> => {
  console.log('API CALL: createLabServicePrice', { data });
  try {
    const response = await customAxios.post('/lab-service-prices', {
      lab_service_id: data.lab_service_id,
      lab: data.lab,
      base_price: data.base_price,
      is_active: data.is_active ?? true,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating lab service price:', error);
    throw error;
  }
};

export const updateLabServicePrice = async (
  id: number,
  data: Partial<{
    lab_service_id: number;
    lab: string;
    base_price: number;
    is_active: boolean;
  }>
): Promise<LabServicePrice> => {
  console.log('API CALL: updateLabServicePrice', { id, data });
  try {
    const response = await customAxios.put(`/lab-service-prices/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating lab service price:', error);
    throw error;
  }
};

export const deleteLabServicePrice = async (id: number): Promise<void> => {
  console.log('API CALL: deleteLabServicePrice', { id });
  try {
    await customAxios.delete(`/lab-service-prices/${id}`);
  } catch (error) {
    console.error('Error deleting lab service price:', error);
    throw error;
  }
};

export const getActivePriceForService = async (serviceId: number): Promise<LabServicePrice | null> => {
  console.log('API CALL: getActivePriceForService', { serviceId });
  try {
    const response = await customAxios.get(`/lab-services/price-for-date?service_id=${serviceId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching active price:', error);
    throw error;
  }
};
