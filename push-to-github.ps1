[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$repoDir = $PSScriptRoot
Set-Location -LiteralPath $repoDir
$logFile = Join-Path $repoDir 'push-log.txt'
'=== push ' + (Get-Date) | Out-File -LiteralPath $logFile -Encoding utf8

# ---------- 定位 git.exe ----------
$git = $null
foreach ($p in @(
    'E:\Git\cmd\git.exe',
    'D:\Git\cmd\git.exe',
    'C:\Program Files\Git\cmd\git.exe',
    'C:\Program Files (x86)\Git\cmd\git.exe'
)) {
    if (Test-Path $p) { $git = $p; break }
}
if (-not $git) {
    $c = Get-Command git -ErrorAction SilentlyContinue
    if ($c) { $git = $c.Source }
}

# ---------- 构建图形界面 ----------
$form = New-Object System.Windows.Forms.Form
$form.Text = '推送到 GitHub'
$form.Size = New-Object System.Drawing.Size(480, 340)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false

$labelRepo = New-Object System.Windows.Forms.Label
$labelRepo.Text = '目标仓库：xiaozhang991776/xiuxiangame （需公开，无 www）'
$labelRepo.Location = New-Object System.Drawing.Point(20, 15)
$labelRepo.Size = New-Object System.Drawing.Size(430, 20)
$form.Controls.Add($labelRepo)

$lblUser = New-Object System.Windows.Forms.Label
$lblUser.Text = 'GitHub 用户名：'
$lblUser.Location = New-Object System.Drawing.Point(20, 55)
$lblUser.Size = New-Object System.Drawing.Size(120, 20)
$form.Controls.Add($lblUser)

$txtUser = New-Object System.Windows.Forms.TextBox
$txtUser.Location = New-Object System.Drawing.Point(140, 52)
$txtUser.Size = New-Object System.Drawing.Size(300, 22)
$txtUser.Text = 'xiaozhang991776'
$form.Controls.Add($txtUser)

$lblToken = New-Object System.Windows.Forms.Label
$lblToken.Text = 'PAT 令牌：'
$lblToken.Location = New-Object System.Drawing.Point(20, 92)
$lblToken.Size = New-Object System.Drawing.Size(120, 20)
$form.Controls.Add($lblToken)

$txtToken = New-Object System.Windows.Forms.TextBox
$txtToken.Location = New-Object System.Drawing.Point(140, 89)
$txtToken.Size = New-Object System.Drawing.Size(300, 22)
$txtToken.PasswordChar = '*'
$form.Controls.Add($txtToken)

$btnPush = New-Object System.Windows.Forms.Button
$btnPush.Text = '推 送'
$btnPush.Location = New-Object System.Drawing.Point(140, 128)
$btnPush.Size = New-Object System.Drawing.Size(140, 36)
$form.Controls.Add($btnPush)

$status = New-Object System.Windows.Forms.Label
$status.Text = '填好用户名和 PAT，点「推送」。'
$status.Location = New-Object System.Drawing.Point(20, 180)
$status.Size = New-Object System.Drawing.Size(430, 90)
$form.Controls.Add($status)

$btnPush.Add_Click({
    $status.Text = '推送中……（可能需要几秒）'
    $form.Refresh()
    try {
        $u = $txtUser.Text.Trim()
        $t = $txtToken.Text.Trim()
        if (-not $u -or -not $t) {
            $status.Text = '用户名和 PAT 都不能为空。'
            return
        }
        if (-not $git) { throw '未找到 Git（请确认 E:/D:/C:/Program Files/Git 下已安装）。' }
        $url = "https://${u}:${t}@github.com/xiaozhang991776/xiuxiangame.git"
        $out = & $git push $url 'main' 2>&1 | Out-String
        if ($t) { $out = $out -replace [regex]::Escape($t), '***' }
        Add-Content -LiteralPath $logFile -Value $out
        if ($LASTEXITCODE -eq 0) {
            $status.Text = "成功！访问：https://xiaozhang991776.github.io/xiuxiangame/ （无 www）"
            [System.Windows.Forms.MessageBox]::Show("推送成功！`n`n访问：https://xiaozhang991776.github.io/xiuxiangame/ （无 www）", '完成', 'OK', 'Information') | Out-Null
        } else {
            $status.Text = '失败，详见 push-log.txt。常见：仓库未建 / PAT 无 repo 权限 / 用户名错。'
            [System.Windows.Forms.MessageBox]::Show("推送失败。`n`n请打开 xiuxian-game 目录下的 push-log.txt 看详细错误。`n`n常见原因：`n1. GitHub 上还没有仓库 xiaozhang991776/xiuxiangame（需公开、不勾 README）`n2. PAT 过期或没有 repo 权限`n3. 用户名 / PAT 填错", '失败', 'OK', 'Error') | Out-Null
        }
    } catch {
        Add-Content -LiteralPath $logFile -Value ($_.Exception.Message)
        $status.Text = '出错：' + $_.Exception.Message
        [System.Windows.Forms.MessageBox]::Show('出错：' + $_.Exception.Message, '错误', 'OK', 'Error') | Out-Null
    }
})

[System.Windows.Forms.Application]::EnableVisualStyles() | Out-Null
try {
    $null = $form.ShowDialog()
} catch {
    $msg = 'ShowDialog error: ' + $_.Exception.Message
    Add-Content -LiteralPath $logFile -Value $msg
    try { [System.Windows.Forms.MessageBox]::Show($msg + "`n`n请打开 push-log.txt 查看。", '错误', 'OK', 'Error') | Out-Null } catch {}
}
