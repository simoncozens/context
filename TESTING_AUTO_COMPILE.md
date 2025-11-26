# Testing Auto-Compilation After Data Changes

This document explains how to verify that the auto-compilation feature is working correctly.

## Recent Fixes

**2024-11-26**: Fixed auto-compilation not triggering after data changes:
- Added `DIRTY_COMPILE` context to `initialize_dirty_tracking()` in Font.py
- Font is now marked clean for `DIRTY_COMPILE` when loaded (matching `DIRTY_FILE_SAVING`)
- Enhanced logging in `auto-compile-manager.js` and `python-ui-sync.js` for better debugging
- Auto-compile manager now reports errors with traceback when checking dirty state

## What It Does

When you edit font data via Python (without using the UI), the font will automatically recompile 1 second after you stop making changes. This uses the `DIRTY_COMPILE` flag to track changes and avoid race conditions.

## How to Test

### 1. Open the Web App

Start the web app and open a font file:

```bash
cd context-font-editor/webapp
python serve-with-cors.py
```

Then open `http://localhost:8000` in Chrome, Firefox, or Safari.

### 2. Open a Font

Use the file browser to open any font file (`.glyphs`, `.designspace`, `.ufo`, or `.context`).

### 3. Watch the Console

Open your browser's Developer Console (F12 or Cmd+Option+I) and watch for these messages:

- `⏱️ Auto-compile scheduled (1 second delay)` - Timer started
- `⏱️ Auto-compile timer reset (waiting for inactivity)` - Timer reset by another edit
- `🔄 Font data changed, auto-compiling...` - Compilation started
- `✓ Font is clean, no auto-compilation needed` - No changes detected

### 4. Make Changes via Python

In the Konsole (Python terminal in the web app), run commands that modify font data:

#### Test 1: Change glyph width
```python
font = CurrentFont()
font.glyphs[0].width += 100
```

**Expected result:**
- After 1 second of inactivity, you should see:
  - Console: `🔄 Font data changed, auto-compiling...`
  - Terminal: `🔄 Auto-compiling font after data change...`
  - Then: `✅ Compiled successfully in Xms`

#### Test 2: Multiple rapid changes (debouncing)
```python
font = CurrentFont()
for i in range(5):
    font.glyphs[0].width += 10
```

**Expected result:**
- Console shows timer being reset multiple times
- Only ONE compilation happens, 1 second after the last change

#### Test 3: Change anchor positions
```python
font = CurrentFont()
glyph = font.glyphs[0]
for layer in glyph.layers:
    for anchor in layer.anchors:
        anchor.x += 50
        anchor.y += 50
```

**Expected result:**
- Auto-compilation triggers after 1 second

#### Test 4: Change node coordinates
```python
font = CurrentFont()
glyph = font.glyphs[0]
for layer in glyph.layers:
    for shape in layer.shapes:
        for node in shape.nodes:
            node.x += 10
            node.y += 10
```

**Expected result:**
- Auto-compilation triggers after 1 second

### 5. Disable/Enable Auto-Compilation

You can control auto-compilation from the browser console:

```javascript
// Disable auto-compilation
autoCompileManager.setEnabled(false)

// Enable auto-compilation
autoCompileManager.setEnabled(true)

// Manually trigger a check (useful for testing)
autoCompileManager.checkAndSchedule()
```

## What Gets Marked Dirty

The following operations mark the font as dirty for compilation (`DIRTY_COMPILE`):

- Changing any property on font objects (glyphs, layers, shapes, nodes, anchors, etc.)
- Modifying glyph widths, heights
- Changing node coordinates
- Changing anchor positions
- Modifying master metrics
- Editing format_specific data
- Any other data changes via the Python object model

## Debugging

If auto-compilation isn't working:

1. **Check browser console** for error messages
2. **Verify auto-compile manager loaded**: In console, type `autoCompileManager` - should show an object
3. **Check if it's enabled**: Type `autoCompileManager.setEnabled(true)`
4. **Manually check dirty state**: In Python console:
   ```python
   from context import DIRTY_COMPILE
   font = CurrentFont()
   print(font.is_dirty(DIRTY_COMPILE))  # Should be True after changes
   ```
5. **Force a check**: In browser console: `autoCompileManager.checkAndSchedule()`

## Technical Details

- **Debounce delay**: 1 second (configurable in `auto-compile-manager.js`)
- **Dirty tracking context**: `DIRTY_COMPILE`
- **Race condition prevention**: Uses dirty flags, not time-based checks
- **Propagation**: Changes propagate up to the font object automatically
- **Cleanup**: Font is marked clean after successful compilation

## Notes

- Auto-compilation only happens when editing via Python, not when using the compile button manually
- The 1-second delay ensures rapid changes don't cause excessive compilations
- Changes made via Python scripts in the script editor also trigger auto-compilation
- The compile button still works manually at any time
