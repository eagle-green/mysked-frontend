# Logo Export Guide

## Export PNG from SVG for Email Templates

Since email clients don't support SVG files well, you need to export `m-logo-rounded.svg` as a PNG file.

### Steps to Export:

#### Option 1: Using Figma/Adobe Illustrator/Inkscape
1. Open `mysked-frontend/public/logo/m-logo-rounded.svg` in your design tool
2. Export as PNG with these settings:
   - **Resolution**: 512x512 pixels (or 1024x1024 for retina displays)
   - **Format**: PNG
   - **Background**: Transparent OR with the blue background color (#2d47de)
3. Save the file as `m-logo-rounded.png`
4. Place it in `mysked-frontend/public/logo/`

#### Option 2: Using Online Converter
1. Go to https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload `mysked-frontend/public/logo/m-logo-rounded.svg`
3. Set dimensions to 512x512 pixels
4. Download the PNG
5. Rename to `m-logo-rounded.png`
6. Place it in `mysked-frontend/public/logo/`

#### Option 3: Using ImageMagick (Command Line)
```bash
cd mysked-frontend/public/logo
convert -background none -resize 512x512 m-logo-rounded.svg m-logo-rounded.png
```

### After Export:
1. Upload `m-logo-rounded.png` to your production server at `/logo/m-logo-rounded.png`
2. The file should be accessible at: `https://mysked.ca/logo/m-logo-rounded.png`
3. Test by sending a test email to verify the logo displays correctly

### Recommended Sizes:
- **Minimum**: 512x512 pixels
- **Recommended**: 1024x1024 pixels (for retina displays)
- **Format**: PNG with transparent background or #2d47de blue background

### Current Email Template Configuration:
All email templates now reference: `https://mysked.ca/logo/m-logo-rounded.png`

The logo displays at 80x80px in emails but should be exported at higher resolution for quality.


