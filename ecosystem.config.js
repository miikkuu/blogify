module.exports = {
  apps: [
    {
      name: "api",
      cwd: "./api",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
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
      script: "npm",
      args: "run serve",
      cwd: "./client",
      instances: 1,
      autorestart: true,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        PM2_SERVE_PORT: 3000

      }
    }
  ]
};
