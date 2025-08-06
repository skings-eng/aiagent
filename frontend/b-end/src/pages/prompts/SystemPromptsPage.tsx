import React, { useState, useEffect } from 'react';
import { FileText, Save, Eye, EyeOff, AlertCircle, CheckCircle, History } from 'lucide-react';

interface SystemPrompt {
  _id?: string;
  content: string;
  rawContent: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

const SystemPromptsPage: React.FC = () => {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/prompts/system', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        // 后端返回格式: { success: true, data: systemPrompt }
        // 需要将单个 prompt 转换为数组格式
        if (result.success && result.data) {
          const promptData = {
            _id: result.data.id,
            content: result.data.content,
            rawContent: result.data.content, // 使用 content 作为 rawContent
            version: 1,
            isActive: true,
            createdAt: result.data.lastUpdated || new Date().toISOString()
          };
          setPrompts([promptData]);
          setCurrentPrompt(promptData.content);
        } else {
          setPrompts([]);
        }
      } else {
        // 请求失败时设置为空数组
        setPrompts([]);
        console.error('加载提示词失败: HTTP', response.status);
      }
    } catch (error) {
      console.error('加载提示词失败:', error);
      // 发生异常时也设置为空数组
      setPrompts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!currentPrompt.trim()) {
      setSaveResult({
        status: 'error',
        message: '提示词内容不能为空'
      });
      return;
    }

    setIsSaving(true);
    setSaveResult({ status: null, message: '' });

    try {
      const response = await fetch('/api/v1/prompts/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentPrompt // 发送普通文本，不需要 Base64 编码
        }),
      });

      if (response.ok) {
        setSaveResult({
          status: 'success',
          message: '系统提示词保存成功！'
        });
        loadPrompts(); // Reload to get updated list
      } else {
        const data = await response.json();
        setSaveResult({
          status: 'error',
          message: data.error || '保存失败'
        });
      }
    } catch (error) {
      setSaveResult({
        status: 'error',
        message: '保存失败，请重试'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadHistoryPrompt = (prompt: SystemPrompt) => {
    setCurrentPrompt(prompt.rawContent || prompt.content);
    setSaveResult({ status: null, message: '' });
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering for preview
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">系统提示词管理</h1>
                    <p className="text-gray-600">编辑和管理 AI 系统提示词（支持 Markdown 格式）</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isPreview 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{isPreview ? '编辑' : '预览'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isPreview ? (
                <div className="min-h-96 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(currentPrompt) }}
                  />
                </div>
              ) : (
                <textarea
                  value={currentPrompt}
                  onChange={(e) => {
                    setCurrentPrompt(e.target.value);
                    setSaveResult({ status: null, message: '' });
                  }}
                  placeholder="请输入系统提示词内容，支持 Markdown 格式...\n\n例如：\n# 系统角色\n你是一个专业的日本股票分析师...\n\n## 分析要求\n- 提供准确的市场分析\n- 使用专业术语\n- **重点关注**风险提示"
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                />
              )}

              {/* Save Result */}
              {saveResult.status && (
                <div className={`mt-4 p-4 rounded-lg flex items-center space-x-3 ${
                  saveResult.status === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {saveResult.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    saveResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {saveResult.message}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={savePrompt}
                  disabled={isSaving || !currentPrompt.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? '保存中...' : '保存提示词'}</span>
                </button>
              </div>

              {/* Format Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">格式保护说明</p>
                    <p>系统将使用 Base64 编码存储提示词，确保 Markdown 格式（包括换行符、缩进等）完整保存，传输给 Gemini API 时不会发生格式损坏。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">历史版本</h2>
              </div>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">加载中...</p>
                </div>
              ) : prompts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无历史版本</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        prompt.isActive 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => loadHistoryPrompt(prompt)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          版本 {prompt.version}
                        </span>
                        {prompt.isActive && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            当前
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(prompt.createdAt).toLocaleString('zh-CN')}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {(prompt.rawContent || prompt.content).substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPromptsPage;