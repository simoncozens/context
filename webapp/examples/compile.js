#!/usr/bin/env node
/**
 * Command-line tool to compile .babelfont files to TTF using fontc WASM
 * 
 * Usage:
 *   node compile-babelfont.js <input.babelfont> [output.ttf]
 *   node compile-babelfont.js path/to/font.babelfont
 *   node compile-babelfont.js path/to/font.babelfont custom-output.ttf
 */

const fs = require('fs');
const path = require('path');

async function compileBabelfont(inputPath, outputPath, options = {}) {
    console.log('🔧 Babelfont → TTF Compiler');
    console.log('='.repeat(60));
    console.log('');

    try {
        // Validate input file
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file not found: ${inputPath}`);
        }

        if (!inputPath.endsWith('.babelfont')) {
            console.warn('⚠️  Warning: Input file does not have .babelfont extension');
        }

        // Determine output path
        if (!outputPath) {
            const baseName = path.basename(inputPath, '.babelfont');
            outputPath = path.join(path.dirname(inputPath), `${baseName}.ttf`);
        }

        console.log(`📖 Input:  ${inputPath}`);
        console.log(`💾 Output: ${outputPath}`);
        console.log('');

        // Import the WASM module
        console.log('⚙️  Loading WASM module...');
        const wasmModulePath = path.join(__dirname, '..', 'wasm-dist', 'babelfont_fontc_web.js');
        const wasmModule = await import(wasmModulePath);

        // Load the WASM binary file
        const wasmPath = path.join(__dirname, '..', 'wasm-dist', 'babelfont_fontc_web_bg.wasm');
        const wasmBinary = fs.readFileSync(wasmPath);

        // Initialize the WASM module
        await wasmModule.default(wasmBinary);

        console.log(`✅ WASM module loaded (version: ${wasmModule.version()})`);
        console.log('');

        // Load the babelfont file
        console.log('📖 Reading babelfont file...');
        const babelfontJson = fs.readFileSync(inputPath, 'utf-8');
        const inputSize = (babelfontJson.length / 1024).toFixed(2);
        console.log(`✅ Loaded ${inputSize} KB of JSON`);

        // Validate JSON
        try {
            JSON.parse(babelfontJson);
            console.log('✅ JSON is valid');
        } catch (jsonError) {
            throw new Error(`Invalid JSON in babelfont file: ${jsonError.message}`);
        }
        console.log('');

        // Compile
        console.log('🔨 Compiling font...');
        const startTime = Date.now();

        let ttfBytes;
        try {
            ttfBytes = wasmModule.compile_babelfont(babelfontJson, options);
        } catch (compileError) {
            throw new Error(`Compilation failed: ${compileError}`);
        }

        const duration = Date.now() - startTime;

        console.log(`✅ Compilation successful! (${duration}ms)`);
        console.log(`📊 Input:  ${inputSize} KB`);
        console.log(`📊 Output: ${(ttfBytes.length / 1024).toFixed(2)} KB`);
        console.log('');

        // Save the output
        console.log('💾 Writing TTF file...');
        fs.writeFileSync(outputPath, ttfBytes);
        const outputStats = fs.statSync(outputPath);
        console.log(`✅ Saved ${(outputStats.size / 1024).toFixed(2)} KB to: ${outputPath}`);
        console.log('');
        console.log('='.repeat(60));
        console.log('✨ Done!');

        return 0;

    } catch (error) {
        console.error('');
        console.error('❌ Error:', error.message);
        if (error.stack && process.env.DEBUG) {
            console.error('');
            console.error('Stack trace:');
            console.error(error.stack);
        }
        console.error('');
        console.error('='.repeat(60));
        return 1;
    }
}

function help() {
    console.log('Usage: node compile-babelfont.js [options] <input.babelfont> [output.ttf]');
    console.log('');
    console.log('Arguments:');
    console.log('  --skip-kerning               Skip kerning table generation');
    console.log('  --skip-features              Skip OpenType feature compilation');
    console.log('  --skip-metrics               Skip metrics compilation');
    console.log('  --skip-outlines              Skip outlines (glyf/gvar table generation)');
    console.log('  --dont-use-production-names  Do not use production glyph names');
    console.log('  --subset-glyphs name1,name2  Comma-separated list of glyph names to include');
    console.log('');
    console.log('Positional arguments:');
    console.log('  input.babelfont   Path to the input .babelfont file (required)');
    console.log('  output.ttf        Path to the output .ttf file (optional)');
    console.log('                    If not specified, will use input basename with .ttf extension');
    console.log('');
    console.log('Examples:');
    console.log('  node compile-babelfont.js font.babelfont');
    console.log('  node compile-babelfont.js font.babelfont output.ttf');
    console.log('  node compile-babelfont.js ../webapp/examples/Fustat.babelfont');
    console.log('');
    console.log('Environment:');
    console.log('  DEBUG=1           Show full stack traces on error');
    process.exit(0);
}


// Parse command line arguments
function main() {
    let options = {
        skip_kerning: false,
        skip_features: false,
        skip_metrics: false,
        skip_outlines: false,
        dont_use_production_names: false,
        subset_glyphs: [],
    }
    let filename_args = [];
    let i = 2;
    while (i < process.argv.length) {
        const arg = process.argv[i];
        if (arg === '--skip-kerning') {
            options.skip_kerning = true;
        } else if (arg === '--skip-features') {
            options.skip_features = true;
        } else if (arg === '--skip-metrics') {
            options.skip_metrics = true;
        } else if (arg === '--skip-outlines') {
            options.skip_outlines = true;
        } else if (arg === '--dont-use-production-names') {
            options.dont_use_production_names = true;
        } else if (arg === '--subset-glyphs') {
            i++;
            if (i < process.argv.length) {
                options.subset_glyphs = process.argv[i].split(',');
            } else {
                console.error('Error: --subset-glyphs requires a comma-separated list of glyph names');
                process.exit(1);
            }
        } else if (arg === '--help' || arg === '-h') {
            help();
            process.exit(0);
        } else if (!arg.startsWith('--')) {
            filename_args.push(arg);
        }

        i++;
    }
    if (filename_args.length < 1) {
        console.error('Error: No input file specified');
        help();
        process.exit(1);
    }

    const inputPath = path.resolve(filename_args[0]);
    const outputPath = filename_args[1] ? path.resolve(filename_args[1]) : null;
    console.log('Options:', options);
    console.log('Input path:', inputPath);
    console.log('Output path:', outputPath);
    console.log('');


    compileBabelfont(inputPath, outputPath, options).then(exitCode => {
        process.exit(exitCode);
    });
}

main();
