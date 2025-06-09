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

app.use(cors({ credentials: true, origin: [`${process.env.CORS_DOMAIN_URL}`, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'] }));

// Middlewares
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(express.json());//for parsing JSON request bodies
app.use(cookieParser());//for parsing cookies
app.use(morgan('dev'));//for logging HTTP requests.dev mode - for development only

app.use('/api/uploads', express.static(__dirname + '/uploads')); // optional: for experimenting with multer and local /multer-s3

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/posts', postRoutes);



// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
