import axios from 'axios';

// Replace with your current local IP
export const BASE_URL = 'http://192.168.1.9:5000/api';
// export const BASE_URL = 'https://tracker-app-r6gy.onrender.com/api';
// export const BASE_URL = 'https://team75.onrender.com/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Axios throws an error for 4xx/5xx responses automatically
export const authService = {
  signup: async (data: any) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  login: async (data: any) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  startShift: async (userId: string) => {
    // Clean ID here just in case AsyncStorage added quotes
    const cleanId = userId.replace(/['"]+/g, '');
    const response = await apiClient.post('/shift/start', { userId: cleanId });
    return response.data;
  },

  getUserProfile: async (userId: string) => {
    const cleanId = userId.replace(/['"]+/g, '');
    // Note: Axios uses the second argument of .get for config, not body
    const response = await apiClient.get(`/auth/profile/${cleanId}`);
    return response.data;
  },

  getHistory: async (userId: string) => {
    const cleanId = userId.replace(/['"]+/g, '');
    const response = await apiClient.get(`/history/${cleanId}`);
    return response.data;
  },

  getOngoingShifts: async () => {
    const response = await apiClient.get('/admin/ongoing-shifts');
    return response.data;
  },

  getShiftDetails: async (shiftId: string) => {
    const response = await apiClient.get(`/admin/shift/${shiftId}`);
    return response.data;
  },

  getAllWorkers: async () => {
    const response = await apiClient.get('/admin/all-workers');
    return response.data;
  },

  // getHistory: async (userId: string) => {
  //   const cleanId = userId.replace(/['"]+/g, '');
  //   const response = await apiClient.get(`/history/${cleanId}`);
  //   return response.data;
  // },
};