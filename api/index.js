require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const connectDB = require('./config/db'); // connectDB function
const app = express();
connectDB(); // Connect to MongoDB

app.use(cors({ credentials: true, origin: [`${process.env.CORS_DOMAIN_URL}` , 'http://localhost:5173'] }));

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api/uploads', express.static(__dirname + '/uploads')); // optional: for experimenting with multer and local /multer

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Check if Google Client ID is provided and valid
const hasValidGoogleClientId = process.env.GOOGLE_CLIENT_ID &&
                              process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
                              process.env.GOOGLE_CLIENT_ID.length > 10;

// Only register Google Auth routes if valid credentials are provided
if (hasValidGoogleClientId) {
  const gAuthRoutes = require('./routes/gAuthRoutes');
  app.use('/api/gauth', gAuthRoutes);
  console.log('Google OAuth routes registered');
} else {
  console.log('Google OAuth routes not registered: No valid Google Client ID provided');
}


// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
