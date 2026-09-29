import { createClient } from "redis";
import { config } from "../config/config.js";

export const client = createClient({
    username: config.redis.username,
    password: config.redis.password,
    socket: {
        host: config.redis.host,
        port: Number(config.redis.port),
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error("Redis: max reconnection attempts reached");
                return false;
            }
            return Math.min(retries * 100, 3000);
        },
    },
});

client.on("error", (err) => console.error("Redis Client Error:", (err as Error)?.message));
client.on("connect", () => console.log("Redis: connecting..."));
client.on("ready", () => console.log("Redis: connected and ready"));
client.on("reconnecting", () => console.log("Redis: reconnecting..."));

// Non-blocking connect — app starts even if Redis is down
client.connect().catch((err) => {
    console.error("Redis: initial connection failed, will retry in background.", (err as Error)?.message);
});

export const isRedisConnected = () => client.isReady;
