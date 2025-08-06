import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger, PerformanceLogger } from '../utils/logger';
import { CacheService } from '../config/redis';
import { StockInfo, StockPrice, StockHistory, MarketStatus, TrendingStock } from '../types/stock';

export class StockDataService {
  private cache: CacheService;
  private readonly CACHE_TTL = {
    STOCK_INFO: 3600, // 1 hour
    STOCK_PRICE: 60, // 1 minute
    STOCK_HISTORY: 1800, // 30 minutes
    MARKET_STATUS: 300, // 5 minutes
    TRENDING: 600 // 10 minutes
  };

  constructor() {
    this.cache = new CacheService();
    
    // Configure yahoo-finance2 to avoid 403 errors
    yahooFinance.setGlobalConfig({
      queue: {
        concurrency: 1,
        timeout: 30000
      },
      validation: {
        logErrors: false,
        logOptionsErrors: false
      }
    });
  }

  /**
   * Search stocks by symbol or company name
   */
  async searchStocks(query: string, limit: number = 10): Promise<StockInfo[]> {
    const perf = new PerformanceLogger('searchStocks');
    const cacheKey = CacheService.generateKey('search', query, limit.toString());

    try {
      // Check cache first
      const cached = await this.cache.get<StockInfo[]>(cacheKey);
      if (cached) {
        perf.end({ source: 'cache', count: cached.length });
        return cached;
      }

      // Search using Yahoo Finance
      const searchResult = await yahooFinance.search(query, {
        quotesCount: limit,
        newsCount: 0
      });

      const stocks: StockInfo[] = searchResult.quotes.map(quote => ({
        symbol: quote.symbol || '',
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchange || '',
        currency: quote.currency || 'JPY',
        marketCap: quote.marketCap,
        sector: quote.sector,
        industry: quote.industry,
        country: quote.country || 'Japan',
        website: quote.website
      }));

      // Cache results
      await this.cache.set(cacheKey, stocks, this.CACHE_TTL.STOCK_INFO);
      
      perf.end({ source: 'api', count: stocks.length });
      return stocks;
    } catch (error) {
      logger.error('Error searching stocks:', error);
      perf.end({ error: true });
      throw new Error('Failed to search stocks');
    }
  }

  /**
   * Get detailed stock information
   */
  async getStockInfo(symbol: string): Promise<StockInfo> {
    const perf = new PerformanceLogger('getStockInfo');
    const cacheKey = CacheService.generateKey('info', symbol);

    try {
      // Check cache first
      const cached = await this.cache.get<StockInfo>(cacheKey);
      if (cached) {
        perf.end({ source: 'cache', symbol });
        return cached;
      }

      // Get stock info from Yahoo Finance
      const quote = await yahooFinance.quoteSummary(symbol, {
        modules: ['summaryDetail', 'assetProfile', 'price']
      });

      const stockInfo: StockInfo = {
        symbol: symbol,
        name: quote.price?.longName || quote.price?.shortName || symbol,
        exchange: quote.price?.exchangeName || '',
        currency: quote.price?.currency || 'JPY',
        marketCap: quote.summaryDetail?.marketCap,
        sector: quote.assetProfile?.sector,
        industry: quote.assetProfile?.industry,
        country: quote.assetProfile?.country || 'Japan',
        website: quote.assetProfile?.website,
        description: quote.assetProfile?.longBusinessSummary,
        employees: quote.assetProfile?.fullTimeEmployees,
        founded: quote.assetProfile?.foundingDate
      };

      // Cache results
      await this.cache.set(cacheKey, stockInfo, this.CACHE_TTL.STOCK_INFO);
      
      perf.end({ source: 'api', symbol });
      return stockInfo;
    } catch (error) {
      logger.error(`Error getting stock info for ${symbol}:`, error);
      perf.end({ error: true, symbol });
      throw new Error(`Failed to get stock info for ${symbol}`);
    }
  }

