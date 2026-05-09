import { redisClient } from "../../DB/index.js";

// ─── Key builders ────────────────────────────────────────────────────────────
export const baseRevokeTokenKey = ({ userId }) => `revokeToken::${userId}`;
export const revokeTokenKey     = ({ userId, jti }) => `${baseRevokeTokenKey({ userId })}::${jti}`;
export const otpKey             = ({ email })  => `otp::User::${email}`;
export const otpMaxRequestKey   = ({ email })  => `otp::User::${email}::Request`;
export const otpBlockKey        = ({ email })  => `otp::User::${email}::Block::Request`;
export const forgotPasswordLinkKey = ({ userId } = {}) => `ForgotPasswordLink::User::${userId}`;

// ─── CRUD wrappers ───────────────────────────────────────────────────────────
export const set = async ({ key, value, ttl, parse = false } = {}) => {
  try {
    if (parse) value = JSON.stringify(value);
    if (ttl)   return await redisClient.set(key, value, { EX: ttl });
    await redisClient.set(key, value);
  } catch (err) {
    console.log("Fail to redis set:", err.message);
  }
};

export const get = async ({ key, parse = false } = {}) => {
  try {
    if (!key) throw new Error("Redis key is required");
    const data = await redisClient.get(key);
    return parse && data ? JSON.parse(data) : data;
  } catch (err) {
    console.log("Fail to redis get:", err.message);
  }
};

export const update = async (key, value, ttl = null) => {
  try {
    const exists = await redisClient.exists(key);
    if (!exists) return false;
    return await redisClient.set(key, value, ttl ? { EX: ttl } : undefined);
  } catch (err) {
    console.error("Redis UPDATE error:", err);
    return false;
  }
};

export const deleteKey = async (key) => {
  try {
    const keys = Array.isArray(key) ? key : [key];
    if (!keys.length) return true;
    const result = await redisClient.del(keys);
    return result >= 0;
  } catch (err) {
    console.error("Redis DELETE error:", err);
    return false;
  }
};

export const expire = async (key, ttl) => {
  try {
    return (await redisClient.expire(key, ttl)) === 1;
  } catch (err) {
    console.error("Redis EXPIRE error:", err);
    return false;
  }
};

export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (err) {
    console.error("Redis TTL error:", err);
    return -2;
  }
};

export const allKeysByPrefix = async (baseKey) => redisClient.keys(baseKey);

export const keys = async (prefix) => {
  try {
    return await redisClient.keys(`${prefix}*`);
  } catch (err) {
    console.log("Fail in redis keys:", err.message);
    return [];
  }
};

export const increment = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (err) {
    console.error("Redis INCR error:", err);
  }
};
