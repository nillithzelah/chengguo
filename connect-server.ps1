# PowerShell脚本：连接到远程服务器
$server = "47.115.94.203"
$username = "root"
$password = "1qaz1QAZ1qaz"

Write-Host "连接到服务器 $server..."
Write-Host "用户名: $username"
Write-Host "密码: $password"
Write-Host ""

# 使用ssh连接（需要手动输入密码）
ssh $username@$server

Write-Host "连接已断开"