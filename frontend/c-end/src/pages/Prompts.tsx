import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'react-query';
import {
  DocumentTextIcon,
  EyeIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

interface SystemPrompt {
  id: string;
  content: string;
  lastUpdated: string;
  characterCount: number;
}

const Prompts: React.FC = () => {
  const { t } = useTranslation();
  const [promptContent, setPromptContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get current system prompt
  const { data: systemPrompt, isLoading, refetch } = useQuery<SystemPrompt>(
    'systemPrompt',
    async () => {
      // Simulate API call to get current system prompt
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: '1',
        content: '',
        lastUpdated: new Date().toISOString(),
        characterCount: 0,
      };
    }
  );

  // Save prompt mutation
  const savePromptMutation = useMutation<SystemPrompt, Error, string>(
    async (content: string) => {
      // Simulate API call to save system prompt
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: '1',
        content,
        lastUpdated: new Date().toISOString(),
        characterCount: content.length,
      };
    },
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  // Initialize prompt content when data loads
  useEffect(() => {
    if (systemPrompt && !promptContent) {
      setPromptContent(systemPrompt.content);
    }
  }, [systemPrompt, promptContent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePromptMutation.mutateAsync(promptContent);
    } catch (error) {
      // Error handling is done by the mutation
    } finally {
      setIsSaving(false);
    }
  };

  const characterCount = promptContent.length;

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('systemPrompt.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('systemPrompt.description')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Current Prompt Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">{t('systemPrompt.currentPrompt')}</div>
              {systemPrompt?.lastUpdated && (
                <div className="text-sm text-gray-500">
                  {t('systemPrompt.lastUpdated')}: {formatDate(systemPrompt.lastUpdated)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {t('systemPrompt.characterCount')}: {characterCount}
            </div>
            <button
              onClick={handlePreview}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <EyeIcon className="h-4 w-4" />
              {showPreview ? t('systemPrompt.hidePreview') : t('systemPrompt.preview')}
            </button>
          </div>
        </div>

        {/* Prompt Editor */}
        <div className="space-y-4">
          <div>
            <label htmlFor="promptContent" className="block text-sm font-medium text-gray-700 mb-2">
              {t('systemPrompt.content')}
            </label>
            <textarea
              id="promptContent"
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              placeholder={t('systemPrompt.placeholder')}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {t('systemPrompt.markdownSupport')}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || savePromptMutation.isLoading || !promptContent.trim()}
              className="btn btn-primary flex items-center gap-2"
            >
              {(isSaving || savePromptMutation.isLoading) ? (
                <LoadingSpinner size="sm" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              {t('systemPrompt.save')}
            </button>
          </div>

          {/* Success Message */}
          {savePromptMutation.isSuccess ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  {t('systemPrompt.saveSuccess')}
                </span>
              </div>
            </div>
          ) : null}

          {/* Error Message */}
          {savePromptMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  {(savePromptMutation.error as Error).message}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {showPreview && promptContent && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {t('systemPrompt.preview')}
            </h3>
            <div className="bg-gray-50 p-4 rounded-md border">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {promptContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prompts;