import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入中文翻译模块
import zhCommon from './locales/zh/common.json';
import zhUI from './locales/zh/ui.json';
import zhBusiness from './locales/zh/business.json';
import zhStatus from './locales/zh/status.json';

// 导入英文翻译模块
import enCommon from './locales/en/common.json';
import enUI from './locales/en/ui.json';
import enBusiness from './locales/en/business.json';
import enStatus from './locales/en/status.json';

// 导入日语翻译模块
import jaChat from './locales/ja/chat.json';

// 语言资源
const resources = {
  zh: {
    translation: {
      common: zhCommon,
      ui: zhUI,
      business: zhBusiness,
      status: zhStatus
    }
  },
  en: {
    translation: {
      common: enCommon,
      ui: enUI,
      business: enBusiness,
      status: enStatus
    }
  },
  ja: {
    translation: {
      ...jaChat
    }
  }
};

// 初始化 i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja', // 默认语言
    fallbackLng: 'zh', // 回退语言
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React 已经默认转义
    },
    
    // 命名空间配置
    defaultNS: 'translation',
    ns: ['translation'],
    
    // 检测配置
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;