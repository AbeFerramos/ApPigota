#!/bin/bash
# Script de instalación de PocketBase en servidor remoto

echo "=== Instalación de PocketBase para La Pigota ==="
echo "Servidor: 192.168.0.29"
echo "Usuario: abriserver"
echo ""

# Directorio de instalación
PB_DIR="/opt/pocketbase"
PB_VERSION="0.22.20"
PB_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"

echo "1. Creando directorio de instalación..."
sudo mkdir -p $PB_DIR
sudo chown $USER:$USER $PB_DIR

echo "2. Descargando PocketBase v${PB_VERSION}..."
cd /tmp
wget -O pocketbase.zip $PB_URL

echo "3. Extrayendo PocketBase..."
unzip -o pocketbase.zip -d $PB_DIR
rm pocketbase.zip

echo "4. Creando directorio de datos..."
mkdir -p $PB_DIR/data

echo "5. Configurando permisos..."
chmod +x $PB_DIR/pocketbase

echo "6. Creando servicio systemd..."
sudo tee /etc/systemd/system/pocketbase.service > /dev/null <<EOF
[Unit]
Description=PocketBase for La Pigota
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PB_DIR
ExecStart=$PB_DIR/pocketbase serve --http=0.0.0.0:8090
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "7. Iniciando servicio..."
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

echo "8. Verificando estado..."
sudo systemctl status pocketbase

echo "9. Abriendo puerto en firewall..."
sudo ufw allow 8090/tcp 2>/dev/null || echo "Firewall no configurado o UFW no disponible"

echo ""
echo "=== Instalación completada ==="
echo "PocketBase debería estar funcionando en: http://192.168.0.29:8090"
echo "Panel de administración: http://192.168.0.29:8090/_/"
echo ""
echo "Para ver logs: sudo journalctl -u pocketbase -f"
echo "Para reiniciar: sudo systemctl restart pocketbase"
echo "Para detener: sudo systemctl stop pocketbase"