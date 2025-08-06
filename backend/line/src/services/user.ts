import { Client, Profile } from '@line/bot-sdk';
import { CacheService } from '../config/redis';
import { logger, logUserAction, logError } from '../utils/logger';
import {
  User,
  UserAnalytics
} from '../types';

// Define user profile interface
interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string | undefined;
  statusMessage?: string | undefined;
  language?: string | undefined;
}

// Define user settings interface
interface UserSettings {
  language: string;
  timezone: string;
  notifications: {
    enabled: boolean;
    types: string[];
  };
  privacy: {
    shareProfile: boolean;
    allowAnalytics: boolean;
  };
  preferences: {
    theme: string;
    messageFormat: string;
  };
}

// Define custom error classes
class LineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LineError';
  }
}

class UserNotFoundError extends LineError {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

class ValidationError extends LineError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ConflictError extends LineError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  private client: Client;
  private cache: CacheService;
  private readonly USER_CACHE_TTL = 24 * 60 * 60; // 24 hours
  private readonly PROFILE_CACHE_TTL = 6 * 60 * 60; // 6 hours

  constructor(client: Client, cache: CacheService) {
    this.client = client;
    this.cache = cache;
  }

  /**
   * Get user profile from LINE API
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Try to get from cache first
      const cacheKey = CacheService.generateKey('user_profile', userId);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get profile from LINE API
      const profile: Profile = await this.client.getProfile(userId);
      
      const userProfile: UserProfile = {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
        language: profile.language
      };

      // Cache the profile
      await this.cache.set(cacheKey, JSON.stringify(userProfile), this.PROFILE_CACHE_TTL);

      logUserAction('Profile retrieved', userId, { displayName: profile.displayName });

      return userProfile;
    } catch (error) {
      logError('Failed to get user profile', error as Error, { userId });
      
      if ((error as any).statusCode === 404) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }
      
      throw new LineError(`Failed to get user profile: ${(error as Error).message}`);
    }
  }

  /**
   * Create or update user record
   */
  async createOrUpdateUser(userId: string, profile?: UserProfile): Promise<User> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get existing user or create new one
      let user = await this.getUser(userId);
      
      if (!user) {
        // Create new user
        const userProfile = profile || await this.getUserProfile(userId);
        user = {
          id: uuidv4(),
          userId,
          displayName: userProfile.displayName,
          profile: userProfile,
          settings: this.getDefaultUserSettings(),
          isActive: true,
          isBlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActiveAt: new Date(),
          metadata: {}
        };
        
        logUserAction('User created', userId, { displayName: user!.profile?.displayName });
      } else {
        // Update existing user
        if (profile) {
          user.profile = { ...user.profile, ...profile };
        }
        user.updatedAt = new Date();
        user.lastActiveAt = new Date();
        
        logUserAction('User updated', userId, { displayName: user.profile?.displayName });
      }

      // Save user to cache
      await this.saveUser(user!);

      return user!;
    } catch (error) {
      logError('Failed to create or update user', error as Error, { userId });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new LineError(`Failed to create or update user: ${(error as Error).message}`);
    }
  }

  /**
   * Get user by user ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const cacheKey = CacheService.generateKey('user', userId);
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logError('Failed to get user', error as Error, { userId });
      return null;
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<User> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.getUser(userId);
      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      // Update settings
      if (!user.settings) {
        user.settings = this.getDefaultUserSettings();
      }
      
      // Handle notifications field properly
      const updatedSettings = { ...user.settings };
      if (settings.notifications !== undefined) {
        if (typeof settings.notifications === 'boolean') {
          updatedSettings.notifications = settings.notifications;
        }
      }
      if (settings.language !== undefined) {
        updatedSettings.language = settings.language;
      }
      if (settings.timezone !== undefined) {
        updatedSettings.timezone = settings.timezone;
      }
      
      user.settings = updatedSettings;
      user.updatedAt = new Date();

      // Save updated user
      await this.saveUser(user);

      logUserAction('Settings updated', userId, { settings });

      return user;
    } catch (error) {
      logError('Failed to update user settings', error as Error, { userId, settings });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new LineError(`Failed to update user settings: ${(error as Error).message}`);
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string, reason?: string): Promise<User> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.getUser(userId);
      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      if (user.isBlocked) {
        throw new ConflictError('User is already blocked');
      }

      // Block user
      user.isBlocked = true;
      user.isActive = false;
      user.updatedAt = new Date();
      
      if (reason) {
        if (!user.metadata) user.metadata = {};
        user.metadata.blockReason = reason;
        user.metadata.blockedAt = new Date().toISOString();
      }

      // Save updated user
      await this.saveUser(user);

      logUserAction('User blocked', userId, { reason });

      return user;
    } catch (error) {
      logError('Failed to block user', error as Error, { userId, reason });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new LineError(`Failed to block user: ${(error as Error).message}`);
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<User> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.getUser(userId);
      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      if (!user.isBlocked) {
        throw new ConflictError('User is not blocked');
      }

      // Unblock user
      user.isBlocked = false;
      user.isActive = true;
      user.updatedAt = new Date();
      
      // Remove block metadata
      if (!user.metadata) user.metadata = {};
      delete user.metadata.blockReason;
      delete user.metadata.blockedAt;
      user.metadata.unblockedAt = new Date().toISOString();

      // Save updated user
      await this.saveUser(user);

      logUserAction('User unblocked', userId);

      return user;
    } catch (error) {
      logError('Failed to unblock user', error as Error, { userId });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new LineError(`Failed to unblock user: ${(error as Error).message}`);
    }
  }

  /**
   * Update user activity
   */
  async updateUserActivity(userId: string): Promise<void> {
    try {
      if (!userId) {
        return;
      }

      const user = await this.getUser(userId);
      if (user) {
        user.lastActiveAt = new Date();
        user.isActive = true;
        await this.saveUser(user);
      }
    } catch (error) {
      logError('Failed to update user activity', error as Error, { userId });
      // Don't throw error for activity updates
    }
  }

  /**
   * Get user list with pagination
   */
  async getUserList(limit: number = 50, offset: number = 0, filters?: {
    isActive?: boolean;
    isBlocked?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<{ users: User[]; total: number }> {
    try {
      // Get all user IDs
      const userIds = await this.cache.keys(CacheService.generateKey('user', '*'));
      
      // Filter and paginate
      const filteredUsers: User[] = [];
      
      for (const userKey of userIds) {
        const userData = await this.cache.get(userKey);
        if (userData) {
          const user: User = JSON.parse(userData);
          
          // Apply filters
          if (filters) {
            if (filters.isActive !== undefined && user.isActive !== filters.isActive) continue;
            if (filters.isBlocked !== undefined && user.isBlocked !== filters.isBlocked) continue;
            if (filters.createdAfter && new Date(user.createdAt) < new Date(filters.createdAfter)) continue;
            if (filters.createdBefore && new Date(user.createdAt) > new Date(filters.createdBefore)) continue;
          }
          
          filteredUsers.push(user);
        }
      }
      
      // Sort by creation date (newest first)
      filteredUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Paginate
      const paginatedUsers = filteredUsers.slice(offset, offset + limit);
      
      return {
        users: paginatedUsers,
        total: filteredUsers.length
      };
    } catch (error) {
      logError('Failed to get user list', error as Error, { limit, offset, filters });
      throw new LineError(`Failed to get user list: ${(error as Error).message}`);
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(startDate: Date, endDate: Date): Promise<UserAnalytics> {
    try {
      const cacheKey = CacheService.generateKey('user_analytics', startDate.toISOString(), endDate.toISOString());
      
      // Try to get from cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get all users
      const { users } = await this.getUserList(1000, 0);
      
      // Calculate analytics
      const analytics: UserAnalytics = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        blockedUsers: users.filter(u => u.isBlocked).length,
        newUsers: users.filter(u => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= startDate && createdAt <= endDate;
        }).length,
        usersByLanguage: {},
        topActiveUsers: []
      };

      // Calculate language distribution
      users.forEach(user => {
        const language = user.profile?.language || user.language || 'unknown';
        analytics.usersByLanguage[language] = (analytics.usersByLanguage[language] || 0) + 1;
      });

      // Get top active users (by last activity)
      analytics.topActiveUsers = users
        .filter(u => u.isActive && u.lastActiveAt)
        .sort((a, b) => new Date(b.lastActiveAt!).getTime() - new Date(a.lastActiveAt!).getTime())
        .slice(0, 10)
        .map(u => ({
          userId: u.userId,
          displayName: u.profile?.displayName || u.displayName,
          messageCount: 0 // TODO: Implement message count calculation
        }));

      // Cache the result
      await this.cache.set(cacheKey, JSON.stringify(analytics), 3600); // 1 hour

      return analytics;
    } catch (error) {
      logError('Failed to get user analytics', error as Error, { startDate, endDate });
      throw new LineError(`Failed to get user analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Search users
   */
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    try {
      if (!query || query.trim().length === 0) {
        throw new ValidationError('Search query is required');
      }

      const { users } = await this.getUserList(1000, 0); // Get more users for search
      
      const searchTerm = query.toLowerCase().trim();
      
      const matchedUsers = users.filter(user => {
        return (
          (user.profile?.displayName || user.displayName).toLowerCase().includes(searchTerm) ||
          user.userId.toLowerCase().includes(searchTerm) ||
          (user.profile?.statusMessage && user.profile.statusMessage.toLowerCase().includes(searchTerm))
        );
      });

      return matchedUsers.slice(0, limit);
    } catch (error) {
      logError('Failed to search users', error as Error, { query, limit });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new LineError(`Failed to search users: ${(error as Error).message}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.getUser(userId);
      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      // Delete user from cache
      const userKey = CacheService.generateKey('user', userId);
      await this.cache.del(userKey);

      // Delete user profile from cache
      const profileKey = CacheService.generateKey('user_profile', userId);
      await this.cache.del(profileKey);

      // Delete user messages
      const messagesKey = CacheService.generateKey('user_messages', userId);
      const messageIds = await this.cache.sMembers(messagesKey);
      
      for (const messageId of messageIds) {
        await this.cache.del(CacheService.generateKey('message', messageId));
      }
      
      await this.cache.del(messagesKey);

      logUserAction('User deleted', userId, { displayName: user.profile?.displayName || user.displayName });
    } catch (error) {
      logError('Failed to delete user', error as Error, { userId });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new LineError(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  /**
   * Save user to cache
   */
  private async saveUser(user: User): Promise<void> {
    const cacheKey = CacheService.generateKey('user', user.userId);
    await this.cache.set(cacheKey, JSON.stringify(user), this.USER_CACHE_TTL);
  }

  /**
   * Get default user settings
   */
  private getDefaultUserSettings() {
    return {
      language: 'en',
      timezone: 'UTC',
      notifications: true
    };
  }
}

export default UserService;