Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\claude code\EasySummer-clean"
WshShell.Run "npm run dev", 0, False
Set WshShell = Nothing
