import Redis, { RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

export const redisClient = new Redis(redisOptions);
