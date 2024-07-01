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

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(__dirname + '/uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.delete('/comments/:commentId', require('./controllers/commentController').deleteComment);


// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
