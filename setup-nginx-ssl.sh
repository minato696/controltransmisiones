#!/bin/bash

# Script de configuración completa para Nginx + SSL
# Sistema EXITOSA Control de Transmisiones
# Dominio: controlt.exitosa.pe

DOMAIN="controlt.exitosa.pe"
APP_PORT="5885"
APP_IP="192.168.10.188"
SITE_NAME="exitosa-control-transmisiones"

echo "🚀 Configurando Nginx + SSL para Sistema EXITOSA"
echo "================================================"
echo "Dominio: $DOMAIN"
echo "Backend: http://$APP_IP:$APP_PORT"
echo "Sitio: $SITE_NAME"
echo ""

# Función para verificar si un comando existe
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 no está instalado"
        return 1
    else
        echo "✅ $1 está disponible"
        return 0
    fi
}

# Función para verificar el estado de un servicio
check_service() {
    if systemctl is-active --quiet $1; then
        echo "✅ $1 está ejecutándose"
        return 0
    else
        echo "❌ $1 no está ejecutándose"
        return 1
    fi
}

# Verificar requisitos previos
echo "🔍 Verificando requisitos previos..."
check_command nginx || { echo "Instala nginx: sudo apt install nginx"; exit 1; }
check_service nginx || { echo "Inicia nginx: sudo systemctl start nginx"; exit 1; }

# Verificar que la aplicación esté ejecutándose
echo ""
echo "🔍 Verificando aplicación backend..."
if curl -s http://$APP_IP:$APP_PORT > /dev/null; then
    echo "✅ Aplicación backend responde en http://$APP_IP:$APP_PORT"
else
    echo "❌ Aplicación backend no responde en http://$APP_IP:$APP_PORT"
    echo "   Verifica que pm2 esté ejecutando la aplicación"
    exit 1
fi

# Verificar resolución DNS
echo ""
echo "🔍 Verificando DNS..."
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo "✅ $DOMAIN resuelve correctamente"
    echo "   IP: $(nslookup $DOMAIN | grep -A1 'Name:' | tail -n1 | awk '{print $2}')"
else
    echo "⚠️  $DOMAIN no resuelve o no apunta a este servidor"
    echo "   Asegúrate de que el DNS esté configurado correctamente"
    echo "   El certificado SSL fallará si el DNS no apunta aquí"
fi

# Crear configuración de nginx si no existe
echo ""
echo "🔧 Creando configuración de nginx..."
sudo tee /etc/nginx/sites-available/$SITE_NAME > /dev/null << 'EOF'
# Configuración Nginx para Sistema EXITOSA Control de Transmisiones
# Proxy inverso: controlt.exitosa.pe -> http://192.168.10.188:5885

server {
    listen 80;
    listen [::]:80;
    server_name controlt.exitosa.pe;

    # Logs específicos para el sitio
    access_log /var/log/nginx/exitosa-control-access.log;
    error_log /var/log/nginx/exitosa-control-error.log;

    # Configuración del proxy inverso
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
        
        # Configuración para aplicaciones React
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Headers adicionales para CORS si es necesario
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }

    # Configuración para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://192.168.10.188:5885;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache para archivos estáticos
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Bloquear acceso a archivos sensibles
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "✅ Configuración de nginx creada"

# Crear backup de configuración existente si existe
if [ -f "/etc/nginx/sites-available/$SITE_NAME" ]; then
    echo ""
    echo "📋 Configuración de nginx encontrada"
fi

# Habilitar el sitio
echo ""
echo "🔧 Habilitando sitio en nginx..."
sudo ln -sf /etc/nginx/sites-available/$SITE_NAME /etc/nginx/sites-enabled/
echo "✅ Sitio habilitado"

# Verificar configuración de nginx
echo ""
echo "🔍 Verificando configuración de nginx..."
if sudo nginx -t; then
    echo "✅ Configuración de nginx válida"
else
    echo "❌ Error en configuración de nginx"
    exit 1
fi

# Recargar nginx
echo ""
echo "🔄 Recargando nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recargado"

# Verificar que el sitio HTTP funciona
echo ""
echo "🔍 Verificando acceso HTTP..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302"; then
    echo "✅ Sitio HTTP accesible en http://$DOMAIN"
else
    echo "⚠️  Sitio HTTP no responde correctamente"
    echo "   Verifica la configuración y DNS"
fi

# Instalar certbot si no está instalado
echo ""
echo "📦 Verificando/Instalando certbot..."
if ! check_command certbot; then
    echo "📦 Instalando certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot instalado"
fi

echo ""
echo "🎯 Configuración básica completada"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verifica que http://$DOMAIN funcione"
echo "2. Ejecuta el comando SSL cuando el DNS esté listo:"
echo ""
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "🔗 URLs:"
echo "   HTTP:  http://$DOMAIN"
echo "   HTTPS: https://$DOMAIN (después del SSL)"
echo "   App:   http://$APP_IP:$APP_PORT (directo)"
echo ""

# Si se pasa el parámetro 'ssl', configurar SSL automáticamente
if [ "$1" = "ssl" ]; then
    echo "🔒 Configurando SSL automáticamente..."
    echo ""
    
    # Verificar DNS antes de continuar
    CURRENT_IP=$(curl -s ifconfig.me)
    DOMAIN_IP=$(nslookup $DOMAIN | grep -A1 'Name:' | tail -n1 | awk '{print $2}' 2>/dev/null)
    
    if [ "$CURRENT_IP" = "$DOMAIN_IP" ]; then
        echo "✅ DNS verificado: $DOMAIN apunta a $CURRENT_IP"
        echo ""
        echo "🔒 Generando certificado SSL..."
        echo "   (Puede tomar unos minutos)"
        
        # Generar certificado SSL
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@exitosa.pe --redirect
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 ¡SSL configurado exitosamente!"
            echo ""
            echo "✅ Certificado SSL instalado"
            echo "✅ Redirección HTTP -> HTTPS habilitada"
            echo "✅ Auto-renovación configurada"
            echo ""
            echo "🔗 Tu sitio está disponible en:"
            echo "   https://$DOMAIN"
            
        else
            echo ""
            echo "❌ Error al generar certificado SSL"
            echo "   Verifica que:"
            echo "   - El DNS apunte correctamente a este servidor"
            echo "   - Los puertos 80 y 443 estén abiertos"
        fi
    else
        echo "❌ DNS no apunta a este servidor"
        echo "   Servidor actual: $CURRENT_IP"
        echo "   DNS apunta a: $DOMAIN_IP"
        echo "   Configura el DNS antes de generar SSL"
    fi
fi

echo ""
echo "📊 Estado final:"
sudo systemctl status nginx --no-pager -l
