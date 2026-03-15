# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Dibs is a Figma plugin for designing garden beds using the Square Foot Gardening (SFG) method.

## Development Workflow

There is no build system — this is vanilla JavaScript with no dependencies, no npm, and no compilation step.

**To develop:**
1. Edit `code.js` (plugin backend) and/or `ui.html` (plugin UI)
2. In Figma, go to Plugins → Development → your plugin
3. Changes are picked up on the next plugin run (no hot reload — re-run to see changes)

**To regenerate the icon:** Open `make-icon.html` in a browser; it downloads a new `icon.png`.

**To load in Figma:** Plugins → Development → Import plugin from manifest → select `manifest.json`

## Architecture

The plugin follows the standard Figma plugin two-file architecture:

- **`code.js`** — Plugin backend. Runs in Figma's sandbox with full access to the Figma scene graph. No DOM access.
- **`ui.html`** — Plugin UI. Runs in an iframe with DOM access but no direct Figma API access.

Communication between the two is exclusively via message passing:
- Plugin → UI: `figma.ui.postMessage(msg)`
- UI → Plugin: `parent.postMessage({ pluginMessage: msg }, '*')`
- Plugin receives: `figma.ui.onmessage = (msg) => { ... }`

### Message types

| Direction | Type | Payload |
|-----------|------|---------|
| UI → Plugin | `create-bed` | `{ width, height, name }` |
| UI → Plugin | `assign-plant` | `{ plant }` |
| UI → Plugin | `clear-plant` | — |
| UI → Plugin | `request-selection` | — |
| UI → Plugin | `save-custom-plants` | `{ plants }` |
| UI → Plugin | `resize` | `{ height }` |
| Plugin → UI | `bed-created` | — |
| Plugin → UI | `selection` | `{ isBedCell, plant, count }` |
| Plugin → UI | `custom-plants` | `{ plants }` |

### Figma scene structure

A garden bed is a **Frame** containing **Rectangles** (cells) and **Text** nodes (plant labels):

```
Frame (garden bed)
├── Rectangle (cell at row=0, col=0)  ← pluginData: isBedCell, plant, row, col
├── Rectangle (cell at row=0, col=1)
├── Text (label for cell 0,0)         ← locked=true, pluginData: bedCellLabel
└── ...
```

Plugin data keys stored on nodes: `isBedCell`, `plant` (JSON), `row`, `col`, `bedCellLabel`.

### Persistence

Custom plants are saved to `figma.clientStorage` (device-local, key-value). They are loaded on plugin startup and sent to the UI via the `custom-plants` message.

### Key constants

- `CELL_SIZE = 96` — pixels per square foot cell
- `GAP = 4` — pixels between cells
- UI panel: 340×560px default, resizable to 300–900px height via drag handle

### Plant database

`ui.html` contains a `PLANTS` array of 39 built-in plants across 8 categories (Fruiting Veg, Brassicas, Greens, Root Veg, Alliums, Legumes, Herbs, Companions). Each plant has: `name`, `emoji`, `color` (hex), `category`, `perSquare`, `note`.
