import { connectRedis } from './redisClient.js';

const DEFAULT_TTL = 300;

const CACHE_TTL = {
  eventsList: 300,
  trendingEvents: 600,
  eventDetails: 180,
  userSession: 3600
};

const getCacheKey = (prefix, identifier) => {
  return `${prefix}:${identifier}`;
};

export const cacheGet = async (key) => {
  try {
    const client = await connectRedis();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data);
  } catch (err) {
    console.error(`Cache get error for key ${key}:`, { error: err.message });
    return null;
  }
};

export const cacheSet = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    const client = await connectRedis();
    if (!client) return false;

    await client.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error(`Cache set error for key ${key}:`, { error: err.message });
    return false;
  }
};

export const cacheDel = async (...keys) => {
  try {
    const client = await connectRedis();
    if (!client) return false;

    const allKeys = [];

    for (const key of keys) {
      if (key.includes('*')) {
        const matched = await client.keys(key);
        allKeys.push(...matched);
      } else if (key) {
        allKeys.push(key);
      }
    }

    if (allKeys.length > 0) {
      await client.del(allKeys);
    }
    return true;
  } catch (err) {
    console.error(`Cache delete error:`, { error: err.message });
    return false;
  }
};

export const cacheDelByPattern = async (pattern) => {
  try {
    const client = await connectRedis();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (err) {
    console.error(`Cache delete by pattern error:`, { error: err.message });
    return false;
  }
};

export const getOrSetCache = async (key, fetcher, ttl = DEFAULT_TTL) => {
  const cached = await cacheGet(key);
  if (cached) {
    console.log(`Cache hit: ${key}`);
    return cached;
  }

  console.log(`Cache miss: ${key}, fetching from DB`);
  const data = await fetcher();

  if (data) {
    await cacheSet(key, data, ttl);
  }

  return data;
};

export {
  CACHE_TTL,
  getCacheKey
};