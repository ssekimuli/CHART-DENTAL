import axios from 'axios';
import { getAuthToken, clearCurrentUser } from './user';
import { toast } from '@/hooks/use-toast';

const customAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ||'https://shalomdentalcareapi.poslycloud.com/api',

  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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

customAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle unauthenticated responses

    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;

      // Check for 401 status or "Unauthenticated" message

      if (status === 401 || data?.message === "Unauthenticated.") {
        // Clear user session
        clearCurrentUser();

        // Show toast notification
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
        });

        // Redirect to login page
        // if (typeof window !== 'undefined') {
        //   window.location.href = '/login';
        // }

        return Promise.reject(error);
      }
    }

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
