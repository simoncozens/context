#!/bin/bash
# Update all Rust components and rebuild WASM runtime
# This script updates Rust toolchains, wasm-pack, and Cargo dependencies,
# then rebuilds the fontc WASM module

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WASM_DIR="$SCRIPT_DIR/babelfont-fontc-build"

echo "🔄 Updating all Rust components and rebuilding WASM runtime"
echo "============================================================"
echo ""

# Step 1: Update Rust toolchains
echo "📦 Step 1/4: Updating Rust toolchains..."
echo ""
rustup update

if [ $? -ne 0 ]; then
    echo "❌ Failed to update Rust toolchains"
    exit 1
fi

echo ""
echo "✅ Rust toolchains updated"
echo ""

# Step 2: Update wasm-pack
echo "📦 Step 2/4: Updating wasm-pack..."
echo ""
cargo install wasm-pack --force

if [ $? -ne 0 ]; then
    echo "❌ Failed to update wasm-pack"
    exit 1
fi

echo ""
echo "✅ wasm-pack updated"
echo ""

# Step 3: Update Cargo dependencies
echo "📦 Step 3/4: Updating Cargo dependencies..."
echo ""

if [ ! -d "$WASM_DIR" ]; then
    echo "❌ Directory not found: $WASM_DIR"
    echo "   Please run ./build-fontc-wasm.sh first to create the project"
    exit 1
fi

cd "$WASM_DIR"
cargo update

if [ $? -ne 0 ]; then
    echo "❌ Failed to update Cargo dependencies"
    exit 1
fi

echo ""
echo "✅ Cargo dependencies updated"
echo ""

# Step 4: Rebuild WASM module
echo "📦 Step 4/4: Rebuilding WASM module..."
echo ""
cd "$SCRIPT_DIR"
./build-fontc-wasm.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to rebuild WASM module"
    exit 1
fi

echo ""
echo "============================================================"
echo "✅ All updates complete!"
echo ""
echo "Summary:"
echo "  - Rust toolchains: $(rustc --version)"
echo "  - wasm-pack: $(wasm-pack --version)"
echo "  - WASM module: rebuilt and ready"
echo ""
echo "🚀 You can now test your application"
