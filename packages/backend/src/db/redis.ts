import Redis from "ioredis";

const uri = process.env.REDIS_URI ?? "redis://localhost:6379";

export const redis = new Redis(uri);

redis.on("connect", () => console.log("Redis connected:", uri));
redis.on("error", (err) => console.error("Redis error:", err));
