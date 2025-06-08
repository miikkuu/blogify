const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);// Log the error
  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

module.exports = errorMiddleware;
