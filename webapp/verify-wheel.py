# Quick verification script - run in browser Python console
# Checks if the new wheel with mark_clean fix is loaded

import inspect
from context import Font

# Get mark_clean source code
source = inspect.getsource(Font.mark_clean)

print("=" * 60)
print("CHECKING mark_clean() IMPLEMENTATION")
print("=" * 60)

if "self._dirty_flags[context] = False" in source:
    print("✅ NEW CODE LOADED: mark_clean sets flag to False")
    print("   Dirty flags will persist after mark_clean()")
elif "self._dirty_flags.pop(context, None)" in source:
    print("❌ OLD CODE LOADED: mark_clean removes flag")
    print("   You need to reload the browser completely!")
    print("\n   Steps to reload:")
    print("   1. Close ALL browser tabs")
    print("   2. Clear browser cache (Cmd+Shift+Delete)")
    print("   3. Reopen font editor")
    print("   4. Load your font again")
else:
    print("⚠️ UNKNOWN IMPLEMENTATION")
    print("\nShowing mark_clean source:")
    print(source)

print("=" * 60)
