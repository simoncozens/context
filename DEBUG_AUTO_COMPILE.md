# Debugging Auto-Compilation

Follow these steps in the browser console to debug why auto-compilation isn't triggering.

## Step 1: Check if auto-compile manager loaded

Open browser console (F12) and type:

```javascript
autoCompileManager
```

**Expected**: Should show an object with methods: `checkAndSchedule`, `setEnabled`, `scheduleCompilation`, `testDirtyCheck`, `getStatus`

**If undefined**: The script didn't load. Check:
- Network tab for 404 errors
- Console for JavaScript errors during page load
- Hard refresh the page (Cmd+Shift+R)

## Step 2: Check module status

```javascript
autoCompileManager.getStatus()
```

**Expected**: `{ isEnabled: true, hasPendingCompile: false }`

## Step 3: Check if afterPythonExecution is defined

```javascript
window.afterPythonExecution
```

**Expected**: Should show a function

## Step 4: Test dirty check manually

**IMPORTANT**: First load a font using the file browser!

After loading a font, type in browser console:

```javascript
await autoCompileManager.testDirtyCheck()
```

**Expected output**:
```
🧪 Manual dirty check test...
Font: <your font name>
DIRTY_COMPILE: false
```

**If you see "No font loaded"**: Load a font from the file browser first.

## Step 5: Make a change in Python console

In the **Konsole** (Python terminal), run:

```python
font = CurrentFont()
font.glyphs[0].width += 100
```

**Watch the browser console for**:
- `🔓 UI updates resumed (Python execution finished)` - from python-ui-sync.js
- `🔄 Checking for auto-compilation...` - should appear right after
- `⏱️ Auto-compile scheduled (1 second delay)` - from auto-compile-manager.js

## Step 6: Check dirty state after change

Immediately after the change, in browser console:

```javascript
await autoCompileManager.testDirtyCheck()
```

**Expected**: `DIRTY_COMPILE: true`

## Step 7: Watch for auto-compilation

After 1 second, you should see:
- `🔍 Checking if font is dirty for compilation...`
- `🔄 Font data changed, auto-compiling...`
- Then compilation messages

## Common Issues

### Issue: "afterPythonExecution is undefined"
**Fix**: The python-ui-sync.js script didn't load. Hard refresh.

### Issue: "autoCompileManager is undefined"  
**Fix**: The auto-compile-manager.js script didn't load. Check network tab.

### Issue: "Pyodide not loaded"
**Fix**: Wait for Pyodide to initialize completely before testing.

### Issue: No console output after Python execution
**Problem**: The execution wrapper isn't calling afterPythonExecution()
**Debug**: 
```javascript
// Check if wrapper is installed
window.pyodide._originalRunPythonAsync
```
Should show a function. If undefined, the wrapper didn't install.

### Issue: DIRTY_COMPILE stays false after changes
**Problem**: The dirty tracking isn't working
**Debug in Python**:
```python
from context import DIRTY_COMPILE
font = CurrentFont()
print("Before change:", font.is_dirty(DIRTY_COMPILE))
font.glyphs[0].width += 100
print("After change:", font.is_dirty(DIRTY_COMPILE))
```

Both should print the same state, which means changes aren't being tracked. This is the real issue!

### Issue: Timer scheduled but no compilation
**Debug**:
```javascript
// After making a change, check status
autoCompileManager.getStatus()
// Should show hasPendingCompile: true

// Wait 2 seconds, check again
setTimeout(() => console.log(autoCompileManager.getStatus()), 2000)
// Should show hasPendingCompile: false (already executed)
```

## Manual Force Trigger

To manually trigger auto-compilation checking:

```javascript
autoCompileManager.checkAndSchedule()
```

This immediately schedules a check (with 1-second delay).

## Enable/Disable

```javascript
// Disable
autoCompileManager.setEnabled(false)

// Enable
autoCompileManager.setEnabled(true)
```
