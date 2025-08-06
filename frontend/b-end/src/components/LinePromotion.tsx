import React from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LinePromotionProps {
  url: string;
  displayText: string;
  description: string;
}

const LinePromotion: React.FC<LinePromotionProps> = ({ url, displayText, description }) => {
  const { t } = useTranslation();
  
  const handleClick = () => {
    console.log('🔗 LINE按钮被点击，URL:', url);
    
    try {
      // 验证URL格式
      const urlObj = new URL(url);
      console.log('✅ URL格式验证通过:', urlObj.href);
      
      // 检查是否为LINE链接
      if (url.includes('line.me')) {
        console.log('📱 检测到LINE链接，使用特殊处理方式');
        
        // 对于LINE链接，直接使用location.href是最可靠的方法
        window.location.href = url;
        console.log('✅ 使用location.href跳转到LINE');
        return;
      }
      
      // 对于其他链接，尝试使用window.open打开
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        console.log('✅ 窗口打开成功');
      } else {
        console.warn('⚠️ window.open被阻止，尝试备用方法');
        
        // 备用方法1: 创建临时链接并点击
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ 使用备用方法打开链接');
      }
    } catch (error) {
      console.error('❌ 链接打开失败:', error);
      
      // 最后的备用方法：直接跳转
      try {
        window.location.href = url;
        console.log('✅ 使用location.href跳转');
      } catch (fallbackError) {
        console.error('❌ 所有跳转方法都失败:', fallbackError);
        alert(`无法打开链接，请手动访问: ${url}`);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-xl p-5 text-white shadow-xl border border-green-300/50 backdrop-blur-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2">{t('line.promotion.title')}</h3>
          <p className="text-green-100 text-sm mb-4 leading-relaxed">{t('line.promotion.description')}</p>
          
          {/* 功能特性标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              {t('line.promotion.features.realtime')}
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              {t('line.promotion.features.reports')}
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              {t('line.promotion.features.analysis')}
            </span>
          </div>
          
          {/* 按钮组 */}
          <div className="flex space-x-3">
            <button
              onClick={handleClick}
              className="bg-white text-green-600 px-6 py-3 rounded-full font-bold text-sm hover:bg-green-50 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('line.promotion.button')}</span>
            </button>
            
            <button
              onClick={handleClick}
              className="bg-transparent border-2 border-white text-white px-4 py-3 rounded-full font-medium text-sm hover:bg-white hover:text-green-600 transition-all duration-300 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>詳細を見る</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinePromotion;