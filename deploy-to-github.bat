@ECHO OFF
ECHO ========================================
ECHO    上传代码到 GitHub 脚本
ECHO ========================================

ECHO.
ECHO [1/5] 检查Git状态...
git status --porcelain
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ Git命令执行失败，请确保已安装Git
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [2/5] 添加所有文件到暂存区...
git add .
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ 添加文件失败
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [3/5] 提交更改...
ECHO 请输入提交信息（按Enter使用默认信息）:
SET /P commit_msg="提交信息: "
IF "%commit_msg%"=="" SET commit_msg=更新代码

git commit -m "%commit_msg%"
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ 提交失败，可能没有更改需要提交
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [4/5] 推送到GitHub...
ECHO 正在推送到远程仓库...
git push origin main
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ 推送失败，请检查网络连接和远程仓库配置
    ECHO 尝试推送其他分支...
    git push origin master
    IF %ERRORLEVEL% NEQ 0 (
        ECHO ❌ 推送仍然失败，请手动检查Git配置
        PAUSE
        EXIT /B 1
    )
)

ECHO.
ECHO [5/5] 检查推送结果...
git log --oneline -5
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ 获取提交历史失败
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO ========================================
ECHO    代码上传到GitHub完成！
ECHO ========================================
ECHO.
ECHO ✅ 文件已成功推送到GitHub
ECHO.
ECHO 🔗 GitHub仓库地址: https://github.com/你的用户名/你的仓库名
ECHO.
ECHO 📝 最近的提交记录：
git log --oneline -3
ECHO.
ECHO 💡 提示：
ECHO - 如果这是第一次推送，请确保已创建GitHub仓库
ECHO - 如果推送失败，请检查远程仓库URL是否正确
ECHO - 可以使用 'git remote -v' 查看远程仓库配置
ECHO.
PAUSE