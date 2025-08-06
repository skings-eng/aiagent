import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3, DollarSign, Activity, Shield } from 'lucide-react';

interface TechnicalData {
  trend_score: string;
  trend_reason: string;
  support_levels: number[];
  resistance_levels: number[];
  rsi: string;
  macd: string;
}

interface FundamentalData {
  pe: string;
  peg: string;
  roic: string;
  revenue_growth: string;
  fcf_trend: string;
  valuation: string;
}

interface SentimentData {
  institutional_holding: string;
  main_capital_flow: string;
}

interface RiskData {
  volatility: string;
  risk_events: string[];
}

interface ScoresData {
  trend: string;
  valuation: string;
  risk: string;
}

interface SummaryData {
  scores: ScoresData;
  suggestion: string;
}

interface DataSourceData {
  pe: string;
  rsi: string;
  valuation: string;
}

interface StockOptimizationData {
  name: string;
  name_ja: string;
  code: string;
  price: number;
  industry: string;
  technical: TechnicalData;
  fundamental: FundamentalData;
  sentiment: SentimentData;
  risk: RiskData;
  summary: SummaryData;
  data_source: DataSourceData;
}

interface StockOptimizationCardProps {
  data: StockOptimizationData;
}

const StockOptimizationCard: React.FC<StockOptimizationCardProps> = ({ data }) => {
  const getTrendColor = (score: string) => {
    const numScore = parseInt(score);
    if (numScore >= 4) return 'text-green-600 bg-green-50';
    if (numScore >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStarRating = (rating: string) => {
    return rating;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">{data.name_ja}</h2>
            <p className="text-blue-100 text-sm mb-2">{data.name}</p>
            <div className="flex items-center space-x-4">
              <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-medium">
                {data.code}
              </span>
              <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                {data.industry}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatPrice(data.price)}</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 技術分析セクション */}
        <div className="border-l-4 border-blue-500 pl-4">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">技術分析</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(data.technical.trend_score)}`}>
              スコア: {data.technical.trend_score}/5
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4">{data.technical.trend_reason}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">サポートレベル</span>
              </div>
              <div className="flex space-x-2">
                {data.technical.support_levels.map((level, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    ¥{level.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-red-600" />
                <span className="font-medium text-sm">レジスタンスレベル</span>
              </div>
              <div className="flex space-x-2">
                {data.technical.resistance_levels.map((level, index) => (
                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    ¥{level.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="font-medium text-sm text-blue-800">RSI: </span>
              <span className="text-blue-600">{data.technical.rsi}</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="font-medium text-sm text-blue-800">MACD: </span>
              <span className="text-blue-600 text-xs">{data.technical.macd}</span>
            </div>
          </div>
        </div>

        {/* ファンダメンタル分析セクション */}
        <div className="border-l-4 border-green-500 pl-4">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">ファンダメンタル分析</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xs text-green-600 mb-1">PER</div>
              <div className="font-bold text-green-800">{data.fundamental.pe}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xs text-green-600 mb-1">PEG</div>
              <div className="font-bold text-green-800">{data.fundamental.peg}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xs text-green-600 mb-1">ROIC</div>
              <div className="font-bold text-green-800">{data.fundamental.roic}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xs text-green-600 mb-1">売上成長率</div>
              <div className="font-bold text-green-800">{data.fundamental.revenue_growth}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xs text-green-600 mb-1">FCFトレンド</div>
              <div className="font-bold text-green-800 text-xs">{data.fundamental.fcf_trend}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xs text-green-600 mb-1">バリュエーション</div>
              <div className="font-bold text-green-800 text-xs">{data.fundamental.valuation}</div>
            </div>
          </div>
        </div>

        {/* センチメント分析セクション */}
        <div className="border-l-4 border-purple-500 pl-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">センチメント分析</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">機関投資家保有率</div>
              <div className="font-bold text-purple-800">{data.sentiment.institutional_holding}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">主力資金フロー</div>
              <div className="font-bold text-purple-800">{data.sentiment.main_capital_flow}</div>
            </div>
          </div>
        </div>

        {/* リスク評価セクション */}
        <div className="border-l-4 border-orange-500 pl-4">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">リスク評価</h3>
          </div>
          
          <div className="mb-3">
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs text-orange-600 mb-1">ボラティリティ</div>
              <div className="font-bold text-orange-800">{data.risk.volatility}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">リスクイベント:</div>
            {data.risk.risk_events.map((event, index) => (
              <div key={index} className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">{event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 総合評価セクション */}
        <div className="border-l-4 border-indigo-500 pl-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">総合評価</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <div className="text-xs text-indigo-600 mb-1">トレンド</div>
              <div className="font-bold text-indigo-800">{getStarRating(data.summary.scores.trend)}</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <div className="text-xs text-indigo-600 mb-1">バリュエーション</div>
              <div className="font-bold text-indigo-800">{getStarRating(data.summary.scores.valuation)}</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <div className="text-xs text-indigo-600 mb-1">リスク</div>
              <div className="font-bold text-indigo-800">{getStarRating(data.summary.scores.risk)}</div>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-indigo-800 mb-2">投資提案:</div>
            <p className="text-sm text-indigo-700 leading-relaxed">{data.summary.suggestion}</p>
          </div>
        </div>

        {/* データソース */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-2">データソース:</div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
              PER: {data.data_source.pe}
            </span>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
              RSI: {data.data_source.rsi}
            </span>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
              バリュエーション: {data.data_source.valuation}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockOptimizationCard;