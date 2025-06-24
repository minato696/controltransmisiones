#!/bin/bash

# Script completo para configurar Frontend + Backend EXITOSA
# Dominio: controlt.exitosa.pe
# Frontend: React en puerto 5885
# Backend: Java Spring Boot en puerto 5586

echo "🚀 CONFIGURACIÓN COMPLETA SISTEMA EXITOSA"
echo "=========================================="

DOMAIN="controlt.exitosa.pe"
FRONTEND_PORT="5885"
BACKEND_PORT="5586"
SERVER_IP="192.168.10.188"
BACKEND_JAR="/home/Java_Soft/incidencia-0.0.1-SNAPSHOT.jar"
FRONTEND_DIR="/home/Java_Soft/control_transmisiones_exitosa"
SITE_NAME="exitosa-control-transmisiones"

echo "🌐 Dominio: $DOMAIN"
echo "📱 Frontend: $SERVER_IP:$FRONTEND_PORT"
echo "⚙️  Backend: $SERVER_IP:$BACKEND_PORT"
echo "📦 JAR: $BACKEND_JAR"
echo "📁 Frontend: $FRONTEND_DIR"
echo ""

# Función para mostrar progreso
show_progress() {
    echo ""
    echo "🔄 $1..."
    echo "----------------------------------------"
}

# Función para mostrar éxito
show_success() {
    echo "✅ $1"
}

# Función para mostrar error y salir
show_error() {
    echo "❌ $1"
    exit 1
}

# 1. VERIFICACIONES PREVIAS
show_progress "Verificando requisitos previos"

# Verificar que el JAR existe
if [ ! -f "$BACKEND_JAR" ]; then
    show_error "Archivo JAR no encontrado: $BACKEND_JAR"
fi
show_success "JAR del backend encontrado"

# Verificar que el directorio del frontend existe
if [ ! -d "$FRONTEND_DIR" ]; then
    show_error "Directorio del frontend no encontrado: $FRONTEND_DIR"
fi
show_success "Directorio del frontend encontrado"

# Verificar que nginx está instalado
if ! command -v nginx &> /dev/null; then
    show_error "Nginx no está instalado. Ejecuta: sudo apt install nginx"
fi
show_success "Nginx está disponible"

# Verificar que PM2 está disponible
if ! command -v pm2 &> /dev/null; then
    show_error "PM2 no está instalado. Ejecuta: npm install -g pm2"
fi
show_success "PM2 está disponible"

# 2. DETENER PROCESOS EXISTENTES
show_progress "Deteniendo procesos existentes"

# Detener procesos PM2 existentes
pm2 stop exitosa-backend 2>/dev/null && echo "Backend PM2 detenido" || echo "Backend PM2 no estaba ejecutándose"
pm2 delete exitosa-backend 2>/dev/null && echo "Backend PM2 eliminado" || echo "Backend PM2 no existía"

pm2 stop exitosa-frontend 2>/dev/null && echo "Frontend PM2 detenido" || echo "Frontend PM2 no estaba ejecutándose"

# Matar procesos en puertos específicos si existen
if sudo lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
    echo "🔪 Liberando puerto $BACKEND_PORT..."
    sudo kill -9 $(sudo lsof -t -i:$BACKEND_PORT) 2>/dev/null || true
    sleep 2
fi

if sudo lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
    echo "🔪 Liberando puerto $FRONTEND_PORT..."
    sudo kill -9 $(sudo lsof -t -i:$FRONTEND_PORT) 2>/dev/null || true
    sleep 2
fi

show_success "Procesos existentes detenidos"

# 3. CONFIGURAR BACKEND JAVA
show_progress "Configurando backend Java"

cd /home/Java_Soft/

# Crear configuración de Spring Boot con CORS
cat > application.properties << EOF
# Configuración Spring Boot para Sistema EXITOSA
server.port=$BACKEND_PORT
server.address=0.0.0.0

# Configuración de CORS para permitir el dominio
spring.web.cors.allowed-origins=https://$DOMAIN,http://$DOMAIN,http://localhost:$FRONTEND_PORT,http://$SERVER_IP:$FRONTEND_PORT
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true

# Configuración de timezone
spring.jackson.time-zone=America/Lima
server.servlet.context-path=/

# Configuración de logging
logging.level.com.kalek.incidencia=INFO
logging.level.org.springframework.web=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n

# Configuración de actuator para monitoreo
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=always

# Configuración adicional de seguridad web
spring.security.web.header.frame.sameorigin=true
EOF

show_success "Configuración Spring Boot creada con CORS"

# Crear directorio de logs si no existe
mkdir -p /home/Java_Soft/control_transmisiones_exitosa/logs

# Iniciar backend con PM2
pm2 start java --name "exitosa-backend" -- -jar incidencia-0.0.1-SNAPSHOT.jar --spring.config.location=application.properties

# Esperar a que inicie el backend
echo "⏳ Esperando que el backend inicie (30 segundos)..."
sleep 10

# Verificar que el backend esté corriendo en PM2
if pm2 status | grep "exitosa-backend" | grep "online" > /dev/null; then
    show_success "Backend iniciado correctamente en PM2"
else
    echo "❌ Error al iniciar backend. Logs:"
    pm2 logs exitosa-backend --lines 20
    show_error "Backend no se pudo iniciar"
fi

# Verificar conectividad del backend
echo "🔍 Verificando conectividad del backend..."
backend_ready=false
for i in {1..15}; do
    if curl -s http://$SERVER_IP:$BACKEND_PORT/programa/listar > /dev/null 2>&1; then
        show_success "Backend responde correctamente en puerto $BACKEND_PORT"
        backend_ready=true
        break
    else
        echo "⏳ Intento $i/15 - Backend no responde aún..."
        sleep 2
    fi
done

if [ "$backend_ready" = false ]; then
    echo "❌ Backend no responde después de 30 segundos"
    echo "📋 Logs del backend:"
    pm2 logs exitosa-backend --lines 10
    show_error "Backend no está funcionando correctamente"
fi

# 4. CONFIGURAR NGINX
show_progress "Configurando Nginx con proxy inverso"

# Backup de configuración existente
if [ -f "/etc/nginx/sites-available/$SITE_NAME" ]; then
    sudo cp /etc/nginx/sites-available/$SITE_NAME /etc/nginx/sites-available/$SITE_NAME.backup.$(date +%Y%m%d_%H%M%S)
    echo "📋 Backup de configuración nginx creado"
fi

# Crear nueva configuración completa de nginx
sudo tee /etc/nginx/sites-available/$SITE_NAME > /dev/null << 'EOF'
# Configuración Nginx para Sistema EXITOSA Control de Transmisiones
# Frontend: React (puerto 5885)
# Backend: Java Spring Boot (puerto 5586)

server {
    listen 80;
    listen [::]:80;
    server_name controlt.exitosa.pe;

    # Logs específicos
    access_log /var/log/nginx/exitosa-control-access.log;
    error_log /var/log/nginx/exitosa-control-error.log;

    # Configuración para manejar requests grandes
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # Proxy para API del Backend Java (con prefijo /api/)
    location /api/ {
        # Remover /api/ del path antes de enviar al backend
        rewrite ^/api/(.*)$ /$1 break;
        
        proxy_pass http://192.168.10.188:5586;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Headers específicos para API
        proxy_set_header Accept application/json;
        proxy_set_header Content-Type application/json;
        
        # Timeouts para API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers para API
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Timezone, X-Local-Time" always;
        
        # Manejar preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Timezone, X-Local-Time" always;
            add_header Access-Control-Max-Age 1728000 always;
            add_header Content-Type 'text/plain; charset=utf-8' always;
            add_header Content-Length 0 always;
            return 204;
        }
    }

    # Proxy directo para endpoints específicos del backend (sin /api/)
    location ~ ^/(programa|filial|reporte)/ {
        proxy_pass http://192.168.10.188:5586;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Headers específicos para API
        proxy_set_header Accept application/json;
        proxy_set_header Content-Type application/json;
        
        # Timeouts para API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Timezone, X-Local-Time" always;
        
        # Manejar preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Timezone, X-Local-Time" always;
            add_header Access-Control-Max-Age 1728000 always;
            add_header Content-Type 'text/plain; charset=utf-8' always;
            add_header Content-Length 0 always;
            return 204;
        }
    }

    # Proxy para Frontend React (puerto 5885)
    location / {
        proxy_pass http://192.168.10.188:5885;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Configuración para aplicaciones React/SPA
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Headers adicionales
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        
        # Manejar rutas de React Router (fallback para SPA)
        try_files $uri $uri/ @fallback;
    }

    # Fallback para React Router
    location @fallback {
        proxy_pass http://192.168.10.188:5885;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Configuración optimizada para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://192.168.10.188:5885;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache para archivos estáticos
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Served-By "nginx-proxy";
    }

    # Bloquear acceso a archivos sensibles
    location ~ /\.(ht|git|env) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Status page para monitoreo (solo red local)
    location /nginx-status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 192.168.10.0/24;
        deny all;
    }

    # Health check para el sistema
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

show_success "Configuración de nginx creada"

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/$SITE_NAME /etc/nginx/sites-enabled/
show_success "Sitio habilitado en nginx"

# Verificar configuración de nginx
if sudo nginx -t; then
    show_success "Configuración de nginx válida"
    sudo systemctl reload nginx
    show_success "Nginx recargado"
else
    show_error "Error en configuración de nginx"
fi

# 5. ACTUALIZAR CONFIGURACIÓN DEL FRONTEND
show_progress "Actualizando configuración del frontend"

cd "$FRONTEND_DIR"

# Backup del archivo api.js original
if [ -f "src/services/api.js" ]; then
    cp src/services/api.js src/services/api.js.backup.$(date +%Y%m%d_%H%M%S)
    echo "📋 Backup de api.js creado"
fi

# Actualizar la URL del backend en api.js
if [ -f "src/services/api.js" ]; then
    # Cambiar la URL del backend
    sed -i "s|const API_BASE_URL = 'http://192.168.10.188:5586';|const API_BASE_URL = 'https://$DOMAIN';|g" src/services/api.js
    
    # También cambiar cualquier referencia a http://192.168.10.188:5586
    sed -i "s|http://192.168.10.188:5586|https://$DOMAIN|g" src/services/api.js
    
    show_success "URL del backend actualizada en api.js"
    
    # Mostrar el cambio realizado
    echo "📝 Cambio realizado:"
    echo "   Antes: const API_BASE_URL = 'http://192.168.10.188:5586';"
    echo "   Después: const API_BASE_URL = 'https://$DOMAIN';"
else
    echo "⚠️  Archivo api.js no encontrado, se usará configuración por defecto"
fi

# Reconstruir el frontend con la nueva configuración
echo "🔨 Reconstruyendo frontend con nueva configuración..."
if npm run build; then
    show_success "Frontend reconstruido exitosamente"
else
    show_error "Error al reconstruir el frontend"
fi

# Reiniciar el frontend
if pm2 restart exitosa-frontend; then
    show_success "Frontend reiniciado"
else
    echo "⚠️  Frontend no estaba en PM2, iniciando..."
    if [ -d "build" ]; then
        pm2 start serve --name "exitosa-frontend" -- -s build -l $FRONTEND_PORT -H 0.0.0.0
        show_success "Frontend iniciado con serve"
    else
        show_error "Directorio build no encontrado"
    fi
fi

# 6. GUARDAR CONFIGURACIÓN PM2
show_progress "Guardando configuración PM2"
pm2 save
show_success "Configuración PM2 guardada para inicio automático"

# 7. VERIFICACIONES FINALES
show_progress "Ejecutando verificaciones finales"

echo "🔍 Verificando servicios..."

# Verificar PM2
echo "📊 Estado PM2:"
pm2 status

echo ""
echo "🔍 Verificando conectividad..."

# Verificar frontend
if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302"; then
    show_success "Frontend accesible en http://$DOMAIN"
else
    echo "❌ Frontend no accesible en http://$DOMAIN"
fi

# Verificar backend directo
if curl -s http://$SERVER_IP:$BACKEND_PORT/programa/listar > /dev/null 2>&1; then
    show_success "Backend responde directamente en puerto $BACKEND_PORT"
else
    echo "❌ Backend no responde directamente"
fi

# Verificar backend a través del dominio
if curl -s http://$DOMAIN/programa/listar > /dev/null 2>&1; then
    show_success "Backend API accesible a través del dominio"
else
    echo "⚠️  Backend API no accesible a través del dominio (normal si no hay SSL)"
fi

# Verificar SSL existente
if curl -s https://$DOMAIN > /dev/null 2>&1; then
    show_success "HTTPS ya configurado y funcionando"
    SSL_READY=true
else
    echo "ℹ️  HTTPS no configurado aún"
    SSL_READY=false
fi

# 8. CONFIGURAR FIREWALL SI ESTÁ ACTIVO
if sudo ufw status | grep -q "Status: active"; then
    echo ""
    echo "🔥 Configurando firewall UFW..."
    sudo ufw allow 'Nginx Full' 2>/dev/null || true
    sudo ufw allow 'Nginx HTTP' 2>/dev/null || true
    sudo ufw allow 'Nginx HTTPS' 2>/dev/null || true
    show_success "Reglas de firewall configuradas"
fi

# 9. MOSTRAR RESUMEN FINAL
echo ""
echo "🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!"
echo "============================================="
echo ""
echo "📋 INFORMACIÓN DEL SISTEMA:"
echo "   🌐 Dominio: $DOMAIN"
echo "   🖥️  Servidor: $SERVER_IP"
echo "   📱 Frontend: Puerto $FRONTEND_PORT"
echo "   ⚙️  Backend: Puerto $BACKEND_PORT"
echo ""
echo "🔗 URLs DISPONIBLES:"
if [ "$SSL_READY" = true ]; then
    echo "   ✅ Sistema completo: https://$DOMAIN"
    echo "   ✅ API Backend: https://$DOMAIN/programa/listar"
else
    echo "   ✅ Sistema completo: http://$DOMAIN"
    echo "   ✅ API Backend: http://$DOMAIN/programa/listar"
    echo "   📋 Para HTTPS: sudo certbot --nginx -d $DOMAIN"
fi
echo "   🔧 Backend directo: http://$SERVER_IP:$BACKEND_PORT"
echo "   📊 Nginx status: http://$DOMAIN/nginx-status (solo local)"
echo "   ❤️  Health check: http://$DOMAIN/health"
echo ""
echo "📊 ESTADO DE SERVICIOS:"
pm2 status | grep -E "(Process|exitosa-)"
echo ""
echo "📝 PRÓXIMOS PASOS:"
if [ "$SSL_READY" = false ]; then
    echo "   1. Configurar SSL: sudo certbot --nginx -d $DOMAIN"
    echo "   2. Verificar el sistema: curl https://$DOMAIN"
else
    echo "   1. ✅ SSL ya configurado"
    echo "   2. Verificar el sistema: curl https://$DOMAIN"
fi
echo "   3. Probar la aplicación en el navegador"
echo "   4. Verificar logs: pm2 logs"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   📊 Ver estado PM2: pm2 status"
echo "   📋 Ver logs backend: pm2 logs exitosa-backend"
echo "   📋 Ver logs frontend: pm2 logs exitosa-frontend"
echo "   📋 Ver logs nginx: sudo tail -f /var/log/nginx/exitosa-control-*.log"
echo "   🔄 Reiniciar servicios: pm2 restart all"
echo "   💾 Guardar config PM2: pm2 save"
echo ""

# 10. MOSTRAR INFORMACIÓN DE DEBUG SI HAY ERRORES
if ! curl -s http://$DOMAIN/programa/listar > /dev/null 2>&1; then
    echo "🔍 INFORMACIÓN DE DEBUG:"
    echo "----------------------------------------"
    echo "Si hay problemas, verifica:"
    echo ""
    echo "1. Backend Java:"
    echo "   pm2 logs exitosa-backend --lines 20"
    echo "   curl http://$SERVER_IP:$BACKEND_PORT/programa/listar"
    echo ""
    echo "2. Frontend React:"
    echo "   pm2 logs exitosa-frontend --lines 20"
    echo "   curl http://$SERVER_IP:$FRONTEND_PORT"
    echo ""
    echo "3. Nginx:"
    echo "   sudo nginx -t"
    echo "   sudo tail -f /var/log/nginx/exitosa-control-error.log"
    echo ""
    echo "4. Configuración de red:"
    echo "   nslookup $DOMAIN"
    echo "   curl -I http://$DOMAIN"
    echo ""
fi

echo "✅ Script completado. ¡Tu Sistema EXITOSA está listo!"
exit 0
