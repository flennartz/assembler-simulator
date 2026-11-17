# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser-based simulator for a simplified 8-bit, x86-like CPU with a NASM-style assembler (4 GPRs A–D plus SP, 256 bytes of memory, memory-mapped console output). Built with AngularJS 1.3 (loaded from CDN) and no backend; it is hosted as a static GitHub Pages site. Used for teaching (Hochschule Rhein-Waal fork of Marco Schweighauser's original).

## Build

```bash
npm install
npm run build  # grunt: jshint + concat + uglify (grunt-cli is a local devDependency)
npm run watch  # re-run jshint + concat on changes to src/
```

- Grunt concatenates `src/app.js` first, then all of `src/**/*.js`, into `assets/asmsimulator.js`, and minifies it to `assets/asmsimulator.min.js`.
- **`index.html` loads `assets/asmsimulator.js` (the built file), not `src/`.** After editing anything in `src/`, rebuild and commit the regenerated `assets/` files too, otherwise the live site does not change.
- There is no test suite. Verify changes by serving the folder over HTTP (e.g. `python -m http.server`; `file://` does not load the scripts in the browser pane), assembling a program, and stepping/running it. The built-in examples in `controller.js` (Hallo Welt, Countdown, 6·7) are a quick regression check: each must end at HLT with its output.
- `assets/style.css` is hand-written (not built). No Bootstrap: all styles are scoped under `#asm-sim`, modelled on the sibling project gdi-turingmaschine.

## UI and language conventions

- The UI, example programs, and all user-facing error messages (thrown as strings in `asm.js`, `cpu.js`, `memory.js`) are **German**. Code identifiers and code comments stay English.
- The page is embedded in Moodle via iframe. Avoid anything that scrolls the parent page: no `scrollIntoView` during stepping, focus the textarea with `{preventScroll: true}` (see `select-line.directive.js`).
- The instruction reference lives in `index.html` inside `<details id="befehlssatz">`; `instruction-set.html` is only a redirect to `index.html#befehlssatz`.

## Architecture

All code registers onto a single Angular module `app` (`ASMSimulator`) defined in `src/app.js`; the other files rely on that global, which is why concat order matters.

- `src/emulator/opcodes.js` — the opcode-number table (e.g. `MOV_REG_TO_REG: 1`). Shared contract between assembler and CPU.
- `src/assembler/asm.js` — `assembler.go(text)`: a regex-based line parser that emits a flat byte array (`code`), a `mapping` from memory address to source line, and a `labels` table. Each mnemonic picks the opcode variant from operand types (register / `[address]` / `[reg±offset]` / number). Labels are resolved in a second pass. `DB` emits raw data.
- `src/emulator/cpu.js` — `cpu.step()`: fetch-decode-execute via a large `switch` on opcodes; maintains `ip`, `sp`, `gpr[4]`, and `zero`/`carry`/`fault` flags. Indirect register operands are encoded in one byte as `reg + 8*offset` (offset is 5-bit signed, −16..15).
- `src/emulator/memory.js` — 256-byte memory with bounds-checked `load`/`store` and `lastAccess` tracking for UI highlighting.
- `src/ui/controller.js` — the `Ctrl` controller wiring the UI (assemble, run with speed timer, step, reset, breakpoints/line selection, memory-cell styling) plus the example programs and status messages (`error`, `warning`, `info`). Other files in `src/ui/` are small filters/directives.

Memory layout conventions (keep consistent across `cpu.js`, `controller.js`, docs, and example programs): stack grows down from `maxSP = 231`; addresses **232–255** are the console output area rendered as characters.

### Adding or changing an instruction

Touch all of these together:
1. `src/emulator/opcodes.js` — add opcode number(s) for each operand variant.
2. `src/assembler/asm.js` — parse the mnemonic and emit the right opcode/operands.
3. `src/emulator/cpu.js` — implement the `case` in `step()` (including flag handling via `checkOperation`).
4. `index.html` — the instruction reference table in the `#befehlssatz` section (German).
5. Rebuild with `npm run build`.
