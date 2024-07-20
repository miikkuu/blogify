# Blogify📝

A FullStack Blog application that allows users to create, manage, and share blog posts seamlessly. Now featuring Google OAuth for easy sign-in. ✨

Blogify is not just another blog application. It is a full-fledged platform that allows users to create, manage, and share blog posts with ease. With features like user authentication, Google OAuth, and image uploads, Blogify is the perfect solution for bloggers and content creators. 🚀

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [New Features](#new-features)
- [License](#license)

## Features

- User Authentication and Authorization
- Create, Read, Update, and Delete (CRUD) blog posts
- Markdown support for posts
- Image uploads for posts
- Category and Tag management
- Comment system
- Responsive design
- Google OAuth for easy sign-in

## Tech Stack

- **Frontend**: React, Vite , Quill
- **Backend**: Node.js, Express , Multer , S3
- **Database**: MongoDB
- **Authentication**: JWT, Google OAuth
- **Containerization**: Docker , Docker-Compose
- **Cloud**: AWS (EC2,S3,ECR)

## Getting Started

### Prerequisites

- Node.js (>=18.x)
- Docker
- Docker-Compose
- MongoDB Cluster (for local development)
- Google OAuth Client ID and Secret (optional)
- AWS Account (for deployment)
- AWS CLI     (for deployment)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/blogify.git
    cd blogify
    ```

2. Install dependencies:
    ```bash
    cd api
    yarn install
    cd ../client
    yarn install
    ```

3. Create a `.env` file in both the `api` and `client` directories and add the necessary environment variables. Refer to `.env.example` for required variables in both directories.

### Running Locally

1. Start the backend server:
    ```bash
    cd api
    yarn start
    ```

2. Start the frontend development server:
    ```bash
    cd client
    yarn start
    ```

3. Visit `http://localhost:5173` in your browser.

## Configuration

### Environment Variables

- **API**
  - `MONGODB_URI`: MongoDB connection string
  - `JWT_SECRET`: Secret key for JWT
  - `GOOGLE_CLIENT_ID`: Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

- **Client**
  - `VITE_API_BACKEND_URL`: Backend API URL (e.g., `http://localhost:4000`)
  - `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID (optional)

### Google OAuth Setup

1. Create a project in the [Google Developers Console](https://console.developers.google.com/).
2. Configure OAuth consent screen and credentials.
3. Get your `Client ID` and `Client Secret`.

## Deployment

1. Build Docker images and push to Amazon ECR:
    ```bash
    docker build -t <your-repo-name>:api .
    docker build -t <your-repo-name>:client .
    docker push <your-repo-name>:api
    docker push <your-repo-name>:client
    ```

2. Use the provided `deploy.yml` for GitHub Actions to automate deployment to AWS EC2.

## New Features

### Google OAuth Integration

- Users can now sign in using their Google account.
- Simplified sign-up and sign-in process.


## Contribution Guidelines

We welcome and encourage contributions to this project! If you would like to contribute, please follow these steps:

1. Create a new branch from the `main` branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your desired changes and commit them:
   ```bash
   git add .
   git commit -m "Add your commit message here"
   ```

3. Push your branch to the remote repository:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a pull request on GitHub and provide a clear description of your changes.

5. Wait for the project maintainers to review your pull request. Your contribution is greatly appreciated!

Thank you for your interest in contributing to this project!
Hit the ⭐️ button if you found this project interesting or helpful!




## License

This project is licensed under the MIT.
