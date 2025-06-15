module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 8040
      },
            env_production: {
        NODE_ENV: 'production',
        PORT: 8040,
        HTTPS_ENABLED: "true",
        SSL_KEY_PATH: "/path/to/your/private.key", // <--- Update with actual path
        SSL_CERT_PATH: "/path/to/your/certificate.crt", // <--- Update with actual path
        SSL_CA_PATH: "/path/to/your/ca_bundle.crt" // <--- Update with actual path (if you have a CA bundle)
      }
    }
  ]
};


