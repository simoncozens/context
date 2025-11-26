"""
Debug script for auto-compilation issue.
Run this in the browser's Python console to diagnose why auto-compilation
stops working after the first edit.

Copy and paste this entire script into the Python console, then follow the
instructions at the bottom.
"""

from context import DIRTY_COMPILE


def diagnose_auto_compile():
    """Comprehensive diagnostic of auto-compilation system."""

    print("=" * 60)
    print("AUTO-COMPILE DIAGNOSTIC")
    print("=" * 60)

    font = CurrentFont()
    if not font:
        print("❌ No font loaded")
        return

    # 1. Check Font-level dirty flags
    print("\n📦 FONT-LEVEL DIRTY FLAGS")
    print(f"  _dirty_flags keys: {list(font._dirty_flags.keys())}")
    print(f"  DIRTY_COMPILE exists: {DIRTY_COMPILE in font._dirty_flags}")
    if DIRTY_COMPILE in font._dirty_flags:
        print(f"  DIRTY_COMPILE value: {font._dirty_flags[DIRTY_COMPILE]}")
        print(f"  is_dirty(DIRTY_COMPILE): {font.is_dirty(DIRTY_COMPILE)}")
    else:
        print("  ⚠️ DIRTY_COMPILE not in font._dirty_flags!")

    # 2. Check Glyph-level dirty flags
    if font.glyphs:
        glyph = list(font.glyphs.values())[0]
        print(f"\n📝 GLYPH-LEVEL DIRTY FLAGS (glyph '{glyph.name}')")
        print(f"  _dirty_flags keys: {list(glyph._dirty_flags.keys())}")
        print(f"  DIRTY_COMPILE exists: {DIRTY_COMPILE in glyph._dirty_flags}")
        if DIRTY_COMPILE in glyph._dirty_flags:
            print(f"  DIRTY_COMPILE value: {glyph._dirty_flags[DIRTY_COMPILE]}")
        else:
            print("  ⚠️ DIRTY_COMPILE not in glyph._dirty_flags!")

        # 3. Check Layer-level dirty flags
        if glyph.layers:
            layer = glyph.layers[0]
            print(f"\n📐 LAYER-LEVEL DIRTY FLAGS")
            print(f"  _dirty_flags keys: {list(layer._dirty_flags.keys())}")
            print(f"  DIRTY_COMPILE exists: {DIRTY_COMPILE in layer._dirty_flags}")
            if DIRTY_COMPILE in layer._dirty_flags:
                print(f"  DIRTY_COMPILE value: {layer._dirty_flags[DIRTY_COMPILE]}")
            else:
                print("  ⚠️ DIRTY_COMPILE not in layer._dirty_flags!")

    print("\n" + "=" * 60)
    print("DIAGNOSIS COMPLETE")
    print("=" * 60)

    # Provide recommendations
    print("\n💡 RECOMMENDATIONS:")

    has_compile_at_font = DIRTY_COMPILE in font._dirty_flags
    has_compile_at_glyph = (
        (DIRTY_COMPILE in glyph._dirty_flags) if font.glyphs else False
    )
    has_compile_at_layer = (
        (DIRTY_COMPILE in layer._dirty_flags) if font.glyphs and glyph.layers else False
    )

    if not has_compile_at_font:
        print("  1. Font is missing DIRTY_COMPILE - run fix_font_dirty_flags()")
    if not has_compile_at_glyph:
        print("  2. Glyphs are missing DIRTY_COMPILE - run fix_all_dirty_flags()")
    if not has_compile_at_layer:
        print("  3. Layers are missing DIRTY_COMPILE - run fix_all_dirty_flags()")

    if has_compile_at_font and has_compile_at_glyph and has_compile_at_layer:
        print("  ✅ All objects have DIRTY_COMPILE context!")
        print("  Try making an edit now and wait 1 second for auto-compile.")
    else:
        print("\n  Run fix_all_dirty_flags() to patch all objects, then test again.")


def fix_font_dirty_flags():
    """Quick fix: Add DIRTY_COMPILE to font only."""
    font = CurrentFont()
    if not font:
        print("❌ No font loaded")
        return

    if DIRTY_COMPILE not in font._dirty_flags:
        font._dirty_flags[DIRTY_COMPILE] = False
        print("✅ Added DIRTY_COMPILE to font._dirty_flags")
    else:
        print("✅ Font already has DIRTY_COMPILE")


