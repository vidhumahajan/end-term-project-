export function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}
export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) return;
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
}
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
