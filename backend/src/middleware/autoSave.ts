import { Request, Response, NextFunction } from 'express';

/**
 * 自动保存频率限制中间件
 * 防止过于频繁的自动保存请求
 */
export const autoSaveRateLimit = (maxRequests: number = 10, windowMs: number = 10000) => {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.ip}-${req.params.id}`;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key)!;
    const windowStart = now - windowMs;

    // 移除时间窗口之外的请求记录
    while (userRequests.length > 0 && userRequests[0] < windowStart) {
      userRequests.shift();
    }

    // 检查是否超过限制
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: '自动保存过于频繁，请稍后再试',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }

    // 记录本次请求
    userRequests.push(now);

    // 清理过期的记录（可选，防止内存泄漏）
    if (userRequests.length === 1) {
      setTimeout(() => {
        requests.delete(key);
      }, windowMs + 1000);
    }

    next();
  };
};