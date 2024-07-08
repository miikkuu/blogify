require('dotenv').config({ path: '../.env' });
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
app.use('/api/uploads', express.static(__dirname + '/uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.delete('/api/comments/:commentId', require('./controllers/commentController').deleteComment);


// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
