import customAxios from './axios';

export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://stagingapi.poslycloud.com/api';
};

export const getCustomAxios = () => {
  return customAxios;
};

export default {
  url: getApiUrl(),
  axios: getCustomAxios(),
};
