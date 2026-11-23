# Color Temperature Converter

Convert between color temperature in Kelvin and sRGB/HEX color values. A practical utility for photographers, colorists and anyone matching display whites.

**Live:** [color-temperature-converter.itsjust.tools](https://color-temperature-converter.itsjust.tools)

## Features

- Kelvin → sRGB RGB and HEX conversion using Tanner Helland's blackbody approximation with gamut clamping
- RGB/HEX input converted back to the nearest correlated color temperature
- Live color swatch preview that updates with the temperature slider
- Slider input from 1000K to 12000K plus a numeric input field
- Display of approximate blackbody white point RGB values before clamping
- Copy HEX, RGB and Kelvin values to the clipboard with one click
- Preset temperatures: candlelight, tungsten, daylight, overcast, shade, monitor
- Shareable state via URL, `.itsjust.json` import/export and image/PDF export
- Keyboard accessible controls with labels and focus states
- 100% client-side — no data ever leaves your browser

## Keyboard shortcuts

| Key        | Action                    |
| ---------- | ------------------------- |
| Arrow keys | Adjust temperature slider |
| `Enter`    | Apply HEX input           |

## Development

```bash
npm install
npm run build -w @itsjust/core   # build shared core first
npm run dev
npm test
```

## Deployment

```bash
docker build -t itsjust-color-temperature-converter .
docker run -p 3000:3000 itsjust-color-temperature-converter
```

## License

MIT
