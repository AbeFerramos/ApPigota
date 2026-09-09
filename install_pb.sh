#!/bin/bash
echo "Starting PocketBase installation..."
cd /tmp
wget -q -O pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip
sudo mkdir -p /opt/pocketbase
sudo unzip -o pocketbase.zip -d /opt/pocketbase
rm pocketbase.zip
sudo chmod +x /opt/pocketbase/pocketbase
mkdir -p /opt/pocketbase/data

sudo tee /etc/systemd/system/pocketbase.service > /dev/null <<'EOF'
[Unit]
Description=PocketBase for La Pigota
After=network.target

[Service]
Type=simple
User=
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=0.0.0.0:8090
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
sudo ufw allow 8090/tcp 2>/dev/null || true
echo "Installation completed"