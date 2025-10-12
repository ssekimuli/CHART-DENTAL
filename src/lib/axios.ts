import axios from 'axios';
import { getAuthToken } from './user';
import { toast } from '@/hooks/use-toast';

const customAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to include the auth token
customAxios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
customAxios.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Handle network errors (e.g., ERR_CONNECTION_REFUSED)
    if (axios.isAxiosError(error) && !error.response) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not connect to the server. Please ensure the backend is running and accessible.",
      });
    }
    
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    return Promise.reject(error);
  }
);


export default customAxios;
