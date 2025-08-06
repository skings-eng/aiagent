import { REGEX_PATTERNS } from '../constants';

/**
 * 验证日本股票代码
 * @param code 股票代码
 * @returns 是否有效
 */
export function isValidJapaneseStockCode(code: string): boolean {
  return REGEX_PATTERNS.JAPANESE_STOCK_CODE.test(code);
}

/**
 * 验证邮箱地址
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email);
}

/**
 * 验证日本电话号码
 * @param phone 电话号码
 * @returns 是否有效
 */
export function isValidJapanesePhone(phone: string): boolean {
  return REGEX_PATTERNS.PHONE_JP.test(phone);
}

/**
 * 验证URL
 * @param url URL地址
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  return REGEX_PATTERNS.URL.test(url);
}

/**
 * 验证UUID
 * @param uuid UUID字符串
 * @returns 是否有效
 */
export function isValidUuid(uuid: string): boolean {
  return REGEX_PATTERNS.UUID.test(uuid);
}

/**
 * 验证是否包含日文
 * @param text 文本
 * @returns 是否包含日文
 */
export function containsJapanese(text: string): boolean {
  return REGEX_PATTERNS.JAPANESE_TEXT.test(text);
}

/**
 * 验证字符串长度
 * @param str 字符串
 * @param min 最小长度
 * @param max 最大长度
 * @returns 是否在范围内
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  const length = str.length;
  return length >= min && length <= max;
}

/**
 * 验证数字范围
 * @param num 数字
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在范围内
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * 验证数组长度
 * @param arr 数组
 * @param min 最小长度
 * @param max 最大长度
 * @returns 是否在范围内
 */
export function isValidArrayLength(arr: any[], min: number, max: number): boolean {
  return arr.length >= min && arr.length <= max;
}

/**
 * 验证对象是否为空
 * @param obj 对象
 * @returns 是否为空
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * 验证是否为有效的JSON字符串
 * @param str 字符串
 * @returns 是否为有效JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 强度等级 (0-4)
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;
  
  // 长度检查
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // 字符类型检查
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 4);
}

/**
 * 验证IP地址
 * @param ip IP地址
 * @returns 是否有效
 */
export function isValidIpAddress(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * 验证端口号
 * @param port 端口号
 * @returns 是否有效
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * 验证文件扩展名
 * @param filename 文件名
 * @param allowedExtensions 允许的扩展名数组
 * @returns 是否有效
 */
export function isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return extension ? allowedExtensions.includes(extension) : false;
}

/**
 * 验证MIME类型
 * @param mimeType MIME类型
 * @param allowedTypes 允许的MIME类型数组
 * @returns 是否有效
 */
export function isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * 验证文件大小
 * @param size 文件大小（字节）
 * @param maxSize 最大大小（字节）
 * @returns 是否有效
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * 验证日期字符串
 * @param dateStr 日期字符串
 * @param format 期望的格式（可选）
 * @returns 是否有效
 */
export function isValidDate(dateStr: string, _format?: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * 验证时间范围
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 是否有效（开始日期早于结束日期）
 */
export function isValidDateRange(startDate: string | Date, endDate: string | Date): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
}

/**
 * 验证颜色值（十六进制）
 * @param color 颜色值
 * @returns 是否有效
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * 验证经纬度坐标
 * @param lat 纬度
 * @param lng 经度
 * @returns 是否有效
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return isInRange(lat, -90, 90) && isInRange(lng, -180, 180);
}

/**
 * 清理和验证HTML内容
 * @param html HTML内容
 * @returns 清理后的HTML
 */
export function sanitizeHtml(html: string): string {
  // 简单的HTML清理，实际项目中应使用专门的库如DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * 验证SQL注入风险
 * @param input 用户输入
 * @returns 是否存在风险
 */
export function hasSqlInjectionRisk(input: string): boolean {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', ';', "'", '"'
  ];
  
  const upperInput = input.toUpperCase();
  return sqlKeywords.some(keyword => upperInput.includes(keyword));
}

/**
 * 验证XSS风险
 * @param input 用户输入
 * @returns 是否存在风险
 */
export function hasXssRisk(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}