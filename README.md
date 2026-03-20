# Dibs

A Figma plugin for designing garden beds using the [Square Foot Gardening](https://squarefootgardening.org/) (SFG) method.

Plan raised beds, assign plants from a curated library, and export a CSV plant list to take to the nursery.

---

## Install

### From source (development)

1. Clone this repo
2. Open Figma
3. Go to **Plugins** → **Development** → **Import plugin from manifest**
4. Select the `manifest.json` file in this repo

---

## Usage

1. Open the plugin via **Plugins** → **Dibs**
2. Set your bed dimensions (in feet) and click **Create Bed**
3. Click a cell to select it, then pick a plant from the panel to assign it
4. Repeat across beds, then click **Export CSV** to download your plant list

---

## Features

- **39 built-in plants** across 8 categories (Fruiting Veg, Brassicas, Greens, Root Veg, Alliums, Legumes, Herbs, Companions)
- **Custom plants** — add your own with a name, emoji, color, and spacing; saved to your device
- **Color-coded cells** — each assigned plant fills its cell with a color, emoji, and label
- **CSV export** — plant name, cell count, total quantity, and growing notes

---

## Development

No build step. Edit `code.js` and `ui.html` directly, then re-run the plugin in Figma to see changes.

See `CLAUDE.md` for architecture details.
