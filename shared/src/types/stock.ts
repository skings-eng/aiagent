import { z } from 'zod';

// 股票基本信息
export const StockInfoSchema = z.object({
  code: z.string().min(4).max(6), // 日本股票代码通常是4位数字
  name: z.string(),
  nameEn: z.string().optional(),
  market: z.enum(['TSE', 'JASDAQ', 'Mothers', 'TOKYO_PRO']), // 日本主要交易所
  sector: z.string(),
  industry: z.string(),
  currency: z.string().default('JPY'),
});

// 股票价格数据
export const StockPriceSchema = z.object({
  code: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  previousClose: z.number(),
  marketCap: z.number().optional(),
  timestamp: z.string().datetime(),
});

// 股票历史数据
export const StockHistorySchema = z.object({
  code: z.string(),
  date: z.string().date(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  adjustedClose: z.number().optional(),
});

// 股票财务数据
export const StockFinancialSchema = z.object({
  code: z.string(),
  revenue: z.number().optional(),
  netIncome: z.number().optional(),
  eps: z.number().optional(), // 每股收益
  pe: z.number().optional(), // 市盈率
  pb: z.number().optional(), // 市净率
  roe: z.number().optional(), // 净资产收益率
  roa: z.number().optional(), // 总资产收益率
  debtToEquity: z.number().optional(), // 负债权益比
  currentRatio: z.number().optional(), // 流动比率
  quickRatio: z.number().optional(), // 速动比率
  fiscalYear: z.string(),
  quarter: z.number().min(1).max(4).optional(),
});

// 股票分析结果
export const StockAnalysisSchema = z.object({
  code: z.string(),
  analysisId: z.string(),
  summary: z.string(),
  recommendation: z.enum(['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL']),
  targetPrice: z.number().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  timeHorizon: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']),
  keyPoints: z.array(z.string()),
  risks: z.array(z.string()),
  opportunities: z.array(z.string()),
  technicalAnalysis: z.object({
    trend: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']),
    support: z.number().optional(),
    resistance: z.number().optional(),
    indicators: z.record(z.string(), z.any()).optional(),
  }).optional(),
  fundamentalAnalysis: z.object({
    valuation: z.enum(['UNDERVALUED', 'FAIRLY_VALUED', 'OVERVALUED']),
    growthProspects: z.enum(['STRONG', 'MODERATE', 'WEAK']),
    financialHealth: z.enum(['STRONG', 'MODERATE', 'WEAK']),
  }).optional(),
  createdAt: z.string().datetime(),
  language: z.enum(['ja', 'en']),
});

// 股票查询请求
export const StockQuerySchema = z.object({
  query: z.string().min(1),
  language: z.enum(['ja', 'en']).default('ja'),
  analysisType: z.enum(['QUICK', 'DETAILED', 'TECHNICAL', 'FUNDAMENTAL']).default('QUICK'),
  includeHistory: z.boolean().default(false),
  historyDays: z.number().min(1).max(365).default(30),
});

// 导出类型
export type StockInfo = z.infer<typeof StockInfoSchema>;
export type StockPrice = z.infer<typeof StockPriceSchema>;
export type StockHistory = z.infer<typeof StockHistorySchema>;
export type StockFinancial = z.infer<typeof StockFinancialSchema>;
export type StockAnalysis = z.infer<typeof StockAnalysisSchema>;
export type StockQuery = z.infer<typeof StockQuerySchema>;

// 股票搜索结果
export interface StockSearchResult {
  stocks: StockInfo[];
  total: number;
  page: number;
  limit: number;
}

// 股票完整数据
export interface StockFullData {
  info: StockInfo;
  price: StockPrice;
  history?: StockHistory[];
  financial?: StockFinancial;
  analysis?: StockAnalysis;
}