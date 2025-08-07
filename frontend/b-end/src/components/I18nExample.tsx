import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 国际化使用示例组件
 * 展示如何使用模块化的翻译资源
 */
const I18nExample: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">国际化示例</h1>
      
      {/* 语言切换按钮 */}
      <div className="mb-6">
        <button 
          onClick={() => changeLanguage('zh')}
          className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          中文
        </button>
        <button 
          onClick={() => changeLanguage('en')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          English
        </button>
      </div>

      {/* 通用词汇示例 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">通用词汇 (Common)</h2>
        <div className="grid grid-cols-3 gap-2">
          <button className="p-2 bg-gray-100 rounded">{t('common.save')}</button>
          <button className="p-2 bg-gray-100 rounded">{t('common.cancel')}</button>
          <button className="p-2 bg-gray-100 rounded">{t('common.confirm')}</button>
          <button className="p-2 bg-gray-100 rounded">{t('common.edit')}</button>
          <button className="p-2 bg-gray-100 rounded">{t('common.delete')}</button>
          <button className="p-2 bg-gray-100 rounded">{t('common.search')}</button>
        </div>
      </div>

      {/* UI组件示例 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">UI组件 (UI)</h2>
        <div className="space-y-2">
          <div>{t('ui.button')}: <button className="px-3 py-1 bg-blue-500 text-white rounded">{t('common.ok')}</button></div>
          <div>{t('ui.input')}: <input className="border rounded px-2 py-1" placeholder={t('common.search')} /></div>
          <div>{t('ui.modal')}: {t('ui.dialog')}</div>
        </div>
      </div>

      {/* 业务词汇示例 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">业务词汇 (Business)</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>{t('business.user')}</div>
          <div>{t('business.admin')}</div>
          <div>{t('business.project')}</div>
          <div>{t('business.task')}</div>
          <div>{t('business.dashboard')}</div>
          <div>{t('business.settings')}</div>
        </div>
      </div>

      {/* 状态示例 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">状态 (Status)</h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{t('status.active')}</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">{t('status.inactive')}</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{t('status.pending')}</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">{t('status.processing')}</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{t('status.completed')}</span>
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded">{t('status.failed')}</span>
        </div>
      </div>

      {/* 当前语言显示 */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <p>当前语言: {i18n.language}</p>
        <p>加载状态: {t('common.loading')}</p>
      </div>
    </div>
  );
};

export default I18nExample;