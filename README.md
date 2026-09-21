# Interactive Map Zones

**Interactive Map Zones** is a module for Foundry Virtual Tabletop that allows Game Masters to create interactive polygonal zones directly on their Scene maps.

Turn a static map into an interactive world by defining territories, regions, kingdoms, districts, points of interest, or any other custom area.

## Features

### Custom Map Zones

Draw polygonal zones directly on any Foundry VTT Scene.

Zones can be used to represent:

- Kingdoms and nations
- Provinces and territories
- Cities and districts
- Wilderness regions
- Political borders
- Exploration areas
- Custom points of interest

### Fully Customizable

Each zone can be configured independently.

You can customize:

- Zone name
- Fill color
- Fill opacity
- Border color
- Border width
- Label visibility
- Label size
- Label color
- Label outline color
- Label outline width

Zones can even be configured with completely transparent fills while remaining interactive.

### Journal Integration

Zones can be linked directly to Foundry VTT Journal Entries.

Clicking a linked zone opens its associated Journal Entry, making it easy to build interactive world maps, campaign maps, regional guides, and atlases.

If no zone name is specified when creating a zone, Interactive Map Zones can automatically use the name of the linked Journal Entry.

### Editable Shapes

Existing zones can be modified directly on the map.

The shape editor allows you to:

- Move existing vertices
- Add new vertices
- Remove vertices
- Reshape existing zones
- Move the zone label independently

Changes can be saved or cancelled without modifying the original zone.

### Zone Highlighting

When hovering over a zone in selection mode, its border is highlighted to make interactive areas easier to identify.

### Multilingual

Interactive Map Zones currently supports:

- English
- French

## How to Use

1. Open a Scene in Foundry VTT.
2. Select the **Interactive Map Zones** tool from the Scene controls.
3. Select **Draw a Zone**.
4. Click on the map to place the vertices of the polygon.
5. Right-click to finish the zone.
6. Configure the zone appearance and optionally link a Journal Entry.
7. Save the zone.

You can then switch to the **Select a Zone** tool and right-click an existing zone to access its available actions.

## Zone Actions

Right-clicking a zone in selection mode provides several options:

**Edit**  
Modify the zone name, linked Journal Entry, colors, opacity, border, and label appearance.

**Edit Shape**  
Modify the polygon directly on the map and reposition its label.

**Delete**  
Permanently remove the zone.

## Shape Editing Controls

While editing a zone shape:

- **Drag a vertex** to move it.
- **Double-click near an edge** to add a new vertex.
- **Right-click a vertex** to remove it.
- **Drag the zone label** to reposition it.
- Select **Save** to keep the changes.
- Select **Cancel** to restore the original shape.

A zone must always contain at least three vertices.

## Compatibility

Designed for:

**Foundry Virtual Tabletop Version 14**

Current module version:

**1.0.0**

## Installation

Interactive Map Zones can be installed through the Foundry VTT module installer using its manifest URL.

Once installed:

1. Launch your World.
2. Open **Manage Modules**.
3. Enable **Interactive Map Zones**.
4. Reload the World if requested.

The Interactive Map Zones controls will then be available from the Scene controls for Game Masters.

## Data Storage

Zone information is stored directly in the Scene using Foundry VTT flags.

This includes:

- Polygon coordinates
- Zone appearance
- Journal links
- Label configuration
- Label position

No external database or service is required.

## Languages

Interactive Map Zones includes translations for:

- English (`en`)
- French (`fr`)

Additional translations may be added in future releases.

## Bug Reports and Feature Requests

If you encounter a bug or have an idea for a new feature, please open an issue on the GitHub repository.

## Author

Created by **Sillzabaw**.

## License

Interactive Map Zones is open-source software released under the MIT License.

See the `LICENSE` file for details.

---

**Interactive Map Zones**

*Bring your maps to life.*