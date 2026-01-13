// import Redis, { RedisOptions } from "ioredis";

// const redisOptions: RedisOptions = {
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: parseInt(process.env.REDIS_PORT || "6379"),
//   password: process.env.REDIS_PASSWORD,
//   retryStrategy: (times: number) => {
//     if (times < 5) return null;
//     return Math.min(times * 100, 3000);
//   },
//   connectTimeout: 10000,
//   keepAlive: 30000, // It means to send a keep-alive packet every 30 seconds, to maintain the connection active.
//   maxRetriesPerRequest: null,
// };

// export const redis = new Redis(redisOptions);

// // Redis কানেকশন ইভেন্ট হ্যান্ডেলিং
// redis.on("connect", () => {
//   console.log("✅ Redis connected");
// });

// redis.on("error", () => {
//   console.log("❌ Redis error");
// });
