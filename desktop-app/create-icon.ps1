# Create a simple icon for LLMFit
# This script creates a simple PNG icon

Add-Type -AssemblyName System.Drawing

# Create 256x256 bitmap
$size = 256
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Fill with blue background
$graphics.Clear([System.Drawing.Color]::FromArgb(0, 122, 204))

# Draw "L" letter
$font = New-Object System.Drawing.Font("Arial", 120, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::White
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

$graphics.DrawString("L", $font, $brush, $size/2, $size/2, $stringFormat)

# Save as PNG
$bitmap.Save("d:\GitHub\llmfit\desktop-app\src-tauri\icons\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Save as ICO
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$fileStream = [System.IO.File]::Create("d:\GitHub\llmfit\desktop-app\src-tauri\icons\icon.ico")
$icon.Save($fileStream)
$fileStream.Close()

# Create different sizes
$sizes = @(32, 128)
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(0, 122, 204))
    $f = New-Object System.Drawing.Font("Arial", $s/2, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("L", $f, $brush, $s/2, $s/2, $stringFormat)
    $bmp.Save("d:\GitHub\llmfit\desktop-app\src-tauri\icons\${s}x${s}.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Icons created successfully!"
