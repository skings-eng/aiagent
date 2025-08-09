import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle, Star, EyeOff, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StockData {
  name: string;
  name_ja: string;
  code: string;
  price: number;
  industry: string;
  technical: {
    trend_score: string;
    trend_reason: string;
    support_levels: number[];
    resistance_levels: number[];
    rsi: string;
    macd: string;
  };
  fundamental: {
    pe: string;
    peg: string;
    roic: string;
    revenue_growth: string;
    fcf_trend: string;
    valuation: string;
  };
  sentiment: {
    institutional_holding: string;
    main_capital_flow: string;
  };
  risk: {
    volatility: string;
    risk_events: string[];
  };
  summary: {
    scores: {
      trend: string;
      valuation: string;
      risk: string;
    };
    suggestion: string;
  };
  data_source: {
    pe: string;
    rsi: string;
    valuation: string;
  };
}

interface LineConfig {
  url: string;
  displayText: string;
  description: string;
}

interface StockAnalysisCardProps {
  stockData: StockData;
  lineConfig?: LineConfig;
}

const StockAnalysisCard: React.FC<StockAnalysisCardProps> = ({ stockData, lineConfig }) => {
  const { t } = useTranslation();
  
  // LINE跳转处理函数 - 参考LinePromotion组件的实现
  const handleLineClick = () => {
    // 使用传入的LINE配置URL，如果没有则使用默认值
    const url = lineConfig?.url || 'https://line.me/R/ti/p/@your-line-id';
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
  
  const getTrendIcon = (score: string) => {
    const starCount = (score.match(/★/g) || []).length;
    return starCount >= 4 ? (
      <TrendingUp className="w-5 h-5 text-green-500" />
    ) : starCount <= 2 ? (
      <TrendingDown className="w-5 h-5 text-red-500" />
    ) : (
      <BarChart3 className="w-5 h-5 text-yellow-500" />
    );
  };

  const getScoreColor = (score: string) => {
    const starCount = (score.match(/★/g) || []).length;
    if (starCount >= 4) return 'text-green-600';
    if (starCount <= 2) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto">
      {/* 股票基本信息 */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{stockData.name}</h2>
            <p className="text-lg text-gray-600">{stockData.name_ja}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {stockData.code}
              </span>
              <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {stockData.industry}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">
                ¥{stockData.price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 评分总览 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">趋势评分</span>
            {getTrendIcon(stockData.summary?.scores?.trend || '★★★')}
          </div>
          <div className={`text-lg font-bold ${getScoreColor(stockData.summary?.scores?.trend || '★★★')}`}>
            {stockData.summary?.scores?.trend || '★★★'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">估值评分</span>
            <Star className="w-5 h-5 text-blue-500" />
          </div>
          <div className={`text-lg font-bold ${getScoreColor(stockData.summary?.scores?.valuation || '★★★')}`}>
            {stockData.summary?.scores?.valuation || '★★★'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">风险评分</span>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className={`text-lg font-bold ${getScoreColor(stockData.summary?.scores?.risk || '★★★')}`}>
            {stockData.summary?.scores?.risk || '★★★'}
          </div>
        </div>
      </div>

      {/* 投资建议 */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">投资建议</h3>
        <p className="text-blue-800">{stockData.summary?.suggestion || '暂无建议'}</p>
      </div>

      {/* 企业内部情报 - 广告板块 */}
      <div 
        className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 mb-6 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
        onClick={handleLineClick}
      >
        <div 
          className="absolute top-0 right-0 w-16 h-16 bg-yellow-300 opacity-20 rounded-full transform translate-x-8 -translate-y-8 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleLineClick(); }}
        ></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 
              className="text-lg font-semibold text-yellow-900 flex items-center cursor-pointer"
              onClick={(e) => { e.stopPropagation(); handleLineClick(); }}
            >
              <EyeOff className="w-5 h-5 mr-2 text-yellow-700" />
              {t('line.insider.title')}
            </h3>
            <div 
              className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium cursor-pointer"
              onClick={(e) => { e.stopPropagation(); handleLineClick(); }}
            >
              {t('line.insider.exclusive')}
            </div>
          </div>
          
          {/* 模糊遮盖的内容 */}
          <div className="relative mb-4">
            <div className="bg-white bg-opacity-60 rounded p-3 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded animate-pulse" style={{filter: 'blur(3px)'}}></div>
                <div className="h-4 bg-gray-300 rounded animate-pulse w-4/5" style={{filter: 'blur(3px)'}}></div>
                <div className="h-4 bg-gray-300 rounded animate-pulse w-3/5" style={{filter: 'blur(3px)'}}></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 cursor-pointer hover:bg-green-700 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleLineClick(); }}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">LINE で詳細を見る</span>
              </div>
            </div>
          </div>
          
          {/* 引导文案 */}
          <div className="text-center">
            <p className="text-yellow-800 text-sm mb-2">
              <span className="font-medium">{t('line.insider.guide')}</span>
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-yellow-700">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>{t('line.insider.advisor')}</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 详细分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 技术分析 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            技术分析
          </h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">趋势评分</span>
                <span className="text-sm font-bold text-gray-900">{stockData.technical.trend_score}</span>
              </div>
              <p className="text-xs text-gray-700">{stockData.technical.trend_reason}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-xs font-medium text-gray-600">RSI</span>
                <div className="text-sm font-bold text-gray-900">{stockData.technical.rsi}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-xs font-medium text-gray-600">MACD</span>
                <div className="text-sm font-bold text-gray-900">{stockData.technical.macd}</div>
              </div>
            </div>
            {stockData.technical.support_levels.length > 0 && (
              <div className="bg-green-50 rounded p-2">
                <span className="text-xs font-medium text-green-700">支撑位</span>
                <div className="text-sm text-green-800">
                  {stockData.technical.support_levels.map(level => `¥${level.toLocaleString()}`).join(', ')}
                </div>
              </div>
            )}
            {stockData.technical.resistance_levels.length > 0 && (
              <div className="bg-red-50 rounded p-2">
                <span className="text-xs font-medium text-red-700">阻力位</span>
                <div className="text-sm text-red-800">
                  {stockData.technical.resistance_levels.map(level => `¥${level.toLocaleString()}`).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 基本面分析 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            基本面分析
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-xs font-medium text-gray-600">市盈率</span>
                <div className="text-sm font-bold text-gray-900">{stockData.fundamental.pe}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-xs font-medium text-gray-600">PEG比率</span>
                <div className="text-sm font-bold text-gray-900">{stockData.fundamental.peg}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-xs font-medium text-gray-600">投资回报率</span>
                <div className="text-sm font-bold text-gray-900">{stockData.fundamental.roic}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-xs font-medium text-gray-600">营收增长率</span>
                <div className="text-sm font-bold text-gray-900">{stockData.fundamental.revenue_growth}</div>
              </div>
            </div>
            <div className="bg-blue-50 rounded p-3">
              <span className="text-sm font-medium text-blue-700">估值区间</span>
              <div className="text-sm font-bold text-blue-900">{stockData.fundamental.valuation}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <span className="text-sm font-medium text-gray-600">现金流趋势</span>
              <div className="text-sm text-gray-900">{stockData.fundamental.fcf_trend}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 市场情绪与风险 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* 市场情绪 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">市场情绪</h3>
          <div className="space-y-2">
            <div className="bg-gray-50 rounded p-3">
              <span className="text-sm font-medium text-gray-600">机构持股比例</span>
              <div className="text-sm font-bold text-gray-900">{stockData.sentiment.institutional_holding}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <span className="text-sm font-medium text-gray-600">主力资金流向</span>
              <div className="text-sm font-bold text-gray-900">{stockData.sentiment.main_capital_flow}</div>
            </div>
          </div>
        </div>

        {/* 风险分析 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            风险分析
          </h3>
          <div className="space-y-2">
            <div className="bg-orange-50 rounded p-3">
              <span className="text-sm font-medium text-orange-700">波动率</span>
              <div className="text-sm font-bold text-orange-900">{stockData.risk.volatility}</div>
            </div>
            {stockData.risk.risk_events.length > 0 && (
              <div className="bg-red-50 rounded p-3">
                <span className="text-sm font-medium text-red-700">风险事件</span>
                <ul className="text-sm text-red-800 mt-1">
                  {stockData.risk.risk_events.map((event, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {event}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 数据来源 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-2">数据来源</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div>市盈率: {stockData.data_source.pe}</div>
          <div>RSI: {stockData.data_source.rsi}</div>
          <div>估值: {stockData.data_source.valuation}</div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalysisCard;