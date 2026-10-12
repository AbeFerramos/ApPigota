#!/bin/bash

# Script automatizado para configurar Cloudflare Tunnel para La Pigota
# Ejecutar en el servidor CasaOS: ssh abriserver@192.168.0.29

set -e

echo "=========================================="
echo "Configuración Cloudflare Tunnel para La Pigota"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar que no somos root
if [ "$EUID" -eq 0 ]; then 
    print_error "No ejecutar como root. Ejecutar como usuario abriserver"
    exit 1
fi

# Verificar conexión a internet
print_warning "Verificando conexión a internet..."
if ! ping -c 1 google.com &> /dev/null; then
    print_error "No hay conexión a internet"
    exit 1
fi
print_success "Conexión a internet OK"

# Verificar que PocketBase está funcionando
print_warning "Verificando que PocketBase esté funcionando..."
if ! curl -s http://localhost:8090/api/health > /dev/null; then
    print_error "PocketBase no está funcionando en http://localhost:8090"
    print_warning "Inicia PocketBase con: sudo systemctl start pocketbase"
    exit 1
fi
print_success "PocketBase funcionando OK"

# Descargar cloudflared
print_warning "Descargando cloudflared..."
cd /tmp
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
if [ $? -ne 0 ]; then
    print_error "Error descargando cloudflared"
    exit 1
fi
print_success "cloudflared descargado"

# Instalar cloudflared
print_warning "Instalando cloudflared..."
sudo dpkg -i cloudflared-linux-amd64.deb
if [ $? -ne 0 ]; then
    print_error "Error instalando cloudflared"
    exit 1
fi
print_success "cloudflared instalado"

# Verificar instalación
print_warning "Verificando instalación..."
cloudflared --version
if [ $? -ne 0 ]; then
    print_error "cloudflared no se instaló correctamente"
    exit 1
fi
print_success "cloudflared instalado correctamente"

# Crear directorio de configuración
print_warning "Creando directorio de configuración..."
mkdir -p ~/.cloudflared
print_success "Directorio creado"

# Preguntar por el tunnel ID y token
echo ""
print_warning "=========================================="
print_warning "INSTRUCCIONES PARA OBTENER TUNNEL ID:"
print_warning "=========================================="
echo "1. Ve a https://dash.cloudflare.com"
echo "2. Inicia sesión o regístrate"
echo "3. Ve a Zero Trust → Networks → Tunnels"
echo "4. Crea un nuevo tunnel llamado 'lapigota-tunnel'"
echo "5. Copia el Tunnel ID que te muestra"
echo "6. También descarga el archivo de credenciales (el archivo .json)"
echo "7. Sube el archivo de credenciales al servidor en ~/.cloudflared/"
echo ""
print_warning "Cuando tengas el Tunnel ID y las credenciales, continúa..."
echo ""

read -p "Presiona Enter cuando tengas el Tunnel ID y las credenciales..."

# Pedir Tunnel ID
read -p "Introduce el Tunnel ID: " TUNNEL_ID

if [ -z "$TUNNEL_ID" ]; then
    print_error "Tunnel ID es obligatorio"
    exit 1
fi

# Verificar archivo de credenciales
CREDENTIALS_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
if [ ! -f "$CREDENTIALS_FILE" ]; then
    print_error "Archivo de credenciales no encontrado en $CREDENTIALS_FILE"
    print_warning "Sube el archivo de credenciales desde Cloudflare"
    exit 1
fi
print_success "Archivo de credenciales encontrado"

# Preguntar por el dominio
echo ""
read -p "Introduce tu dominio completo (ej: lapigota.tu-dominio.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    print_error "Dominio es obligatorio"
    exit 1
fi

# Crear configuración
print_warning "Creando configuración de Cloudflare Tunnel..."
cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDENTIALS_FILE

ingress:
  - hostname: $DOMAIN
    service: http://localhost:8090
  - service: http_status:404
EOF

print_success "Configuración creada"

# Crear servicio systemd
print_warning "Creando servicio systemd..."
sudo tee /etc/systemd/system/cloudflared.service > /dev/null <<EOF
[Unit]
Description=cloudflared
After=network.target

[Service]
Type=simple
User=abriserver
ExecStart=/usr/bin/cloudflared tunnel --config /home/abriserver/.cloudflared/config.yml run $TUNNEL_ID
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

print_success "Servicio systemd creado"

# Habilitar e iniciar servicio
print_warning "Habilitando e iniciando servicio cloudflared..."
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sleep 3
sudo systemctl status cloudflared

print_success "Servicio cloudflared iniciado"

# Configurar DNS en Cloudflare (instrucciones manuales)
echo ""
print_warning "=========================================="
print_warning "CONFIGURACIÓN DNS EN CLOUDFLARE:"
print_warning "=========================================="
echo "1. Ve al panel de Cloudflare: https://dash.cloudflare.com"
echo "2. Ve a DNS → Records"
echo "3. Añade un registro CNAME:"
echo "   - Name: $(echo $DOMAIN | cut -d'.' -f1)"
echo "   - Target: ${TUNNEL_ID}.cfargotunnel.com"
echo "   - Proxy: Enabled (naranja)"
echo ""

# Firewall UFW
print_warning "Configurando firewall (opcional)..."
sudo ufw allow 8090/tcp 2>/dev/null || true
print_success "Firewall configurado"

echo ""
print_success "=========================================="
print_success "✓ Cloudflare Tunnel configurado correctamente"
print_success "=========================================="
echo ""
echo "Tu PocketBase será accesible en: https://$DOMAIN"
echo ""
echo "Prueba el acceso con:"
echo "curl https://$DOMAIN/api/health"
echo ""
print_warning "Recuerda configurar CORS en PocketBase para permitir este dominio"
echo ""
print_warning "Reinicia el servicio si es necesario:"
echo "sudo systemctl restart cloudflared"
echo ""