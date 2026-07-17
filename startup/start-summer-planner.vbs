Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\claude code\project summer vocation plan"
WshShell.Run "npm run dev", 0, False
Set WshShell = Nothing
