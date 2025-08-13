import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Brain, Copy, MessageCircle } from 'lucide-react';
import { chatAPI, ChatMessage, LineConfig } from '../../services/api';
import StockAnalysisCard from '../../components/StockAnalysisCard';
import LinePromotion from '../../components/LinePromotion';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  stockData?: any;
  showLinePromo?: boolean;
  lineConfig?: LineConfig;
}

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 解析AI回复中的JSON股票数据
  const parseStockData = (content: string) => {
    try {
      console.log('开始解析股票数据，原始内容:', content);
      
      // 只有当内容明确包含股票相关关键词时才进行JSON解析
      const hasStockKeywords = /(?:股票|股价|分析|投资|财务|技术指标|基本面|股份|公司|市值|PE|PB|ROE)/i.test(content);
      if (!hasStockKeywords) {
        console.log('内容不包含股票相关关键词，跳过JSON解析');
        return { stockData: null, cleanContent: content };
      }
      
      // 方法1: 查找JSON代码块
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonStr = '';
      let matchedText = '';
      
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
        matchedText = jsonMatch[0];
        console.log('找到JSON代码块:', jsonStr);
      } else {
        // 方法2: 查找普通代码块中的JSON
        jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const blockContent = jsonMatch[1].trim();
          // 检查是否是JSON格式
          if (blockContent.startsWith('{') && blockContent.endsWith('}')) {
            jsonStr = blockContent;
            matchedText = jsonMatch[0];
            console.log('找到代码块中的JSON:', jsonStr);
          }
        }
      }
      
      if (jsonStr) {
        // 清理JSON字符串
        jsonStr = jsonStr.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        
        const stockData = JSON.parse(jsonStr);
        console.log('解析成功的股票数据:', stockData);
        
        // 验证是否包含必要的股票数据字段 - 更宽松的验证
        if (stockData.name && stockData.code && (stockData.price !== undefined || stockData.current_price !== undefined)) {
          const cleanContent = content.replace(matchedText, '').trim() || '股票分析数据已生成';
          console.log('股票数据验证通过，返回结果');
          return {
            stockData,
            cleanContent
          };
        } else {
          console.log('股票数据验证失败，缺少必要字段:', { name: stockData.name, code: stockData.code, price: stockData.price, current_price: stockData.current_price });
          // 如果包含其他股票相关字段，也认为是有效的股票数据
          if (stockData.technical || stockData.fundamental || stockData.summary) {
            console.log('检测到其他股票分析字段，认为是有效数据');
            const cleanContent = content.replace(matchedText, '').trim() || '股票分析数据已生成';
            return {
              stockData,
              cleanContent
            };
          }
        }
      } else {
        console.log('未找到JSON数据');
      }
    } catch (error) {
      console.error('解析股票数据失败:', error);
      console.log('原始内容:', content);
    }
    return { stockData: null, cleanContent: content };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Convert messages to ChatMessage format
      const history: ChatMessage[] = messages.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Send message to backend API
      const response = await chatAPI.sendMessage({
        message: userMessage.content,
        history
      });

      // 解析AI回复中的股票数据
      const { stockData, cleanContent } = parseStockData(response.response);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
        stockData: stockData,
        showLinePromo: response.showLinePromo,
        lineConfig: response.lineConfig,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Extract error message from response
      let errorContent = t('chat.error', { defaultValue: '申し訳ございません。エラーが発生しました。もう一度お試しください。' });
      
      if (error?.response?.data?.message) {
        errorContent = error.response.data.message;
      } else if (error?.message) {
        errorContent = error.message;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 shadow-sm">
        <div className="flex items-center space-x-3 max-w-4xl">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              AI株式分析チャット
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              AIアシスタントと株式について話しましょう
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-6 animate-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                AI株式アナリスト
              </h2>
              <p className="text-gray-600 max-w-lg mx-auto text-sm">
                高度なアルゴリズムによる株式分析・投資判断支援システム
              </p>
            </div>

            {/* Quick Actions */}
            <div className="max-w-2xl mx-auto px-4">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
                {[
                  'AAPL分析',
                  '市場概況',
                  'トップ銘柄',
                  'リスク評価'
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(action)}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-md text-xs sm:text-sm font-medium"
                  >
                    {action}
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-gray-500">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>リアルタイム分析</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>AI予測モデル</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>テクニカル指標</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'justify-start' : 'justify-end'
            }`}
          >
            {message.type === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
            
            <div
              className={`inline-block max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[45%] ${
                message.type === 'assistant' && message.stockData ? 'max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]' : ''
              }`}
            >
              {/* 株式分析カード */}
              {message.type === 'assistant' && message.stockData ? (
                <div className="space-y-3">
                    {message.content && (
                      <div className="bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200/30 px-4 py-3 rounded-xl shadow-sm relative group">
                        <button 
                          onClick={() => navigator.clipboard.writeText(message.content)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed pr-8">{message.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {message.timestamp?.toLocaleTimeString?.('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) || new Date().toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  <StockAnalysisCard stockData={message.stockData} lineConfig={message.lineConfig} />
                  {/* LINE広告 */}
                  {message.showLinePromo && message.lineConfig && (
                    <LinePromotion
                      url={message.lineConfig.url}
                      displayText={message.lineConfig.displayText}
                      description={message.lineConfig.description}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`px-4 py-3 rounded-xl shadow-sm relative group ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200/30'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(message.content)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    )}
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                      message.type === 'assistant' ? 'pr-8' : ''
                    }`}>{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp?.toLocaleTimeString?.('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || new Date().toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {/* LINE広告 */}
                  {message.type === 'assistant' && message.showLinePromo && message.lineConfig && (
                    <LinePromotion
                      url={message.lineConfig.url}
                      displayText={message.lineConfig.displayText}
                      description={message.lineConfig.description}
                    />
                  )}
                </div>
              )}
            </div>
            
            {message.type === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3 justify-end">
            <div className="inline-block max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[45%]">
               <div className="bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200/30 px-4 py-3 rounded-xl shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      AI が分析中...
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="text-blue-600 font-medium">約30-90秒お待ちください（株式分析時は時間がかかる場合があります）</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200/30 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="株式について質問してください..."
                className="w-full px-4 py-3 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-200 text-sm"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">送信</span>
            </button>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center justify-center mt-3">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>AI株式アナリスト準備完了</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;