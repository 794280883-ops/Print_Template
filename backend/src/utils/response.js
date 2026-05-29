export function success(data = null, message = "success") {
  return { code: 0, message, data };
}

export function appError(message, code = 50000, status = 500, data = null) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.data = data;
  return error;
}

export function sendSuccess(res, data = null, message = "success") {
  res.json(success(data, message));
}
