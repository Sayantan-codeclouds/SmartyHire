const errorHandler = (err, req, res, next) => {
  console.error('[API Error]', err.stack || err.message);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'An unexpected error occurred. Please try again.';

  // MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicateKey = Object.keys(err.keyValue || err.keyPattern || {})[0];
    if (duplicateKey === 'email') {
      message = 'An account with this email address already exists. Please sign in instead.';
    } else if (duplicateKey === 'slug' || duplicateKey === 'name') {
      message = 'A company workspace with this name already exists. Please choose a different company name.';
    } else if (duplicateKey === 'publicId') {
      message = 'Interview ID conflict. Please try saving again.';
    } else {
      message = 'A record with these details already exists. Please verify your inputs.';
    }
  }

  // CastError (Invalid ID)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'The requested item or workspace record could not be found.';
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join('. ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
