import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MessageCircle, TrendingUp, BarChart3, Activity, ArrowRight } from 'lucide-react';

interface MarketData {
  index: string;
  value: number;
  change: number;
  changePercent: number;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  // モックデータ - 実際のAPIから取得する
  const marketData: MarketData[] = [
    {
      index: '日経平均',
      value: 33500,
      change: 150,
      changePercent: 0.45,
    },
  ];

  const features = [
    {
      icon: MessageCircle,
      title: t('home.features.chat.title', { defaultValue: 'AI株式分析チャット' }),
      description: t('home.features.chat.description', { defaultValue: 'AIアシスタントと対話しながら株式分析を行います' }),
      link: '/chat',
      color: 'bg-blue-500',
    },
    {
      icon: TrendingUp,
      title: t('home.features.analysis.title', { defaultValue: 'リアルタイム分析' }),
      description: t('home.features.analysis.description', { defaultValue: '最新の市場データに基づく詳細分析' }),
      link: '/stock',
      color: 'bg-green-500',
    },
    {
      icon: BarChart3,
      title: t('home.features.charts.title', { defaultValue: 'チャート分析' }),
      description: t('home.features.charts.description', { defaultValue: '高度なテクニカル分析ツール' }),
      link: '/stock',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('app.title', { defaultValue: '日本株式AI分析' })}
                </h1>
                <p className="text-gray-600">
                  {t('app.subtitle', { defaultValue: 'インテリジェント投資分析プラットフォーム' })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/chat"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('home.startChat', { defaultValue: 'チャット開始' })}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 市場概況 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('home.marketOverview', { defaultValue: '市場概況' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LINE广告 */}
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-sm border border-gray-200 p-6 text-white relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  <span className="font-bold text-lg">LINE</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-100">広告</div>
                  <div className="text-xs text-green-200">Sponsored</div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">LINE証券で投資を始めよう</h3>
                <p className="text-sm text-green-100 mb-3">1株から投資可能！手数料無料で日本株取引</p>
                <button className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">
                  詳細を見る
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              </div>
            </div>
            
            {/* 其他市场数据 */}
            {marketData.slice(1).map((data, index) => (
              <div key={index + 1} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{data.index}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {data.value.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        data.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {data.change >= 0 ? '+' : ''}{data.change}
                    </div>
                    <div
                      className={`text-sm ${
                        data.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ({data.changePercent >= 0 ? '+' : ''}{data.changePercent}%)
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div
                    className={`h-1 rounded-full ${
                      data.change >= 0 ? 'bg-green-200' : 'bg-red-200'
                    }`}
                  >
                    <div
                      className={`h-1 rounded-full ${
                        data.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(Math.abs(data.changePercent) * 20, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 機能紹介 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('home.features.title', { defaultValue: '主な機能' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-3 ${feature.color} rounded-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                    <span className="text-sm font-medium">
                      {t('home.learnMore', { defaultValue: '詳しく見る' })}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {t('home.quickAction.title', { defaultValue: 'AI分析を今すぐ始める' })}
            </h2>
            <p className="text-blue-100 mb-6">
              {t('home.quickAction.description', { defaultValue: '銘柄名を入力するだけで、AIが詳細な分析を提供します' })}
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t('home.startAnalysis', { defaultValue: '分析を開始' })}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;