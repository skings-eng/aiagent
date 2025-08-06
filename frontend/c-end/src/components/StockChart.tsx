import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: string;
  pe?: number;
  high52w?: number;
  low52w?: number;
}

interface StockChartProps {
  data: StockData;
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const isPositive = data.change > 0;
  const isNegative = data.change < 0;
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{data.name}</h3>
          <p className="text-sm text-gray-600">{data.symbol}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.price)}
          </div>
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
          }`}>
            {isPositive && <TrendingUp className="w-4 h-4" />}
            {isNegative && <TrendingDown className="w-4 h-4" />}
            {!isPositive && !isNegative && <Minus className="w-4 h-4" />}
            <span>
              {data.change > 0 ? '+' : ''}{formatCurrency(data.change)} 
              ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.volume && (
          <div className="bg-white rounded p-3 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">出来高</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatNumber(data.volume)}
            </div>
          </div>
        )}
        
        {data.marketCap && (
          <div className="bg-white rounded p-3 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">時価総額</div>
            <div className="text-sm font-semibold text-gray-900">
              {data.marketCap}
            </div>
          </div>
        )}
        
        {data.pe && (
          <div className="bg-white rounded p-3 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">PER</div>
            <div className="text-sm font-semibold text-gray-900">
              {data.pe.toFixed(2)}
            </div>
          </div>
        )}
        
        {data.high52w && data.low52w && (
          <div className="bg-white rounded p-3 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">52週レンジ</div>
            <div className="text-xs text-gray-900">
              {formatCurrency(data.low52w)} - {formatCurrency(data.high52w)}
            </div>
          </div>
        )}
      </div>

      {/* Price Bar */}
      {data.high52w && data.low52w && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">52週レンジ内の位置</div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-gray-500'
                }`}
                style={{
                  width: `${Math.max(5, Math.min(95, ((data.price - data.low52w) / (data.high52w - data.low52w)) * 100))}%`
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatCurrency(data.low52w)}</span>
              <span>{formatCurrency(data.high52w)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockChart;