import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export default async (): Promise<void> => {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });
  
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
  
  try {
    // Configure logging for tests
    process.env.LOG_LEVEL = 'error'; // Minimize test output
    
    // Setup Redis for testing
    if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('mock')) {
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      
      // Flush test database to ensure clean state
      await redis.flushDb();
      await redis.quit();
      
      console.log('Test Redis database initialized');
    }
    
    // Create test directories if they don't exist
    const testDirs = [
      path.join(__dirname, '../logs'),
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../backups'),
      path.join(__dirname, '../coverage')
    ];
    
    for (const dir of testDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore
      }
    }
    
    console.log('Global test setup completed');
  } catch (error) {
    console.error('Error during global setup:', error);
    throw error;
  }
};