  /**
   * Get current stock price
   */
  async getStockPrice(symbol: string): Promise<StockPrice> {
    const perf = new PerformanceLogger('getStockPrice');
    const cacheKey = CacheService.generateKey('price', symbol);

    try {
      // Check cache first
      const cached = await this.cache.get<StockPrice>(cacheKey);
      if (cached) {
        perf.end({ source: 'cache', symbol });
        return cached;
      }

      // Get current price from Yahoo Finance
      const quote = await yahooFinance.quote(symbol);

      const stockPrice: StockPrice = {
        symbol: symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        previousClose: quote.regularMarketPreviousClose || 0,
        open: quote.regularMarketOpen || 0,
        high: quote.regularMarketDayHigh || 0,
        low: quote.regularMarketDayLow || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap,
        currency: quote.currency || 'JPY',
        timestamp: new Date()
      };

      // Cache results with shorter TTL for real-time data
      await this.cache.set(cacheKey, stockPrice, this.CACHE_TTL.STOCK_PRICE);
      
      perf.end({ source: 'api', symbol, price: stockPrice.price });
      return stockPrice;
    } catch (error) {
      logger.error(`Error getting stock price for ${symbol}:`, error);
      perf.end({ error: true, symbol });
      throw new Error(`Failed to get stock price for ${symbol}`);
    }
  }

  /**
   * Get historical stock data
   */
  async getStockHistory(
    symbol: string,
    period: string = '1mo',
    interval: string = '1d'
  ): Promise<StockHistory[]> {
    const perf = new PerformanceLogger('getStockHistory');
    const cacheKey = CacheService.generateKey('history', symbol, period, interval);

    try {
      // Check cache first
      const cached = await this.cache.get<StockHistory[]>(cacheKey);
      if (cached) {
        perf.end({ source: 'cache', symbol, period, count: cached.length });
        return cached;
      }

      // Get historical data from Yahoo Finance
      const history = await yahooFinance.historical(symbol, {
        period1: this.getPeriodStartDate(period),
        interval: interval as any
      });

      const stockHistory: StockHistory[] = history.map(item => ({
        date: item.date,
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        volume: item.volume || 0,
        adjClose: item.adjClose || item.close || 0
      }));

      // Cache results
      await this.cache.set(cacheKey, stockHistory, this.CACHE_TTL.STOCK_HISTORY);
      
      perf.end({ source: 'api', symbol, period, count: stockHistory.length });
      return stockHistory;
    } catch (error) {
      logger.error(`Error getting stock history for ${symbol}:`, error);
      perf.end({ error: true, symbol, period });
      throw new Error(`Failed to get stock history for ${symbol}`);
    }
  }

  /**
   * Get market status
   */
  async getMarketStatus(): Promise<MarketStatus> {
    const perf = new PerformanceLogger('getMarketStatus');
    const cacheKey = CacheService.generateKey('market', 'status');

    try {
      // Check cache first
      const cached = await this.cache.get<MarketStatus>(cacheKey);
      if (cached) {
        perf.end({ source: 'cache' });
        return cached;
      }

      // Get market status for major Japanese indices
      const nikkeiQuote = await yahooFinance.quote('^N225'); // Nikkei 225
      const topixQuote = await yahooFinance.quote('^TPX'); // TOPIX

      const marketStatus: MarketStatus = {
        isOpen: this.isMarketOpen(),
        timezone: 'Asia/Tokyo',
        nextOpen: this.getNextMarketOpen(),
        nextClose: this.getNextMarketClose(),
        indices: {
          nikkei: {
            symbol: '^N225',
            name: 'Nikkei 225',
            price: nikkeiQuote.regularMarketPrice || 0,
            change: nikkeiQuote.regularMarketChange || 0,
            changePercent: nikkeiQuote.regularMarketChangePercent || 0
          },
          topix: {
            symbol: '^TPX',
            name: 'TOPIX',
            price: topixQuote.regularMarketPrice || 0,
            change: topixQuote.regularMarketChange || 0,
            changePercent: topixQuote.regularMarketChangePercent || 0
          }
        },
        timestamp: new Date()
      };

      // Cache results
      await this.cache.set(cacheKey, marketStatus, this.CACHE_TTL.MARKET_STATUS);
      
      perf.end({ source: 'api', isOpen: marketStatus.isOpen });
      return marketStatus;
    } catch (error) {
      logger.error('Error getting market status:', error);
      perf.end({ error: true });
      throw new Error('Failed to get market status');
    }
  }

