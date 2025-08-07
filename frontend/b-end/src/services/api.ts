import axios from 'axios';

// Configure axios for B-end (admin panel)
// Use dynamic URLs for production deployment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Check for environment variable first, then fallback to dynamic detection
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isDevelopment
    ? 'http://localhost:8001' // Development server for API
    : `http://${window.location.hostname}:8001`); // Production server with same host

console.log('🔧 API Configuration:', {
  hostname: window.location.hostname,
  isDevelopment,
  API_BASE_URL,
  envVar: import.meta.env.VITE_API_BASE_URL
});

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
// Set timeout to 60 seconds for AI responses
axios.defaults.timeout = 60000;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface LineConfig {
  url: string;
  displayText: string;
  description: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  showLinePromo?: boolean;
  lineConfig?: LineConfig;
}

export const chatAPI = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    // No authentication required for public chat access
    const response = await axios.post('/api/v1/chat', data);
    return response.data;
  },

  getChatHistory: async (): Promise<ChatMessage[]> => {
    // No authentication required for public chat access
    const response = await axios.get('/api/v1/chat/history');
    return response.data;
  }
};

// Admin API functions that still require authentication
export const adminAPI = {
  // Add admin-specific API calls here that need authentication
  // For example: gemini config, system prompts, line config, settings
};

export default chatAPI;