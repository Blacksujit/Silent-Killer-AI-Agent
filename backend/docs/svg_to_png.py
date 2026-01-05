from pathlib import Path
import sys

try:
    import cairosvg
except Exception as e:
    print('cairosvg not installed:', e)
    sys.exit(2)

svg = Path(__file__).with_name('architecture.svg')
png = Path(__file__).with_name('architecture.png')

if not svg.exists():
    print('SVG not found at', svg)
    sys.exit(1)

print('Converting', svg, '->', png)
# scale=2 for higher DPI
cairosvg.svg2png(url=str(svg), write_to=str(png), scale=2.0)
print('Wrote', png)
