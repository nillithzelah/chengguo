module.exports = {
  apps: [
    {
      name: 'douyin-admin-api',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_TYPE: 'sqlite',
        JWT_SECRET: 'chengguo_jwt_secret_key_2024',
        VITE_DOUYIN_APP_ID: '1843500894701081',
        VITE_DOUYIN_APP_SECRET: '7ad00307b2596397ceeee3560ca8bfc9b3622476',
        VITE_DOUYIN_ADVERTISER_ID: '1843402492405963'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_TYPE: 'sqlite',
        JWT_SECRET: 'chengguo_jwt_secret_key_2024',
        VITE_DOUYIN_APP_ID: '1843500894701081',
        VITE_DOUYIN_APP_SECRET: '7ad00307b2596397ceeee3560ca8bfc9b3622476',
        VITE_DOUYIN_ADVERTISER_ID: '1843402492405963'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};