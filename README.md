# Blogify

Blogify is a full-stack blog application with a React frontend and a Node.js backend. It features user authentication, post creation and management, and image uploads using AWS S3. The application is containerized using Docker , uses Nginx as reverse proxy and deployed on AWS EC2 with CI/CD integration.

## Features

- User registration and authentication using JWT
- Create, read, update, and delete blog posts
- Rich text editing for blog posts using React Quill
- Image upload functionality with AWS S3 integration
- Commenting system for blog posts
- Like/unlike functionality for posts
- Responsive design using Tailwind CSS

## Tech Stack:

### Frontend
- React
- React Router for navigation
- Tailwind CSS for styling and responsive design
- React Quill for rich text editing
- Vite as the build tool

### Backend
- Node.js
- Express.js
- MongoDB for database
- JWT for authentication for user sessions
- Google OAuthentication for social login
- AWS S3 for image storage

### DevOps
- Docker for containerization
- Nginx as a reverse proxy
- AWS EC2 for hosting
- GitHub Actions for CI/CD

## Project Structure

The project is divided into two main directories:

- `client/`: Contains the React frontend code
- `api/`: Contains the Node.js backend code

Additional files:
- `docker-compose.yml`: Defines the multi-container Docker setup
- `nginx.conf`: Configuration file for Nginx reverse proxy
- `.env.example`: Example environment variables file

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your actual values
3. Install dependencies for both frontend and backend (using yarn):
   ```
   cd client && yarn install
   cd ../api && yarn install
   ```
4. Start the development servers:
   - For frontend: `cd client && yarn start`
   - For backend: `cd api && yarn dev`

The frontend development server will start using Vite, and the backend will use Nodemon for auto-reloading during development.

## Docker Compose 

If you prefer using Docker for development recommended, you just need to use following command to start the containers:

```
docker-compose up -d
```

This will start the frontend and backend containers in detached mode.

NOTE: make sure you configured .env in root directory before starting.


## Building for Production

To build the frontend for production:

```
cd client && yarn build
```

This will create a production-ready build in the `dist` directory.

## Deployment

The application is set up for deployment on AWS EC2 using Docker and Nginx. The CI/CD pipeline is configured using GitHub Actions.

1. Ensure your AWS EC2 instance is set up and running
2. Configure your GitHub repository with the necessary AWS credentials as secrets
3. Push to the main branch to trigger the CI/CD pipeline

## Environment Variables

Make sure to set the following environment variables:

```
JWT_SECRET=your_jwt_secret
PORT=4000
MONGO_URI=your_mongodb_connection_string
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name
VITE_API_BACKEND_URL=http://your_api_url
CORS_DOMAIN_URL=http://your_frontend_url
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

```


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

