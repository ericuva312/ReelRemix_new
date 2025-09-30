const { z } = require('zod');

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      req[source] = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
const schemas = {
  // User registration
  userRegistration: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
  }),

  // User login
  userLogin: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  // Password change
  passwordChange: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
  }),

  // Profile update
  profileUpdate: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
    email: z.string().email('Invalid email address').optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  }),

  // Video upload
  videoUpload: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    url: z.string().url('Invalid URL').optional(),
    projectId: z.string().optional()
  }).refine(data => data.url || data.file, {
    message: 'Either URL or file must be provided'
  }),

  // Project creation
  projectCreation: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional()
  }),

  // Project update
  projectUpdate: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    description: z.string().max(1000, 'Description too long').optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  }),

  // Pagination
  pagination: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).refine(n => n > 0, 'Page must be positive').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
    sort: z.enum(['createdAt', 'updatedAt', 'title', 'status']).optional(),
    order: z.enum(['asc', 'desc']).optional()
  }),

  // Search
  search: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query too long').optional(),
    status: z.enum(['draft', 'processing', 'completed', 'failed']).optional(),
    platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter']).optional()
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().min(1, 'ID is required')
  })
};

// Specific validation middlewares
const validateUserRegistration = validate(schemas.userRegistration);
const validateUserLogin = validate(schemas.userLogin);
const validatePasswordChange = validate(schemas.passwordChange);
const validateProfileUpdate = validate(schemas.profileUpdate);
const validateVideoUpload = validate(schemas.videoUpload);
const validateProjectCreation = validate(schemas.projectCreation);
const validateProjectUpdate = validate(schemas.projectUpdate);
const validatePagination = validate(schemas.pagination, 'query');
const validateSearch = validate(schemas.search, 'query');
const validateIdParam = validate(schemas.idParam, 'params');

module.exports = {
  validate,
  schemas,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validateVideoUpload,
  validateProjectCreation,
  validateProjectUpdate,
  validatePagination,
  validateSearch,
  validateIdParam
};
