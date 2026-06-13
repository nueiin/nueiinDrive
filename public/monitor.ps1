# JavaScript에서 전달받은 디렉토리 경로
$folderPath = $args[0]

if (-not (Test-Path -Path $folderPath -PathType Container)) {
    Write-Host "경로 '$folderPath'가 존재하지 않거나 폴더가 아닙니다."
    exit
}

# 파일 시스템 감시자 생성
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $folderPath
$fsw.IncludeSubdirectories = $true  # 하위 폴더 포함

# 이벤트 핸들러 정의
$onChange = {
    param($source, $e)
    $message = "$($e.ChangeType),$($e.FullPath)"
    Write-Host $message
}

# 이벤트에 이벤트 핸들러 연결
Register-ObjectEvent $fsw 'Changed' -Action $onChange
Register-ObjectEvent $fsw 'Created' -Action $onChange
Register-ObjectEvent $fsw 'Deleted' -Action $onChange
Register-ObjectEvent $fsw 'Renamed' -Action $onChange

# 감시자 활성화
$fsw.EnableRaisingEvents = $true

# 스크립트가 종료되지 않도록 유지
while ($true) { Start-Sleep 1 }
