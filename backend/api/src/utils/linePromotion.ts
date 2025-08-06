import axios from 'axios';
import { logger } from './logger';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// LINE promotion trigger logic
export async function checkLinePromotionTrigger(
  userId: string,
  userMessage: string,
  aiResponse: string,
  history: ChatMessage[]
): Promise<{ shouldShow: boolean; config?: any }> {
  try {
    // Get LINE configuration
    const LINE_SERVICE_URL = process.env.LINE_SERVICE_URL || 'http://localhost:3003';
    const configResponse = await axios.get(`${LINE_SERVICE_URL}/api/v1/line/config`);
    
    if (!configResponse.data.success || !configResponse.data.data) {
      logger.info('LINE config not found or not configured');
      return { shouldShow: false };
    }
    
    const config = configResponse.data.data;
    
    // Check if LINE promotion is active
    if (!config.isActive || !config.triggerConditions) {
      logger.info('LINE promotion is not active');
      return { shouldShow: false };
    }
    
    const { afterMessages, stockAnalysis, randomChance } = config.triggerConditions;
    
    // Check message count trigger
    const totalMessages = history.length + 1; // +1 for current message
    const shouldTriggerByCount = totalMessages >= afterMessages;
    
    // Check stock analysis trigger
    const isStockAnalysisResponse = stockAnalysis && (
      aiResponse.includes('股票') ||
      aiResponse.includes('股价') ||
      aiResponse.includes('分析') ||
      aiResponse.includes('投资') ||
      aiResponse.includes('市场') ||
      /\d{4}\.T/.test(aiResponse) || // Japanese stock code pattern
      aiResponse.includes('json') // Stock analysis JSON format
    );
    
    // Check random chance
    const randomValue = Math.random() * 100;
    const shouldTriggerByChance = randomValue < randomChance;
    
    // Determine if should show promotion
    const shouldShow = shouldTriggerByCount && (isStockAnalysisResponse || shouldTriggerByChance);
    
    logger.info('LINE promotion trigger check', {
      userId,
      totalMessages,
      afterMessages,
      shouldTriggerByCount,
      isStockAnalysisResponse,
      randomValue,
      randomChance,
      shouldTriggerByChance,
      shouldShow
    });
    
    if (shouldShow) {
      return {
        shouldShow: true,
        config: {
          url: config.url,
          displayText: config.displayText,
          description: config.description
        }
      };
    } else {
      return { shouldShow: false };
    }
    
  } catch (error) {
    logger.error('Error checking LINE promotion trigger', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { shouldShow: false };
  }
}