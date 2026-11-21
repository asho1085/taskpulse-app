Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & Replace(WScript.ScriptFullName, "Launch-Silent.vbs", "Launch-App.bat") & chr(34), 0
Set WshShell = Nothing
