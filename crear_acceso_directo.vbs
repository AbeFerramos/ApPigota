Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtener la ruta del directorio actual donde está este script
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptPath & "\iniciar_app.bat"

' Obtener la ruta del escritorio
desktopPath = WshShell.SpecialFolders("Desktop")

' Crear el acceso directo
Set shortcut = WshShell.CreateShortcut(desktopPath & "\La Pigota.lnk")
shortcut.TargetPath = batPath
shortcut.WorkingDirectory = scriptPath
shortcut.Description = "Iniciar aplicación La Pigota"
shortcut.Save

MsgBox "Acceso directo creado en el escritorio: La Pigota.lnk", vbInformation, "Éxito"
