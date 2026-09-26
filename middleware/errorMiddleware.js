const errorHandler = (err, req, res, next) => {
  console.error('Express Error Handler:', err.stack || err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    errorCode: err.errorCode || 'SERVER_ERROR'
  });
};

module.exports = {
  errorHandler
};
