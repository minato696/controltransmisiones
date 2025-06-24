module.exports = {
  apps: [
    {
      // Configuración para DESARROLLO
      name: 'exitosa-frontend-dev',
      script: 'npm',
      args: 'start',
      cwd: '/home/Java_Soft/control_transmisiones_exitosa',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: '5885',
        HOST: '0.0.0.0',
        NODE_OPTIONS: '--no-warnings',
        GENERATE_SOURCEMAP: 'false',
        ESLINT_NO_DEV_ERRORS: 'true'
      },
      error_file: '/home/Java_Soft/control_transmisiones_exitosa/logs/dev-err.log',
      out_file: '/home/Java_Soft/control_transmisiones_exitosa/logs/dev-out.log',
      log_file: '/home/Java_Soft/control_transmisiones_exitosa/logs/dev-combined.log',
      time: true
    },
    {
      // Configuración para PRODUCCIÓN
      name: 'exitosa-frontend-prod',
      script: 'serve',
      args: '-s build -l 5885 -H 0.0.0.0',
      cwd: '/home/Java_Soft/control_transmisiones_exitosa',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: '5885'
      },
      error_file: '/home/Java_Soft/control_transmisiones_exitosa/logs/prod-err.log',
      out_file: '/home/Java_Soft/control_transmisiones_exitosa/logs/prod-out.log',
      log_file: '/home/Java_Soft/control_transmisiones_exitosa/logs/prod-combined.log',
      time: true
    }
  ]
};