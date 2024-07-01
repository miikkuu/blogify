module.exports = {
  apps: [
    {
      name: "api",
      script: "./api/index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "client",
      script: "npm",
      args: "run serve",
      cwd: "./client",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
