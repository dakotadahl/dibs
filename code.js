// Garden Planner — FigJam/Figma Plugin
// Each square foot cell is CELL_SIZE px wide/tall.

const CELL_SIZE = 96;
const GAP = 4;

figma.showUI(__html__, { width: 340, height: 560, title: "Garden Planner" });

// Load saved custom plants and send to UI once it's ready
figma.clientStorage.getAsync("customPlants").then((stored) => {
  figma.ui.postMessage({ type: "custom-plants", plants: stored || [] });
});

// ─── Selection change ────────────────────────────────────────────────────────

figma.on("selectionchange", () => {
  sendSelectionInfo();
});

// ─── Message handler ─────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "create-bed":
      await createGardenBed(msg.width, msg.height, msg.name);
      break;
    case "assign-plant":
      await assignPlantToSelected(msg.plant);
      break;
    case "clear-plant":
      await clearSelectedCells();
      break;
    case "request-selection":
      sendSelectionInfo();
      break;
    case "save-custom-plants":
      await figma.clientStorage.setAsync("customPlants", msg.plants);
      break;
    case "resize":
      figma.ui.resize(340, Math.round(msg.height));
      break;
    case "export-csv":
      exportPlantCsv();
      break;
  }
};

// ─── Selection info ───────────────────────────────────────────────────────────

function sendSelectionInfo() {
  const sel = figma.currentPage.selection;
  const cells = sel.filter((n) => n.getPluginData("isBedCell") === "true");

  if (cells.length > 0) {
    const first = cells[0];
    const plant = JSON.parse(first.getPluginData("plant") || "{}");
    figma.ui.postMessage({
      type: "selection",
      isBedCell: true,
      plant: plant.name ? plant : null,
      count: cells.length,
    });
  } else {
    figma.ui.postMessage({ type: "selection", isBedCell: false });
  }
}

// ─── Create garden bed ────────────────────────────────────────────────────────

async function createGardenBed(widthFt, heightFt, bedName) {
  const totalW = widthFt * CELL_SIZE;
  const totalH = heightFt * CELL_SIZE;

  // Outer bed frame (visual container — double-click to enter, then single-click cells)
  const bed = figma.createFrame();
  bed.name = bedName || `Garden Bed ${widthFt}×${heightFt}ft`;
  bed.resize(totalW, totalH);
  bed.fills = [{ type: "SOLID", color: hexToRgb("#3D2008") }];
  bed.cornerRadius = 8;
  bed.clipsContent = true;
  bed.setPluginData("isGardenBed", "true");
  bed.setPluginData("widthFt", String(widthFt));
  bed.setPluginData("heightFt", String(heightFt));

  // Cells are Rectangles (leaf nodes) — no "enter" behavior, single-click to select
  for (let row = 0; row < heightFt; row++) {
    for (let col = 0; col < widthFt; col++) {
      const cell = figma.createRectangle();
      cell.name = `${col + 1},${row + 1}`;
      cell.x = col * CELL_SIZE + GAP;
      cell.y = row * CELL_SIZE + GAP;
      cell.resize(CELL_SIZE - GAP * 2, CELL_SIZE - GAP * 2);
      cell.fills = [{ type: "SOLID", color: hexToRgb("#C4956A") }];
      cell.cornerRadius = 3;

      cell.setPluginData("isBedCell", "true");
      cell.setPluginData("plant", JSON.stringify({ name: null }));
      cell.setPluginData("row", String(row + 1));
      cell.setPluginData("col", String(col + 1));

      bed.appendChild(cell);
    }
  }

  // Center in viewport
  const center = figma.viewport.center;
  bed.x = Math.round(center.x - totalW / 2);
  bed.y = Math.round(center.y - totalH / 2);

  figma.viewport.scrollAndZoomIntoView([bed]);
  figma.currentPage.selection = [bed];

  figma.ui.postMessage({ type: "bed-created" });
}

// ─── Assign plant ─────────────────────────────────────────────────────────────

async function assignPlantToSelected(plant) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const cells = figma.currentPage.selection.filter(
    (n) => n.getPluginData("isBedCell") === "true" && n.type === "RECTANGLE"
  );

  if (cells.length === 0) return;

  for (const cell of cells) {
    const row      = cell.getPluginData("row");
    const col      = cell.getPluginData("col");
    const labelKey = `label_${row}_${col}`;
    const parent   = cell.parent;

    // Update cell color + data
    cell.fills = [{ type: "SOLID", color: hexToRgb(plant.color), opacity: 0.88 }];
    cell.setPluginData("plant", JSON.stringify(plant));

    if (parent) {
      // Remove previous label for this cell
      const old = [...parent.children].find(
        (n) => n.getPluginData("bedCellLabel") === labelKey
      );
      if (old) old.remove();

      // Create a locked text overlay centered over the cell.
      // Locked = users can't accidentally select it; clicks pass through to the rectangle.
      const label = figma.createText();
      label.fontName        = { family: "Inter", style: "Regular" };
      label.fontSize        = 9;
      label.textAlignHorizontal = "CENTER";
      label.textAutoResize  = "HEIGHT";          // fixed width, height adjusts to content
      label.resize(cell.width - 8, 20);          // width set now; height recalculates after chars
      label.characters      = `${plant.emoji}\n${plant.name}\n×${plant.perSquare}/ft²`;
      label.fills           = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      label.x               = cell.x + 4;
      label.y               = cell.y + Math.round((cell.height - label.height) / 2);
      label.locked          = true;
      label.setPluginData("bedCellLabel", labelKey);

      parent.appendChild(label);
    }
  }

  sendSelectionInfo();
}

// ─── Clear cells ──────────────────────────────────────────────────────────────

async function clearSelectedCells() {
  const cells = figma.currentPage.selection.filter(
    (n) => n.getPluginData("isBedCell") === "true" && n.type === "RECTANGLE"
  );

  for (const cell of cells) {
    const row      = cell.getPluginData("row");
    const col      = cell.getPluginData("col");
    const labelKey = `label_${row}_${col}`;

    cell.fills = [{ type: "SOLID", color: hexToRgb("#C4956A") }];
    cell.setPluginData("plant", JSON.stringify({ name: null }));

    const parent = cell.parent;
    if (parent) {
      const label = [...parent.children].find(
        (n) => n.getPluginData("bedCellLabel") === labelKey
      );
      if (label) label.remove();
    }
  }

  sendSelectionInfo();
}

// ─── Export plant list as CSV ─────────────────────────────────────────────────

function exportPlantCsv() {
  const beds = figma.currentPage.findAll(n => n.getPluginData("isGardenBed") === "true");

  const tally = {}; // plant name → { plant, cells }
  for (const bed of beds) {
    for (const child of bed.children) {
      if (child.getPluginData("isBedCell") !== "true") continue;
      const plant = JSON.parse(child.getPluginData("plant") || "{}");
      if (!plant.name) continue;
      if (!tally[plant.name]) tally[plant.name] = { plant, cells: 0 };
      tally[plant.name].cells++;
    }
  }

  const rows = [["Plant", "Emoji", "Category", "Cells", "Per Sq Ft", "Total Plants", "Notes"]];
  for (const { plant, cells } of Object.values(tally)) {
    rows.push([
      plant.name,
      plant.emoji  || "",
      plant.category || "",
      cells,
      plant.perSquare || 1,
      cells * (plant.perSquare || 1),
      plant.note || "",
    ]);
  }

  const csv = rows
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  figma.ui.postMessage({ type: "csv-data", csv, count: Object.keys(tally).length });
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0.5, g: 0.5, b: 0.5 };
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255,
  };
}
