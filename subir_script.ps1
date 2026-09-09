# Script para subir el script de Cloudflare Tunnel al servidor
$LocalPath = "C:\Users\dailo\Desktop\ProyectosAbe\ApPigota\setup_cloudflare_tunnel.sh"
$RemotePath = "~/setup_cloudflare_tunnel.sh"
$Server = "abriserver@192.168.0.29"

Write-Host "Subiendo script al servidor..." -ForegroundColor Cyan
Write-Host "Este comando te pedirá la contraseña del servidor." -ForegroundColor Yellow

$command = "scp $LocalPath ${Server}:${RemotePath}"
Invoke-Expression $command

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Script subido correctamente" -ForegroundColor Green
    Write-Host "Ahora conecta al servidor y ejecuta:" -ForegroundColor White
    Write-Host "ssh abriserver@192.168.0.29" -ForegroundColor Cyan
    Write-Host "chmod +x ~/setup_cloudflare_tunnel.sh" -ForegroundColor Cyan
    Write-Host "./setup_cloudflare_tunnel.sh" -ForegroundColor Cyan
} else {
    Write-Host "✗ Error subiendo el script" -ForegroundColor Red
}