  /**
   * Get trending stocks
   */
  async getTrendingStocks(limit: number = 20): Promise<TrendingStock[]> {
    const perf = new PerformanceLogger('getTrendingStocks');
    const cacheKey = CacheService.generateKey('trending', limit.toString());

    try {
      // Check cache first
      const cached = await this.cache.get<TrendingStock[]>(cacheKey);
      if (cached) {
        perf.end({ source: 'cache', count: cached.length });
        return cached;
      }

      // Get trending stocks from Yahoo Finance
      const trending = await yahooFinance.trendingSymbols('JP', { count: limit });

      const trendingStocks: TrendingStock[] = await Promise.all(
        trending.quotes.slice(0, limit).map(async (quote) => {
          try {
            const price = await this.getStockPrice(quote.symbol);
            return {
              symbol: quote.symbol,
              name: quote.longname || quote.shortname || quote.symbol,
              price: price.price,
              change: price.change,
              changePercent: price.changePercent,
              volume: price.volume,
              rank: trending.quotes.indexOf(quote) + 1
            };
          } catch {
            return {
              symbol: quote.symbol,
              name: quote.longname || quote.shortname || quote.symbol,
              price: 0,
              change: 0,
              changePercent: 0,
              volume: 0,
              rank: trending.quotes.indexOf(quote) + 1
            };
          }
        })
      );

      // Cache results
      await this.cache.set(cacheKey, trendingStocks, this.CACHE_TTL.TRENDING);
      
      perf.end({ source: 'api', count: trendingStocks.length });
      return trendingStocks;
    } catch (error) {
      logger.error('Error getting trending stocks:', error);
      perf.end({ error: true });
      throw new Error('Failed to get trending stocks');
    }
  }

  // Helper methods
  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    const periodMap: { [key: string]: number } = {
      '1d': 1,
      '5d': 5,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '2y': 730,
      '5y': 1825,
      '10y': 3650
    };

    const days = periodMap[period] || 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private isMarketOpen(): boolean {
    const now = new Date();
    const jstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const hour = jstTime.getHours();
    const day = jstTime.getDay();

    // Tokyo Stock Exchange hours: 9:00-11:30, 12:30-15:00 (JST), Monday-Friday
    const isWeekday = day >= 1 && day <= 5;
    const isMorningSession = hour >= 9 && hour < 11 || (hour === 11 && jstTime.getMinutes() <= 30);
    const isAfternoonSession = hour >= 12 && hour < 15 || (hour === 12 && jstTime.getMinutes() >= 30);

    return isWeekday && (isMorningSession || isAfternoonSession);
  }

  private getNextMarketOpen(): Date {
    const now = new Date();
    const jstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    
    // Set to next 9:00 AM JST
    const nextOpen = new Date(jstTime);
    nextOpen.setHours(9, 0, 0, 0);
    
    // If it's past 9 AM today, move to next business day
    if (jstTime.getHours() >= 9) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    // Skip weekends
    while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    return nextOpen;
  }

  private getNextMarketClose(): Date {
    const now = new Date();
    const jstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    
    // Set to next 3:00 PM JST
    const nextClose = new Date(jstTime);
    nextClose.setHours(15, 0, 0, 0);
    
    // If it's past 3 PM today, move to next business day
    if (jstTime.getHours() >= 15) {
      nextClose.setDate(nextClose.getDate() + 1);
    }
    
    // Skip weekends
    while (nextClose.getDay() === 0 || nextClose.getDay() === 6) {
      nextClose.setDate(nextClose.getDate() + 1);
    }
    
    return nextClose;
  }
}