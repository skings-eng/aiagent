import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, BarChart3, Activity, RefreshCw, Target } from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  dividend: number;
  high52w: number;
  low52w: number;
}

interface ChartData {
  time: string;
  price: number;
}

const StockPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');

  // モックデータ
  const mockStocks: StockData[] = [
    {
      symbol: '7203',
      name: 'トヨタ自動車',
      price: 2850,
      change: 45,
      changePercent: 1.6,
      volume: 12500000,
      marketCap: 42000000000000,
      pe: 12.5,
      dividend: 2.8,
      high52w: 3200,
      low52w: 2400,
    },
    {
      symbol: '6758',
      name: 'ソニーグループ',
      price: 12800,
      change: -180,
      changePercent: -1.4,
      volume: 8900000,
      marketCap: 15800000000000,
      pe: 18.2,
      dividend: 1.2,
      high52w: 15000,
      low52w: 9800,
    },
    {
      symbol: '9984',
      name: 'ソフトバンクグループ',
      price: 5890,
      change: 120,
      changePercent: 2.1,
      volume: 15600000,
      marketCap: 12900000000000,
      pe: 8.9,
      dividend: 0.5,
      high52w: 7200,
      low52w: 4800,
    },
  ];

  // モックチャートデータ生成
  const generateMockChartData = (basePrice: number) => {
    const data: ChartData[] = [];
    let price = basePrice;
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      price += (Math.random() - 0.5) * 100;
      data.push({
        time: time.toISOString().split('T')[0],
        price: Math.round(price),
      });
    }
    return data;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // モック検索 - 実際のAPIに置き換える
    setTimeout(() => {
      const found = mockStocks.find(
        stock => 
          stock.symbol.includes(searchQuery) || 
          stock.name.includes(searchQuery)
      );
      
      if (found) {
        setSelectedStock(found);
        setChartData(generateMockChartData(found.price));
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(1)}兆`;
    } else if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}億`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {t('stock.title', { defaultValue: '株式分析' })}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {t('stock.subtitle', { defaultValue: '詳細な株式データと分析' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/stock/optimization')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Target className="w-4 h-4" />
                <span>{t('stock.optimization', { defaultValue: '最適化分析' })}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 検索バー */}
        <div className="mb-6">
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('stock.searchPlaceholder', { defaultValue: '銘柄コードまたは企業名を入力...' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{t('common.search', { defaultValue: '検索' })}</span>
            </button>
          </div>
        </div>

        {/* 人気銘柄 */}
        {!selectedStock && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('stock.popularStocks', { defaultValue: '人気銘柄' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => {
                    setSelectedStock(stock);
                    setChartData(generateMockChartData(stock.price));
                  }}
                  className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{stock.symbol}</h3>
                      <p className="text-sm text-gray-600">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ¥{stock.price.toLocaleString()}
                      </div>
                      <div
                        className={`text-sm flex items-center ${
                          stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 選択された銘柄の詳細 */}
        {selectedStock && (
          <div className="space-y-6">
            {/* 銘柄ヘッダー */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedStock.name} ({selectedStock.symbol})
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedStock(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('stock.currentPrice', { defaultValue: '現在価格' })}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ¥{selectedStock.price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('stock.change', { defaultValue: '変動' })}</p>
                  <p
                    className={`text-lg font-semibold ${
                      selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change} ({selectedStock.changePercent}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('stock.volume', { defaultValue: '出来高' })}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(selectedStock.volume)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('stock.marketCap', { defaultValue: '時価総額' })}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(selectedStock.marketCap)}
                  </p>
                </div>
              </div>
            </div>

            {/* チャート */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('stock.priceChart', { defaultValue: '価格チャート' })}
                </h3>
                <div className="flex space-x-2">
                  {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimeframe(period)}
                      className={`px-3 py-1 text-sm rounded ${
                        timeframe === period
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 簡単なチャート表示 */}
              <div className="h-64 flex items-end space-x-1">
                {chartData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{
                      height: `${((data.price - Math.min(...chartData.map(d => d.price))) / 
                        (Math.max(...chartData.map(d => d.price)) - Math.min(...chartData.map(d => d.price)))) * 200 + 20}px`
                    }}
                    title={`${data.time}: ¥${data.price}`}
                  ></div>
                ))}
              </div>
            </div>

            {/* 詳細データ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('stock.fundamentals', { defaultValue: 'ファンダメンタルズ' })}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">PER</span>
                    <span className="font-medium">{selectedStock.pe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stock.dividend', { defaultValue: '配当利回り' })}</span>
                    <span className="font-medium">{selectedStock.dividend}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stock.high52w', { defaultValue: '52週高値' })}</span>
                    <span className="font-medium">¥{selectedStock.high52w.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stock.low52w', { defaultValue: '52週安値' })}</span>
                    <span className="font-medium">¥{selectedStock.low52w.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('stock.analysis', { defaultValue: 'AI分析' })}
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        {t('stock.technicalAnalysis', { defaultValue: 'テクニカル分析' })}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">
                      {t('stock.technicalSummary', { defaultValue: '短期的には上昇トレンドを維持。RSIは中立圏内。' })}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">
                        {t('stock.recommendation', { defaultValue: '推奨' })}
                      </span>
                    </div>
                    <p className="text-sm text-green-800">
                      {t('stock.recommendationText', { defaultValue: '中期的な保有を推奨。業績の安定性が魅力。' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPage;