# Test script for auto-compilation
# Copy and paste this into the Konsole in the web app

print("Testing auto-compilation...")
print("")

# Get the current font
font = CurrentFont()
print(f"Font loaded: {font.names.familyName.get_default()}")

# Check initial dirty state
from context import DIRTY_COMPILE

print(f"Initial DIRTY_COMPILE state: {font.is_dirty(DIRTY_COMPILE)}")
print("")

# Make a simple change to trigger dirty tracking
print("Making a change to glyph width...")
glyph = font.glyphs[0]
original_width = glyph.width
print(f"Original width: {original_width}")

# Change the width
glyph.width += 100
print(f"New width: {glyph.width}")

# Check dirty state after change
print(f"DIRTY_COMPILE state after change: {font.is_dirty(DIRTY_COMPILE)}")
print("")

print("✓ Change made! Watch the console for auto-compilation messages.")
print("  You should see:")
print("  - ⏱️ Auto-compile scheduled (1 second delay)")
print("  - After 1 second: 🔄 Font data changed, auto-compiling...")
print("  - Then: ✅ Compiled successfully")
