import { Request, Response, NextFunction } from 'express';


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

    
    while (userRequests.length > 0 && userRequests[0] < windowStart) {
      userRequests.shift();
    }

    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Automatic saving is too frequent, please try again later',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }

      
    userRequests.push(now);

    
    if (userRequests.length === 1) {
      setTimeout(() => {
        requests.delete(key);
      }, windowMs + 1000);
    }

    next();
  };
};