import axios from 'axios';

// Configure axios for B-end (admin panel)
// Use relative URLs to work with Vite proxy
axios.defaults.withCredentials = true;
// Set timeout to 300 seconds for AI responses (increased for stock analysis)
axios.defaults.timeout = 300000;

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