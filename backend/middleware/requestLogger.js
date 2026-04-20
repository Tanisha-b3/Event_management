// backend/middleware/requestLogger.js

export const requestLogger = (req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2); // ms
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime} ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime} ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  });
  next();
};

export const errorLogger = (err, req, res, next) => {
  console.error(`Error: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    stack: err.stack,
    ip: req.ip
  });
  next(err);
};