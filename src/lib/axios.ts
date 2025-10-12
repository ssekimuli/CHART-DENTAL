import axios from 'axios';
import { getAuthToken } from './user';

const customAxios = axios.create({
  baseURL: '/api/backend',
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

export default customAxios;
