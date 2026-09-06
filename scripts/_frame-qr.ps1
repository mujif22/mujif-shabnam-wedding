param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

$qr = [System.Drawing.Image]::FromFile((Resolve-Path $InputPath))
$canvas = 900
$pad = 90
$inner = $canvas - (2 * $pad)

$bmp = New-Object System.Drawing.Bitmap $canvas, $canvas
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(255, 255, 253, 248))

# Outer soft panel
$outer = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 250, 240))
$g.FillRectangle($outer, 18, 18, $canvas - 36, $canvas - 36)
$outer.Dispose()

# Gold double frame
$gold = [System.Drawing.Color]::FromArgb(255, 184, 150, 90)
$goldDeep = [System.Drawing.Color]::FromArgb(255, 122, 95, 48)
$penOuter = New-Object System.Drawing.Pen $goldDeep, 2
$penInner = New-Object System.Drawing.Pen $gold, 1.5
$g.DrawRectangle($penOuter, 28, 28, $canvas - 56, $canvas - 56)
$g.DrawRectangle($penInner, 38, 38, $canvas - 76, $canvas - 76)

# Corner diamonds
function Draw-Diamond($cx, $cy, $size) {
  $pts = @(
    (New-Object System.Drawing.PointF ($cx), ($cy - $size)),
    (New-Object System.Drawing.PointF ($cx + $size), ($cy)),
    (New-Object System.Drawing.PointF ($cx), ($cy + $size)),
    (New-Object System.Drawing.PointF ($cx - $size), ($cy))
  )
  $brush = New-Object System.Drawing.SolidBrush $gold
  $g.FillPolygon($brush, $pts)
  $brush.Dispose()
  $g.DrawPolygon($penInner, $pts)
}

Draw-Diamond 48 48 6
Draw-Diamond ($canvas - 48) 48 6
Draw-Diamond 48 ($canvas - 48) 6
Draw-Diamond ($canvas - 48) ($canvas - 48) 6

# QR body (high-contrast, no recolor)
$g.DrawImage($qr, $pad, $pad, $inner, $inner)

$penOuter.Dispose()
$penInner.Dispose()
$g.Dispose()
$qr.Dispose()

$bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "framed $OutputPath"
