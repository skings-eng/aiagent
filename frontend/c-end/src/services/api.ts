import axios from 'axios';

// Configure axios base URL - support both development and production environments
const getBaseURL = () => {
  // In production, use the current domain with port 8001
  if (import.meta.env.PROD) {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  // In development, use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8001';
};

axios.defaults.baseURL = getBaseURL();

// Add request interceptor for better error handling and CORS
axios.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Enable credentials for CORS
axios.defaults.withCredentials = true;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  response: string;
  stockData?: string[];
}

export const chatAPI = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await axios.post('/api/v1/chat', data);
    return response.data;
  },

  getChatHistory: async (): Promise<ChatMessage[]> => {
    const response = await axios.get('/api/v1/chat/history');
    return response.data;
  }
};

export default chatAPI;