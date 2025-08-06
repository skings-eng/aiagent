import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  ArrowUpIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import clsx from 'clsx';

interface AnalyticsData {
  userActivity: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
    sessions: number;
  }>;
  apiUsage: Array<{
    date: string;
    requests: number;
    errors: number;
    responseTime: number;
  }>;
  modelPerformance: Array<{
    model: string;
    accuracy: number;
    usage: number;
    satisfaction: number;
  }>;
  promptCategories: Array<{
    category: string;
    usage: number;
    effectiveness: number;
  }>;
  systemMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    systemUptime: number;
  };
}

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'api' | 'models' | 'prompts'>('users');

  // Mock data - replace with actual API calls
  const { data: analytics, isLoading } = useQuery<AnalyticsData>(
    ['analytics', timeRange],
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        userActivity: [
          { date: '2024-01-01', activeUsers: 120, newUsers: 15, sessions: 180 },
          { date: '2024-01-02', activeUsers: 135, newUsers: 22, sessions: 195 },
          { date: '2024-01-03', activeUsers: 142, newUsers: 18, sessions: 210 },
          { date: '2024-01-04', activeUsers: 158, newUsers: 25, sessions: 230 },
          { date: '2024-01-05', activeUsers: 165, newUsers: 20, sessions: 245 },
          { date: '2024-01-06', activeUsers: 172, newUsers: 28, sessions: 260 },
          { date: '2024-01-07', activeUsers: 180, newUsers: 32, sessions: 275 },
        ],
        apiUsage: [
          { date: '2024-01-01', requests: 1200, errors: 12, responseTime: 250 },
          { date: '2024-01-02', requests: 1350, errors: 8, responseTime: 230 },
          { date: '2024-01-03', requests: 1420, errors: 15, responseTime: 280 },
          { date: '2024-01-04', requests: 1580, errors: 10, responseTime: 220 },
          { date: '2024-01-05', requests: 1650, errors: 18, responseTime: 290 },
          { date: '2024-01-06', requests: 1720, errors: 6, responseTime: 210 },
          { date: '2024-01-07', requests: 1800, errors: 9, responseTime: 240 },
        ],
        modelPerformance: [
          { model: 'GPT-4', accuracy: 94.2, usage: 45, satisfaction: 4.8 },
          { model: 'Claude-3', accuracy: 92.8, usage: 35, satisfaction: 4.6 },
          { model: 'Gemini Pro', accuracy: 90.5, usage: 20, satisfaction: 4.4 },
        ],
        promptCategories: [
          { category: '株式分析', usage: 1247, effectiveness: 94.2 },
          { category: '市場サマリー', usage: 892, effectiveness: 89.7 },
          { category: 'リスク評価', usage: 634, effectiveness: 91.5 },
          { category: '一般', usage: 423, effectiveness: 87.3 },
        ],
        systemMetrics: {
          totalUsers: 1250,
          activeUsers: 180,
          totalRequests: 12500,
          averageResponseTime: 245,
          errorRate: 0.8,
          systemUptime: 99.9,
        },
      };
      
      return mockData;
    },
    {
      keepPreviousData: true,
    }
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return '過去7日';
      case '30d': return '過去30日';
      case '90d': return '過去90日';
      case '1y': return '過去1年';
      default: return range;
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const renderMetricChart = () => {
    if (!analytics) return null;

    switch (selectedMetric) {
      case 'users':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip labelFormatter={(value) => formatDate(value as string)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="アクティブユーザー"
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="新規ユーザー"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'api':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.apiUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip labelFormatter={(value) => formatDate(value as string)} />
              <Legend />
              <Bar yAxisId="left" dataKey="requests" fill="#3B82F6" name="リクエスト数" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="responseTime"
                stroke="#F59E0B"
                strokeWidth={2}
                name="応答時間 (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'models':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.modelPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#3B82F6" name="精度 (%)" />
              <Bar dataKey="usage" fill="#10B981" name="使用率 (%)" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'prompts':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.promptCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, usage }) => `${category}: ${usage}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="usage"
              >
                {analytics.promptCategories.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('analytics.title')}
          </h1>
          <p className="mt-2 text-gray-600">
            システムパフォーマンスと使用状況の分析
          </p>
        </div>
        
        <div className="flex space-x-4">
          <select
            className="form-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="7d">{getTimeRangeLabel('7d')}</option>
            <option value="30d">{getTimeRangeLabel('30d')}</option>
            <option value="90d">{getTimeRangeLabel('90d')}</option>
            <option value="1y">{getTimeRangeLabel('1y')}</option>
          </select>
          
          <button className="btn-outline">
            <DocumentChartBarIcon className="h-5 w-5 mr-2" />
            レポート出力
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.systemMetrics.totalUsers.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+12%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">アクティブユーザー</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.systemMetrics.activeUsers}
                    </p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+8%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API リクエスト</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.systemMetrics.totalRequests.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+15%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">システム稼働率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.systemMetrics.systemUptime}%
                    </p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+0.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">詳細分析</h2>
                <div className="flex space-x-2">
                  <button
                    className={clsx(
                      'px-3 py-2 text-sm font-medium rounded-md',
                      selectedMetric === 'users'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    onClick={() => setSelectedMetric('users')}
                  >
                    ユーザー活動
                  </button>
                  <button
                    className={clsx(
                      'px-3 py-2 text-sm font-medium rounded-md',
                      selectedMetric === 'api'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    onClick={() => setSelectedMetric('api')}
                  >
                    API 使用状況
                  </button>
                  <button
                    className={clsx(
                      'px-3 py-2 text-sm font-medium rounded-md',
                      selectedMetric === 'models'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    onClick={() => setSelectedMetric('models')}
                  >
                    モデル性能
                  </button>
                  <button
                    className={clsx(
                      'px-3 py-2 text-sm font-medium rounded-md',
                      selectedMetric === 'prompts'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    onClick={() => setSelectedMetric('prompts')}
                  >
                    プロンプト分析
                  </button>
                </div>
              </div>
              
              {renderMetricChart()}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Performance */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">モデル性能</h3>
                <div className="space-y-4">
                  {analytics?.modelPerformance.map((model) => (
                    <div key={model.model} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{model.model}</span>
                          <span className="text-sm text-gray-500">{model.accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${model.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">システム状態</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">平均応答時間</span>
                    <span className="text-sm font-medium text-gray-900">
                      {analytics?.systemMetrics.averageResponseTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">エラー率</span>
                    <span className="text-sm font-medium text-gray-900">
                      {analytics?.systemMetrics.errorRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">システム稼働率</span>
                    <span className="text-sm font-medium text-green-600">
                      {analytics?.systemMetrics.systemUptime}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;