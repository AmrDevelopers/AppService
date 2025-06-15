// src/lib/requests.ts
import apiClient from '../utils/apiClient';

export const getJobsByStatus = async (status: string) => {
  try {
    const response = await apiClient.get(`/jobs/status/${status}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching jobs by status:', error?.response?.data || error);
    throw error;
  }
};