def fix_all_dirty_flags():
    """Comprehensive fix: Recursively add DIRTY_COMPILE to all objects."""
    font = CurrentFont()
    if not font:
        print("❌ No font loaded")
        return

    count = 0

    def add_compile_context(obj, obj_type="object"):
        nonlocal count
        if hasattr(obj, "_dirty_flags") and obj._dirty_flags is not None:
            if DIRTY_COMPILE not in obj._dirty_flags:
                obj._dirty_flags[DIRTY_COMPILE] = False
                count += 1

    # Fix font
    add_compile_context(font, "Font")

    # Fix all glyphs and their layers
    if font.glyphs:
        for glyph in font.glyphs.values():
            add_compile_context(glyph, "Glyph")
            if hasattr(glyph, "layers") and glyph.layers:
                for layer in glyph.layers:
                    add_compile_context(layer, "Layer")

    # Fix masters
    if hasattr(font, "masters") and font.masters:
        for master in font.masters:
            add_compile_context(master, "Master")

    # Fix instances
    if hasattr(font, "instances") and font.instances:
        for instance in font.instances:
            add_compile_context(instance, "Instance")

    print(f"✅ Added DIRTY_COMPILE to {count} objects")
    print("   Auto-compilation should now work for all edits!")


def test_propagation():
    """Test if editing a layer properly propagates DIRTY_COMPILE to font."""
    font = CurrentFont()
    if not font or not font.glyphs:
        print("❌ No font or glyphs loaded")
        return

    glyph = list(font.glyphs.values())[0]
    if not glyph.layers:
        print("❌ No layers in glyph")
        return

    layer = glyph.layers[0]

    print("\n🧪 TESTING PROPAGATION")
    print("=" * 60)

    # Mark font clean first
    if DIRTY_COMPILE in font._dirty_flags:
        font.mark_clean(DIRTY_COMPILE)
        print(f"✅ Marked font clean for DIRTY_COMPILE")

    print(f"\nBefore edit:")
    print(
        f"  Font is_dirty(DIRTY_COMPILE): {font.is_dirty(DIRTY_COMPILE) if DIRTY_COMPILE in font._dirty_flags else 'N/A'}"
    )
    print(f"  Layer width: {layer.width}")

    # Make an edit
    print(f"\n⚡ Editing layer.width += 100")
    layer.width += 100

    print(f"\nAfter edit:")
    print(f"  Layer width: {layer.width}")
    print(
        f"  Layer is_dirty(DIRTY_COMPILE): {layer.is_dirty(DIRTY_COMPILE) if DIRTY_COMPILE in layer._dirty_flags else 'N/A'}"
    )
    print(
        f"  Font is_dirty(DIRTY_COMPILE): {font.is_dirty(DIRTY_COMPILE) if DIRTY_COMPILE in font._dirty_flags else 'N/A'}"
    )

    print("\n" + "=" * 60)

    if DIRTY_COMPILE not in font._dirty_flags:
        print("❌ Font doesn't have DIRTY_COMPILE context - run fix_all_dirty_flags()")
    elif not font.is_dirty(DIRTY_COMPILE):
        print("❌ Font is NOT dirty after edit - propagation failed!")
        print("   This means child objects are missing DIRTY_COMPILE context.")
        print("   Run fix_all_dirty_flags() to fix.")
    else:
        print("✅ Font is dirty after edit - propagation works!")
        print("   Auto-compilation should trigger in 1 second.")


# Run the diagnostic automatically
print("\n" + "█" * 60)
print("AUTO-COMPILE DIAGNOSTIC TOOL")
print("█" * 60)
print("\nAvailable functions:")
print("  diagnose_auto_compile()  - Show current state of dirty flags")
print("  fix_font_dirty_flags()   - Quick fix for font only")
print("  fix_all_dirty_flags()    - Comprehensive fix for all objects")
print("  test_propagation()       - Test if editing propagates to font")
print("\nRunning automatic diagnosis...")
print()

diagnose_auto_compile()
