import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'react-query';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import clsx from 'clsx';

interface GeminiConfig {
  apiKey: string;
  isConnected: boolean;
  lastTested?: string;
  model: string;
  provider: string;
}

const AIModels: React.FC = () => {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Get current Gemini configuration
  const { data: config, isLoading, refetch } = useQuery<GeminiConfig>(
    'geminiConfig',
    async () => {
      // Simulate API call to get current config
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        apiKey: '',
        isConnected: false,
        model: 'gemini-2.5-pro',
        provider: 'Google AI',
      };
    }
  );

  // Test connection mutation
  const testConnectionMutation = useMutation(
    async (key: string) => {
      // Simulate API call to test Gemini connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation - in real implementation, this would call Gemini API
      if (key.startsWith('AIza') && key.length > 30) {
        return { success: true, message: 'Connection successful' };
      } else {
        throw new Error('Invalid API key format');
      }
    },
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  // Save configuration mutation
  const saveConfigMutation = useMutation(
    async (data: { apiKey: string }) => {
      // Simulate API call to save config
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  const handleTestConnection = async () => {
    if (!apiKey.trim()) return;
    
    setIsTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync(apiKey);
    } catch (error) {
      // Error handling is done by the mutation
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) return;
    
    await saveConfigMutation.mutateAsync({ apiKey });
  };

  const getConnectionStatus = () => {
    if (config?.isConnected) {
      return {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        text: t('gemini.status.connected'),
        color: 'text-green-600 bg-green-100',
      };
    } else {
      return {
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        text: t('gemini.status.disconnected'),
        color: 'text-red-600 bg-red-100',
      };
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const connectionStatus = getConnectionStatus();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('gemini.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('gemini.description')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Connection Status */}
        <div className="flex items-center gap-3 mb-6">
          {connectionStatus.icon}
          <span className={clsx('px-3 py-1 rounded-full text-sm font-medium', connectionStatus.color)}>
            {connectionStatus.text}
          </span>
          {config?.lastTested && (
            <span className="text-sm text-gray-500">
              {t('gemini.lastTested')}: {new Date(config.lastTested).toLocaleString()}
            </span>
          )}
        </div>

        {/* Model Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">{t('gemini.model')}</div>
              <div className="text-sm text-gray-600">{config?.model}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">{t('gemini.provider')}</div>
              <div className="text-sm text-gray-600">{config?.provider}</div>
            </div>
          </div>
        </div>

        {/* API Key Configuration */}
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              <KeyIcon className="h-4 w-4 inline mr-2" />
              {t('gemini.apiKey')}
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('gemini.apiKeyPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTestConnection}
              disabled={!apiKey.trim() || isTestingConnection || testConnectionMutation.isLoading}
              className="btn btn-secondary flex items-center gap-2"
            >
              {(isTestingConnection || testConnectionMutation.isLoading) ? (
                <LoadingSpinner size="sm" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              {t('gemini.testConnection')}
            </button>
            
            <button
              onClick={handleSaveConfig}
              disabled={!apiKey.trim() || saveConfigMutation.isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              {saveConfigMutation.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <KeyIcon className="h-4 w-4" />
              )}
              {t('gemini.saveConfig')}
            </button>
          </div>

          {/* Error Messages */}
          {testConnectionMutation.error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  {(testConnectionMutation.error as Error).message}
                </span>
              </div>
            </div>
          ) : null}

          {/* Success Messages */}
          {testConnectionMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  {t('gemini.connectionSuccess')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIModels;