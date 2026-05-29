export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;
  const code = Number.isInteger(error.code) ? error.code : 50000;
  res.status(status).json({
    code,
    message: error.message || "系统异常",
    data: error.data || null,
  });
}
