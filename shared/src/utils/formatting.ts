/**
 * 格式化数字为货币格式（日元）
 * @param amount 金额
 * @param locale 地区设置
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(amount: number, locale: string = 'ja-JP'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 格式化数字（添加千分位分隔符）
 * @param num 数字
 * @param locale 地区设置
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number, locale: string = 'ja-JP'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * 格式化百分比
 * @param value 数值（0-1之间）
 * @param decimals 小数位数
 * @param locale 地区设置
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(value: number, decimals: number = 2, locale: string = 'ja-JP'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 格式化股票价格变化
 * @param change 价格变化
 * @param changePercent 价格变化百分比
 * @param locale 地区设置
 * @returns 格式化后的变化字符串
 */
export function formatPriceChange(change: number, changePercent: number, locale: string = 'ja-JP'): string {
  const sign = change >= 0 ? '+' : '';
  const formattedChange = formatCurrency(Math.abs(change), locale);
  const formattedPercent = formatPercentage(Math.abs(changePercent) / 100, 2, locale);
  
  return `${sign}${formattedChange} (${sign}${formattedPercent})`;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 格式化持续时间
 * @param milliseconds 毫秒数
 * @param locale 地区设置
 * @returns 格式化后的持续时间字符串
 */
export function formatDuration(milliseconds: number, locale: string = 'ja-JP'): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return locale === 'ja-JP' ? `${days}日` : `${days}d`;
  } else if (hours > 0) {
    return locale === 'ja-JP' ? `${hours}時間` : `${hours}h`;
  } else if (minutes > 0) {
    return locale === 'ja-JP' ? `${minutes}分` : `${minutes}m`;
  } else {
    return locale === 'ja-JP' ? `${seconds}秒` : `${seconds}s`;
  }
}

/**
 * 格式化相对时间
 * @param date 日期
 * @param locale 地区设置
 * @returns 格式化后的相对时间字符串
 */
export function formatRelativeTime(date: Date | string, locale: string = 'ja-JP'): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now.getTime() - targetDate.getTime();
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return rtf.format(-diffDays, 'day');
  } else if (diffHours > 0) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffMinutes > 0) {
    return rtf.format(-diffMinutes, 'minute');
  } else {
    return rtf.format(-diffSeconds, 'second');
  }
}

/**
 * 截断文本并添加省略号
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀（默认为省略号）
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 格式化股票代码（添加市场前缀）
 * @param code 股票代码
 * @param market 市场
 * @returns 格式化后的股票代码
 */
export function formatStockCode(code: string, market?: string): string {
  if (!market) return code;
  
  const marketPrefixes: Record<string, string> = {
    'TSE': '',
    'JASDAQ': 'J',
    'Mothers': 'M',
    'TOKYO_PRO': 'P',
  };
  
  const prefix = marketPrefixes[market] || '';
  return prefix ? `${prefix}:${code}` : code;
}

/**
 * 格式化电话号码
 * @param phone 电话号码
 * @param format 格式类型
 * @returns 格式化后的电话号码
 */
export function formatPhoneNumber(phone: string, format: 'international' | 'national' = 'national'): string {
  // 移除所有非数字字符
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'international') {
    // 国际格式：+81-XX-XXXX-XXXX
    if (cleaned.startsWith('81')) {
      const number = cleaned.substring(2);
      return `+81-${number.substring(0, 2)}-${number.substring(2, 6)}-${number.substring(6)}`;
    }
  }
  
  // 国内格式：0XX-XXXX-XXXX
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  }
  
  return phone;
}

/**
 * 格式化URL（确保包含协议）
 * @param url URL
 * @returns 格式化后的URL
 */
export function formatUrl(url: string): string {
  if (!url) return '';
  
  // 如果没有协议，添加https://
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * 格式化JSON字符串（美化）
 * @param obj 对象
 * @param indent 缩进空格数
 * @returns 格式化后的JSON字符串
 */
export function formatJson(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch {
    return String(obj);
  }
}

/**
 * 格式化SQL查询（简单格式化）
 * @param sql SQL查询
 * @returns 格式化后的SQL
 */
export function formatSql(sql: string): string {
  return sql
    .replace(/\s+/g, ' ')
    .replace(/,/g, ',\n  ')
    .replace(/\bFROM\b/gi, '\nFROM')
    .replace(/\bWHERE\b/gi, '\nWHERE')
    .replace(/\bORDER BY\b/gi, '\nORDER BY')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
    .replace(/\bHAVING\b/gi, '\nHAVING')
    .replace(/\bLIMIT\b/gi, '\nLIMIT')
    .trim();
}

/**
 * 格式化错误消息
 * @param error 错误对象
 * @param includeStack 是否包含堆栈信息
 * @returns 格式化后的错误消息
 */
export function formatError(error: any, includeStack: boolean = false): string {
  if (error instanceof Error) {
    let message = `${error.name}: ${error.message}`;
    if (includeStack && error.stack) {
      message += `\n${error.stack}`;
    }
    return message;
  }
  
  return String(error);
}

/**
 * 格式化API响应时间
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 格式化后的响应时间字符串
 */
export function formatResponseTime(startTime: number, endTime: number = Date.now()): string {
  const duration = endTime - startTime;
  
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(2);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * 格式化内存使用量
 * @param bytes 字节数
 * @returns 格式化后的内存使用量字符串
 */
export function formatMemoryUsage(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 格式化版本号
 * @param version 版本号
 * @returns 格式化后的版本号
 */
export function formatVersion(version: string): string {
  // 确保版本号格式为 x.y.z
  const parts = version.split('.');
  while (parts.length < 3) {
    parts.push('0');
  }
  return parts.slice(0, 3).join('.');
}