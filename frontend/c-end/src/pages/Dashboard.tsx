import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import clsx from 'clsx';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  apiRequests: number;
  systemStatus: 'healthy' | 'warning' | 'error';
  userGrowth: number;
  sessionGrowth: number;
  apiGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_login' | 'api_request' | 'system_alert' | 'model_update';
  message: string;
  timestamp: string;
  user?: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  // Mock data - replace with actual API calls
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>(
    'dashboardStats',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        totalUsers: 1247,
        activeUsers: 89,
        totalSessions: 342,
        apiRequests: 15678,
        systemStatus: 'healthy' as const,
        userGrowth: 12.5,
        sessionGrowth: -3.2,
        apiGrowth: 8.7,
      };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: activities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>(
    'recentActivities',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        {
          id: '1',
          type: 'user_login',
          message: 'ユーザー "tanaka@example.com" がログインしました',
          timestamp: '2024-01-15T10:30:00Z',
          user: 'tanaka@example.com',
        },
        {
          id: '2',
          type: 'api_request',
          message: '株式分析APIが呼び出されました (NIKKEI:7203)',
          timestamp: '2024-01-15T10:25:00Z',
        },
        {
          id: '3',
          type: 'model_update',
          message: 'AIモデル "stock-analyzer-v2" が更新されました',
          timestamp: '2024-01-15T10:20:00Z',
        },
        {
          id: '4',
          type: 'system_alert',
          message: 'システムメンテナンスが完了しました',
          timestamp: '2024-01-15T10:15:00Z',
        },
      ];
    },
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const statCards = [
    {
      title: t('dashboard.total_users'),
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: UsersIcon,
      color: 'blue',
    },
    {
      title: t('dashboard.active_sessions'),
      value: stats?.totalSessions || 0,
      change: stats?.sessionGrowth || 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'green',
    },
    {
      title: t('dashboard.api_requests'),
      value: stats?.apiRequests || 0,
      change: stats?.apiGrowth || 0,
      icon: CpuChipIcon,
      color: 'purple',
    },
    {
      title: t('dashboard.system_status'),
      value: stats?.systemStatus === 'healthy' ? '正常' : stats?.systemStatus === 'warning' ? '警告' : 'エラー',
      change: 0,
      icon: ChartBarIcon,
      color: stats?.systemStatus === 'healthy' ? 'green' : stats?.systemStatus === 'warning' ? 'yellow' : 'red',
    },
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_login':
        return '👤';
      case 'api_request':
        return '🔄';
      case 'model_update':
        return '🤖';
      case 'system_alert':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.title')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('dashboard.welcome')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.change > 0;
          const isNegative = card.change < 0;
          
          return (
            <div key={index} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={clsx(
                    'flex-shrink-0 p-3 rounded-lg',
                    card.color === 'blue' && 'bg-blue-100',
                    card.color === 'green' && 'bg-green-100',
                    card.color === 'purple' && 'bg-purple-100',
                    card.color === 'yellow' && 'bg-yellow-100',
                    card.color === 'red' && 'bg-red-100'
                  )}>
                    <Icon className={clsx(
                      'h-6 w-6',
                      card.color === 'blue' && 'text-blue-600',
                      card.color === 'green' && 'text-green-600',
                      card.color === 'purple' && 'text-purple-600',
                      card.color === 'yellow' && 'text-yellow-600',
                      card.color === 'red' && 'text-red-600'
                    )} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">
                      {card.title}
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">
                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                      </p>
                      {card.change !== 0 && (
                        <div className={clsx(
                          'ml-2 flex items-center text-sm',
                          isPositive && 'text-green-600',
                          isNegative && 'text-red-600'
                        )}>
                          {isPositive ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )}
                          <span className="ml-1">
                            {Math.abs(card.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              {t('dashboard.recent_activities')}
            </h3>
          </div>
          <div className="card-body">
            {activitiesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              {t('dashboard.quick_actions')}
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <button className="w-full btn-primary text-left">
                新しいユーザーを追加
              </button>
              <button className="w-full btn-outline text-left">
                AIモデルを管理
              </button>
              <button className="w-full btn-outline text-left">
                システム設定
              </button>
              <button className="w-full btn-outline text-left">
                分析レポートを表示
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;