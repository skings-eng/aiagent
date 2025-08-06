import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API configuration
// @ts-ignore - Vite env variables
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiChatRequest {
  message: string;
  history?: GeminiMessage[];
}

export interface GeminiChatResponse {
  success: boolean;
  response: string;
  error?: string;
}

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async sendMessage(request: GeminiChatRequest): Promise<GeminiChatResponse> {
    try {
      if (!API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      // Start a chat session with history
      const chat = this.model.startChat({
        history: request.history || [],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });

      // Send the message
      const result = await chat.sendMessage(request.message);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      if (!API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini content generation error:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;