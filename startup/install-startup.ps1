# Create Startup shortcut for Summer Planner
$startup = [Environment]::GetFolderPath('Startup')
$target = 'D:\claude code\project summer vocation plan\startup\start-summer-planner.vbs'
$shortcutPath = Join-Path $startup 'SummerPlanner.lnk'

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = 'wscript.exe'
$Shortcut.Arguments = "`"$target`""
$Shortcut.WorkingDirectory = 'D:\claude code\project summer vocation plan'
$Shortcut.WindowStyle = 7
$Shortcut.Description = '暑期规划 Summer Planner'
$Shortcut.Save()

Write-Host "✅ Startup shortcut created at: $shortcutPath"
Write-Host "Summer Planner will auto-start on next login."
