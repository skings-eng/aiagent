import axios from 'axios';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8001';

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
    const response = await axios.post('/api/chat', data);
    return response.data;
  },

  getChatHistory: async (): Promise<ChatMessage[]> => {
    const response = await axios.get('/api/chat/history');
    return response.data;
  }
};

export default chatAPI;