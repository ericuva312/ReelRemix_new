// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    status: 500
  };

  // Validation errors (Zod)
  if (err.name === 'ZodError') {
    error = {
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400,
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      status: 401
    };
  }

  // Database errors
  if (err.code === 'P2002') { // Prisma unique constraint
    error = {
      success: false,
      message: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE',
      status: 409
    };
  }

  if (err.code === 'P2025') { // Prisma record not found
    error = {
      success: false,
      message: 'Resource not found',
      code: 'NOT_FOUND',
      status: 404
    };
  }

  // Custom application errors
  if (err.isCustomError) {
    error = {
      success: false,
      message: err.message,
      code: err.code || 'APPLICATION_ERROR',
      status: err.status || 400
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      message: 'File too large',
      code: 'FILE_TOO_LARGE',
      status: 413
    };
  }

  // Network/timeout errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    error = {
      success: false,
      message: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE',
      status: 503
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      success: false,
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429
    };
  }

  res.status(error.status).json(error);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    status: 404
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class
class AppError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.isCustomError = true;
    this.code = code;
    this.status = status;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};
