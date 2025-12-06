# Example Fonts

This directory contains example font files that are automatically loaded into the app's `/user` folder on startup.

## How It Works

1. **examples-manifest.json** - A manifest file that specifies which example fonts to preload
2. **example-loader.js** - A JavaScript module that reads the manifest and copies files into Pyodide's file system
3. The loader runs during app initialization, after Pyodide is ready but before the UI shows

## Adding New Examples

To add more example fonts to be preloaded:

1. Place the font file in the `examples/` folder
2. Edit `examples-manifest.json` and add a new entry:

```json
{
    "source": "examples/YourFont.babelfont",
    "destination": "/user/YourFont.babelfont",
    "description": "Description of your font"
}
```

The destination should typically be in `/user/` folder so users can easily find and open them.

## Current Examples

- **Fustat.babelfont** - Arabic font example (automatically copied to `/user/Fustat.babelfont`)

## Notes

- Files are copied only once on app load (not saved to browser storage)
- Large files are handled efficiently using binary transfer
- If a manifest or example file is missing, loading continues without error
- The file browser automatically refreshes after examples are loaded
