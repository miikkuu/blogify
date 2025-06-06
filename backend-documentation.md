# Blogify Backend Documentation

## Table of Contents
1. [Project Structure](#project-structure)
2. [Server Setup](#server-setup)
3. [Configuration](#configuration)
4. [Models](#models)
5. [Routes](#routes)
6. [Controllers](#controllers)
7. [Middleware](#middleware)
8. [Authentication](#authentication)
9. [File Uploads](#file-uploads)
10. [Error Handling](#error-handling)

## Project Structure
```
api/
├── config/           # Configuration files
│   ├── db.js        # Database connection
│   └── s3Config.js  # AWS S3 configuration
├── controllers/      # Route controllers
│   ├── authController.js
│   ├── commentController.js
│   └── postController.js
├── middlewares/      # Custom middleware
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── validationMiddleware.js
├── models/           # Database models
│   ├── Comment.js
│   ├── Post.js
│   └── User.js
├── routes/           # Route definitions
│   ├── authRoutes.js
│   ├── gAuthRoutes.js
│   └── postRoutes.js
├── validations/      # Request validations
│   ├── authValidation.js
│   └── postValidation.js
└── index.js          # Main server file
```

## Server Setup (index.js)

The main entry point of the application that sets up the Express server and connects all the pieces together.

### Key Components:
1. **Dependencies**
   - `express`: Web framework for Node.js
   - `cors`: Enables Cross-Origin Resource Sharing
   - `cookie-parser`: Parses cookies attached to client requests
   - `morgan`: HTTP request logger middleware
   - `dotenv`: Loads environment variables from .env file

2. **Database Connection**
   - Uses `connectDB()` function to establish connection to MongoDB
   - Connection string is stored in environment variables

3. **Middleware Setup**
   - `express.json()`: Parses incoming JSON requests
   - `cookieParser()`: Parses cookies from requests
   - `morgan('dev')`: Logs HTTP requests
   - CORS configuration for cross-origin requests

4. **Routes**
   - Authentication routes (`/api/auth`)
   - Post routes (`/api/posts`)
   - Google OAuth routes (conditionally loaded)

5. **Error Handling**
   - Custom error handling middleware
   - Catches and processes errors in a centralized way

## Configuration

### Database Configuration (config/db.js)
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### AWS S3 Configuration (config/s3Config.js)
```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

module.exports = s3;
```

## Models

### User Model (models/User.js)
Defines the schema for user data including:
- Basic info (name, email, password)
- Authentication tokens
- Timestamps
- Profile information

### Post Model (models/Post.js)
Defines the schema for blog posts including:
- Title, content, excerpt
- Author reference
- Categories and tags
- Comments and likes
- Featured image
- Read time

### Comment Model (models/Comment.js)
Defines the schema for comments including:
- Comment text
- Author reference
- Post reference
- Timestamps

## Routes

### Authentication Routes (routes/authRoutes.js)
- `POST /register`: Register a new user
- `POST /login`: User login
- `GET /logout`: Logout user
- `GET /me`: Get current user profile

### Post Routes (routes/postRoutes.js)
- `GET /`: Get all posts
- `POST /`: Create a new post
- `GET /:id`: Get a single post
- `PUT /:id`: Update a post
- `DELETE /:id`: Delete a post
- `POST /:id/comments`: Add a comment
- `POST /:id/like`: Like/unlike a post

### Google OAuth Routes (routes/gAuthRoutes.js)
- `GET /google`: Initiate Google OAuth
- `GET /google/callback`: Google OAuth callback

## Controllers

### Auth Controller (controllers/authController.js)
- `registerUser`: Handles user registration
- `loginUser`: Handles user login
- `logoutUser`: Handles user logout
- `getMe`: Gets current user profile

### Post Controller (controllers/postController.js)
- `getPosts`: Gets all posts with filtering and pagination
- `createPost`: Creates a new post
- `getPost`: Gets a single post by ID
- `updatePost`: Updates a post
- `deletePost`: Deletes a post
- `likePost`: Toggles like on a post
- `addComment`: Adds a comment to a post

### Comment Controller (controllers/commentController.js)
- `addComment`: Adds a new comment
- `deleteComment`: Deletes a comment

## Middleware

### Authentication Middleware (middleware/authMiddleware.js)
- `protect`: Verifies JWT token and protects routes
- `admin`: Restricts access to admin users

### Validation Middleware (middleware/validationMiddleware.js)
- Validates request data against defined schemas
- Returns appropriate error messages

### Error Middleware (middleware/errorMiddleware.js)
- Centralized error handling
- Formats error responses consistently
- Handles different types of errors (validation, JWT, etc.)

## Authentication

### JWT Authentication
- Uses JSON Web Tokens for stateless authentication
- Tokens are stored in HTTP-only cookies for security
- Refresh token mechanism for extended sessions

### Google OAuth
- Implements OAuth 2.0 with Google
- Handles the OAuth flow and user creation
- Issues JWT tokens after successful authentication

## File Uploads
- Uses AWS S3 for storing uploaded files
- Handles file validation and resizing
- Returns secure URLs for accessing uploaded files

## Error Handling
- Custom error classes for different error types
- Centralized error handling middleware
- Consistent error response format
- Development vs production error handling

# Detailed Code Explanations

## 1. Database Configuration (config/db.js)

```javascript
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Explanation:
- `mongoose.set('strictQuery', true)`: Enables strict mode for queries, which means only fields defined in the schema can be queried.
- `mongoose.connect()`: Establishes a connection to MongoDB using the connection string from environment variables.
- `useNewUrlParser`: Uses the new MongoDB connection string parser.
- `useUnifiedTopology`: Uses the new Server Discovery and Monitoring engine.

## 2. User Model (models/User.js)

```javascript
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, min: 4, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: false },
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;
```

### Explanation:
- Defines the structure of the User document in MongoDB.
- **username**: Must be unique, at least 4 characters long.
- **password**: Stores hashed password (handled in the controller).
- **email**: Optional field for user's email.

## 3. Post Model (models/Post.js)

```javascript
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const PostSchema = new Schema({
  title: String,
  summary: String,
  content: String,
  cover: String,
  like: { type: Number, default: 0 },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

const PostModel = model('Post', PostSchema);

module.exports = PostModel;
```

### Explanation:
- **title**: Blog post title
- **summary**: Short description of the post
- **content**: Full blog post content
- **cover**: URL to the post's cover image
- **like**: Like counter, defaults to 0
- **author**: References the User who created the post
- **timestamps**: Automatically adds `createdAt` and `updatedAt` fields

## 4. Authentication Controller (controllers/authController.js)

### Registration
```javascript
const register = async (req, res, next) => {
  // Validate request body
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).json(error.details);

  const { username, password } = req.body;
  try {
    // Hash password and create user
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    next(e);
  }
};
```

### Login
```javascript
const login = async (req, res, next) => {
  // Validate request
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json(error.details);

  const { username, password } = req.body;
  try {
    // Find user
    const userDoc = await User.findOne({ username });
    if (!userDoc) return res.status(400).json('User not found');

    // Verify password
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) return res.status(400).json('Wrong credentials');

    // Create JWT token
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) return next(err);
      // Set token in HTTP-only cookie
      res.cookie('token', token).json({
        id: userDoc._id,
        username,
      });
    });
  } catch (e) {
    next(e);
  }
};
```

## 5. Authentication Middleware (middleware/authMiddleware.js)

```javascript
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json('Not authenticated');

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(403).json('Token is not valid');
    req.userId = decoded.id;
    next();
  });
};

module.exports = auth;
```

### How It Works:
1. Extracts JWT token from cookies
2. Verifies the token using the secret key
3. If valid, attaches user ID to the request object
4. If invalid, returns an error response

## 6. Error Handling Middleware (middleware/errorMiddleware.js)

```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

module.exports = errorHandler;
```

## 7. Routes (routes/authRoutes.js)

```javascript
const express = require('express');
const router = express.Router();
const { register, login, profile, logout } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, profile);
router.post('/logout', logout);

module.exports = router;
```

### Route Protection:
- Public routes: `/register`, `/login`
- Protected routes (require authentication): `/profile`, `/logout`

## Environment Variables
```
PORT=4000
MONGO_URI=mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CORS_DOMAIN_URL=your_frontend_domain
```

## Running the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with required environment variables
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The API will be available at `http://localhost:4000`

## Deployment
1. Ensure all environment variables are set in production
2. Build the application:
   ```bash
   npm run build
   ```
3. Start the production server:
   ```bash
   npm start
   ```

## Best Practices
1. Always validate user input
2. Use environment variables for sensitive data
3. Implement proper error handling
4. Use middleware for common functionality
5. Follow RESTful API conventions
6. Implement proper security headers
7. Rate limiting for public APIs
8. Input sanitization to prevent XSS
9. Use HTTPS in production
10. Regular dependency updates

## Common Issues and Solutions
1. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check if MongoDB server is running
   - Ensure network connectivity

2. **Authentication Problems**
   - Verify JWT secret matches
   - Check token expiration
   - Ensure cookies are being sent with requests

3. **File Upload Failures**
   - Verify AWS credentials and permissions
   - Check S3 bucket policy
   - Ensure file size and type validation

## Additional Resources
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Guide](https://jwt.io/introduction/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## Conclusion
This documentation provides a comprehensive overview of the Blogify backend. The application follows modern Node.js best practices and includes features like authentication, file uploads, and database operations. The code is organized in a modular way for better maintainability and scalability.
