module.exports = {
  apps: [
    {
      name: "api",
      cwd: "./api",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "cluster", // Use "cluster" for better performance
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 4000

      },
      env_production: {
        NODE_ENV: "production",
      }
    },
    {
      name: "client",
      cwd: "./client",
      script: "npm",
      args: "run build", // Use "build" for React production build
      instances: 1,
      exec_mode: "fork", // Use "fork" for client-side applications
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        PM2_SERVE_PORT: 3000
      }
    }
  ]
};
