import customAxios from './axios';

export const getApiUrl = (): string => {
  return customAxios.defaults.baseURL || '';
};

export const getCustomAxios = () => {
  return customAxios;
};

export default {
  url: getApiUrl(),
  axios: getCustomAxios(),
};
