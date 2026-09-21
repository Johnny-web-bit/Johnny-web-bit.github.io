# Johnny's Portfolio - 本地演示服务器（localhost:8899）
# 双击同目录的"启动演示.bat"即可；关闭窗口或按 Ctrl+C 停止
$root = $PSScriptRoot
$port = 8899
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch {
    Write-Host "服务器已在运行中，直接使用 http://localhost:$port/index.html 即可" -ForegroundColor Yellow
    Start-Process "http://localhost:$port/index.html"
    exit
}
Write-Host "演示服务器已启动：http://localhost:$port/index.html  （关闭本窗口即停止）" -ForegroundColor Green
Start-Process "http://localhost:$port/index.html"
$mime = @{
    ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"
    ".js"="application/javascript; charset=utf-8"; ".jpg"="image/jpeg"
    ".jpeg"="image/jpeg"; ".png"="image/png"; ".webp"="image/webp"
    ".svg"="image/svg+xml"; ".ico"="image/x-icon"; ".woff2"="font/woff2"
}
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.AbsolutePath
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path -replace "/", "\")
    if ((Test-Path $file -PathType Leaf) -and ($file.StartsWith($root))) {
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.OutputStream.Close()
}
