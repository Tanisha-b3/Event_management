import { createClient } from 'redis';

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      }
    });
    
    redisClient.on('error', () => {});
  }
  return redisClient;
};

export const connectRedis = async () => {
  try {
    const client = getRedisClient();
    if (!client.isOpen) {
      await client.connect();
    }
    return client;
  } catch {
    return null;
  }
};

export default getRedisClient;