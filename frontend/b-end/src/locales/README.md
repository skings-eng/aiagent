# 国际化配置说明

## 文件结构

```
locales/
├── zh/                 # 中文翻译
│   ├── common.json     # 通用词汇
│   ├── ui.json         # UI组件相关
│   ├── business.json   # 业务相关
│   └── status.json     # 状态相关
├── en/                 # 英文翻译
│   ├── common.json     # 通用词汇
│   ├── ui.json         # UI组件相关
│   ├── business.json   # 业务相关
│   └── status.json     # 状态相关
└── README.md           # 说明文档
```

## 模块说明

### common.json - 通用词汇
包含最常用的操作词汇，如：
- 基础操作：保存、取消、确认、删除等
- 导航操作：返回、下一步、上一步等
- 编辑操作：复制、粘贴、撤销、重做等

### ui.json - UI组件
包含界面组件相关的词汇，如：
- 表单组件：按钮、输入框、选择器等
- 布局组件：导航栏、侧边栏、头部、底部等
- 交互组件：弹窗、提示框、通知等

### business.json - 业务词汇
包含业务相关的词汇，如：
- 用户管理：用户、管理员、角色、权限等
- 项目管理：项目、任务、订单等
- 系统功能：设置、配置、报告等

### status.json - 状态词汇
包含各种状态相关的词汇，如：
- 激活状态：激活、未激活、启用、禁用等
- 连接状态：在线、离线、已连接、已断开等
- 处理状态：待处理、处理中、已完成、失败等

## 使用方法

### 1. 基础使用

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <button>{t('common.save')}</button>
      <span>{t('status.active')}</span>
    </div>
  );
};
```

### 2. 语言切换

```tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <button onClick={() => changeLanguage('zh')}>中文</button>
      <button onClick={() => changeLanguage('en')}>English</button>
    </div>
  );
};
```

### 3. 翻译键的命名规范

- 使用模块前缀：`common.save`、`ui.button`、`business.user`、`status.active`
- 使用驼峰命名：`selectAll`、`changeLanguage`
- 保持简洁明了：避免过长的键名

## 添加新翻译

### 1. 确定模块
根据词汇的用途，选择合适的模块文件。

### 2. 添加翻译
在对应的中文和英文文件中添加相同的键值对。

### 3. 示例

在 `zh/common.json` 中添加：
```json
{
  "newKey": "新词汇"
}
```

在 `en/common.json` 中添加：
```json
{
  "newKey": "New Word"
}
```

### 4. 使用
```tsx
const text = t('common.newKey');
```

## 注意事项

1. **保持同步**：确保中英文文件中的键名完全一致
2. **模块化**：新增词汇时选择合适的模块，避免单个文件过大
3. **命名规范**：使用有意义的键名，便于维护
4. **测试**：添加新翻译后及时测试语言切换功能

## 扩展语言

如需添加其他语言（如日语、韩语等）：

1. 创建新的语言目录，如 `ja/`、`ko/`
2. 复制现有的JSON文件结构
3. 翻译所有键值对
4. 在 `i18n.ts` 中添加新语言的导入和配置

```typescript
// 导入新语言
import jaCommon from './locales/ja/common.json';
// ... 其他模块

// 添加到resources
const resources = {
  // ... 现有语言
  ja: {
    translation: {
      common: jaCommon,
      // ... 其他模块
    }
  }
};
```