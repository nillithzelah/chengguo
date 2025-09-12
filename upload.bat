@echo off
echo Starting FTP upload to server...

echo open 47.115.94.203 21 > ftp_commands.txt
echo root >> ftp_commands.txt
echo 1qaz1QAZ1qaz >> ftp_commands.txt
echo cd /var/www/douyin-admin-master >> ftp_commands.txt
echo mput dist\* >> ftp_commands.txt
echo quit >> ftp_commands.txt

ftp -s:ftp_commands.txt

del ftp_commands.txt

echo Upload completed!
pause