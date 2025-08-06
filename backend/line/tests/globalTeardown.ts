import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

export default async (): Promise<void> => {
  try {
    // Clean up Redis test database
    if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('mock')) {
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      await redis.flushDb();
      await redis.quit();
      console.log('Test Redis database cleaned');
    }

    // Clean up test files
    const testDirs = [
      path.join(__dirname, '../logs'),
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../backups')
    ];

    for (const dir of testDirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.startsWith('test-') || file.includes('.test.')) {
            await fs.unlink(path.join(dir, file));
          }
        }
      } catch (error) {
        // Directory might not exist, ignore
      }
    }

    console.log('Global test teardown completed');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
};