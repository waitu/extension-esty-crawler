Add-Type -AssemblyName System.Drawing

$base = "d:\CV\ex\esty\etsy-crawler-extension\assets"
$sizes = @(16, 32, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object Drawing.Bitmap ($size, $size)
    $graphics = [Drawing.Graphics]::FromImage($bmp)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.Clear([Drawing.Color]::FromArgb(255, 255, 116, 0))

    $rect = New-Object Drawing.Rectangle 0, 0, $size, $size
    $brush = New-Object Drawing.Drawing2D.LinearGradientBrush $rect, ([Drawing.Color]::FromArgb(255, 255, 134, 0)), ([Drawing.Color]::FromArgb(255, 255, 88, 0)), 45.0
    $graphics.FillRectangle($brush, $rect)
    $brush.Dispose()

    $fontSize = [Math]::Max(6, [Math]::Floor($size * 0.42))
    $fontSizeSingle = [single]$fontSize
    $fontStyle = [Drawing.FontStyle]::Bold
    $graphicsUnit = [Drawing.GraphicsUnit]::Pixel
    $font = New-Object Drawing.Font ("Segoe UI", $fontSizeSingle, $fontStyle, $graphicsUnit)
    $format = New-Object Drawing.StringFormat
    $format.Alignment = [Drawing.StringAlignment]::Center
    $format.LineAlignment = [Drawing.StringAlignment]::Center
    $rectF = New-Object Drawing.RectangleF 0, 0, $size, $size
    $graphics.DrawString("E", $font, [Drawing.Brushes]::White, $rectF, $format)

    $font.Dispose()
    $graphics.Dispose()

    $path = Join-Path $base ("icon{0}.png" -f $size)
    $bmp.Save($path, [Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
