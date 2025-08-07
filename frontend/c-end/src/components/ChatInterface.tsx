import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, AlertCircle } from 'lucide-react';
import LoadingDots from './LoadingDots';
import StockChart from './StockChart';
import LinePromotion from './LinePromotion';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  stockData?: any;
  showLinePromo?: boolean;
  lineConfig?: {
    url: string;
    displayText: string;
    description: string;
  };
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'こんにちは！日本株式の分析についてお手伝いします。銘柄コードや企業名を教えてください。',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lineConfig, setLineConfig] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedInput,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Additional safety check before sending
      if (!trimmedInput || typeof trimmedInput !== 'string') {
        throw new Error('無効なメッセージです');
      }

      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          history: messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('ネットワークエラーが発生しました');
      }

      const data = await response.json();
      
      // Get LINE config if promotion should be shown
      let currentLineConfig = lineConfig;
      if (data.showLinePromo && !currentLineConfig) {
        try {
          const configResponse = await fetch('/api/v1/line/config', {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const configData = await configResponse.json();
          if (configData.success && configData.data) {
            currentLineConfig = configData.data;
            setLineConfig(currentLineConfig);
          }
        } catch (error) {
          console.error('Error fetching LINE config:', error);
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        stockData: data.stockData,
        showLinePromo: data.showLinePromo,
        lineConfig: currentLineConfig
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">日本株式AI分析</h1>
            <p className="text-sm text-gray-600">リアルタイム株価分析とAIによる投資アドバイス</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-blue-500 ml-3' 
                    : 'bg-gray-600 mr-3'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Stock Chart */}
                  {message.stockData && (
                    <div className="mt-4">
                      <StockChart data={message.stockData} />
                    </div>
                  )}
                  
                  {/* LINE Promotion */}
                  {message.showLinePromo && (
                    <div className="mt-4">
                      <LinePromotion 
                        url={message.lineConfig?.url}
                        displayText={message.lineConfig?.displayText}
                        description={message.lineConfig?.description}
                      />
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row space-x-3 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mr-3">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <LoadingDots />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="銘柄コードや企業名を入力してください（例：7203、トヨタ）"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>送信</span>
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border-t border-yellow-200 p-3">
        <div className="max-w-4xl mx-auto flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>免責事項：</strong>
            本サービスで提供される情報は投資判断の参考として提供されるものであり、投資勧誘を目的としたものではありません。
            投資に関する最終的な決定は、お客様ご自身の判断でなさるようお願いいたします。
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;