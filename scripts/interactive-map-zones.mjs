let imzMode = "select";
let imzPoints = [];
let imzGraphics = null;
let imzZonesContainer = null;
let imzFinishedPoints = [];
let imzEditingZone = null;
let imzEditContainer = null;
let imzEditPoints = [];
let imzDraggingVertex = null;
let imzHighlightGraphics = null;
let imzDraggingLabel = false;
let imzEditLabelX = null;
let imzEditLabelY = null;

Hooks.once("init", () => {
  console.log("Interactive Map Zones | Initialisation du module");
});


Hooks.once("ready", () => {
  console.log("Interactive Map Zones | Module prêt");
});


/* =========================================================
 * SCENE CONTROLS
 * ========================================================= */

Hooks.on("getSceneControlButtons", (controls) => {

  if (!game.user.isGM) return;

  console.log(
    "Interactive Map Zones | Création du contrôle Zones"
  );

  controls["interactive-map-zones"] = {
    name: "interactive-map-zones",
    title: "Interactive Map Zones",
    icon: "fa-solid fa-map-location-dot",
    order: 75,

    tools: {

select: {
  name: "select",
  title: game.i18n.localize(
  "IMZ.Controls.Select"
),
  icon: "fa-solid fa-arrow-pointer",
  order: 1,

  onChange: (event, active) => {

  if (!active) return;

  cancelCurrentZoneDrawing();

  imzMode = "select";

  console.log(
    "Interactive Map Zones | Mode sélection activé"
  );
}
},

draw: {
  name: "draw",
  title: game.i18n.localize(
  "IMZ.Controls.Draw"
),
  icon: "fa-solid fa-draw-polygon",
  order: 2,

  onChange: (event, active) => {
    imzMode = "draw";
    imzPoints = [];

    console.log(
      "Interactive Map Zones | Mode dessin activé"
    );

    ui.notifications.info(
  game.i18n.localize(
    "IMZ.Notifications.DrawInstructions"
  )
);
  }
},

      settings: {
        name: "settings",
        title: game.i18n.localize(
  "IMZ.Controls.Settings"
),
        icon: "fa-solid fa-gear",
        order: 3,
        button: true,

        onChange: () => {
          ui.notifications.info(
  game.i18n.localize(
    "IMZ.Notifications.SettingsComingSoon"
  )
);
        }
      }
    },

    activeTool: "select",

    onToolChange: (event, tool, active) => {
      console.log(
        "Interactive Map Zones | Outil :",
        tool.name,
        "Actif :",
        active
      );
    }
  };
});

Hooks.on(
  "renderSceneControls",
  sceneControls => {

    const activeControl =
      sceneControls.control?.name;

    /*
     * Ne jamais interrompre
     * l'éditeur de forme.
     */
    if (imzMode === "edit-shape") {
      return;
    }

    /*
     * Si on quitte complètement
     * Interactive Map Zones.
     */
    if (
      activeControl !==
      "interactive-map-zones"
    ) {

      if (imzMode === "draw") {
        cancelCurrentZoneDrawing();
      }

      imzMode = "select";
    }
  }
);
/* =========================================================
 * CANVAS
 * ========================================================= */

Hooks.on("canvasReady", async () => {

  console.log(
    "Interactive Map Zones | Canvas prêt"
  );

  // Conteneur des zones sauvegardées
  imzZonesContainer = new PIXI.Container();

  canvas.stage.addChild(
    imzZonesContainer
  );

  // Conteneur du dessin temporaire
  imzGraphics = new PIXI.Graphics();

  canvas.stage.addChild(
    imzGraphics
  );

  // Événements de dessin
  canvas.stage.on(
    "pointerdown",
    imzCanvasClick
  );

  canvas.stage.on(
    "rightdown",
    imzFinishZone
  );

  canvas.stage.on(
  "pointermove",
  imzShapePointerMove
);

canvas.stage.on(
  "pointerup",
  imzShapePointerUp
);

canvas.stage.on(
  "pointerupoutside",
  imzShapePointerUp
);

  // Charger les zones sauvegardées
  await renderSavedZones();
});


/* =========================================================
 * CLIC SUR LA CARTE
 * ========================================================= */
function imzShapePointerMove(event) {

  if (imzMode !== "edit-shape") {
    return;
  }

  const position =
    event.getLocalPosition(
      canvas.stage
    );

  /*
   * Déplacement du texte
   */
if (imzDraggingLabel) {

  imzEditLabelX =
    position.x;

  imzEditLabelY =
    position.y;

  drawZoneShapeEditor();

  return;
}

  /*
   * Déplacement d'un sommet
   */
  if (imzDraggingVertex === null) {
    return;
  }

  imzEditPoints[
    imzDraggingVertex
  ] = {
    x: position.x,
    y: position.y
  };

  drawZoneShapeEditor();
}

function imzShapePointerUp() {

  if (imzMode !== "edit-shape") {
    return;
  }

  imzDraggingVertex = null;
  imzDraggingLabel = false;
}

function imzCanvasClick(event) {

  if (imzMode !== "draw") return;

  // Position du clic dans les coordonnées du canvas
  const position = event.getLocalPosition(canvas.stage);

  const point = {
    x: position.x,
    y: position.y
  };

  imzPoints.push(point);

  console.log(
    "Interactive Map Zones | Point ajouté :",
    point
  );

  drawTemporaryZone();
}

function imzFinishZone(event) {

  if (imzMode !== "draw") return;

  // Il faut au moins 3 sommets
  if (imzPoints.length < 3) {

    ui.notifications.warn(
  game.i18n.localize(
    "IMZ.Notifications.MinimumThreePoints"
  )
);

    return;
  }

  // Empêcher le menu contextuel
  event.nativeEvent?.preventDefault();

  imzFinishedPoints = structuredClone(imzPoints);

  console.log(
    "Interactive Map Zones | Zone terminée :",
    imzFinishedPoints
  );


  drawFinishedZone();

openZoneConfiguration();
}

function drawFinishedZone() {

  if (!imzGraphics) return;
  if (imzFinishedPoints.length < 3) return;

  imzGraphics.clear();


  /* =====================================================
   * REMPLISSAGE
   * ===================================================== */

  imzGraphics.beginFill(
    0xF5B800,
    0.25
  );

  imzGraphics.moveTo(
    imzFinishedPoints[0].x,
    imzFinishedPoints[0].y
  );

  for (let i = 1; i < imzFinishedPoints.length; i++) {

    imzGraphics.lineTo(
      imzFinishedPoints[i].x,
      imzFinishedPoints[i].y
    );
  }

  // Fermer le polygone
  imzGraphics.lineTo(
    imzFinishedPoints[0].x,
    imzFinishedPoints[0].y
  );

  imzGraphics.endFill();


  /* =====================================================
   * CONTOUR
   * ===================================================== */

  imzGraphics.lineStyle(
    2,
    0xF5B800,
    1
  );

  imzGraphics.moveTo(
    imzFinishedPoints[0].x,
    imzFinishedPoints[0].y
  );

  for (let i = 1; i < imzFinishedPoints.length; i++) {

    imzGraphics.lineTo(
      imzFinishedPoints[i].x,
      imzFinishedPoints[i].y
    );
  }

  // Fermer le contour
  imzGraphics.lineTo(
    imzFinishedPoints[0].x,
    imzFinishedPoints[0].y
  );


  /* =====================================================
   * NETTOYAGE
   * ===================================================== */

  imzPoints = [];
}
/* =========================================================
 * DESSIN TEMPORAIRE
 * ========================================================= */

function drawTemporaryZone() {

  if (!imzGraphics) return;

  imzGraphics.clear();

  if (imzPoints.length === 0) return;


  /* =====================================================
   * REMPLISSAGE DU POLYGONE
   * ===================================================== */

  if (imzPoints.length >= 3) {

    imzGraphics.beginFill(
      0xF5B800,
      0.25
    );

    imzGraphics.moveTo(
      imzPoints[0].x,
      imzPoints[0].y
    );

    for (let i = 1; i < imzPoints.length; i++) {

      imzGraphics.lineTo(
        imzPoints[i].x,
        imzPoints[i].y
      );
    }

    imzGraphics.lineTo(
      imzPoints[0].x,
      imzPoints[0].y
    );

    imzGraphics.endFill();
  }


  /* =====================================================
   * CONTOUR / LIGNES
   * ===================================================== */

  if (imzPoints.length >= 2) {

    imzGraphics.lineStyle(
      2,
      0xF5B800,
      1
    );

    imzGraphics.moveTo(
      imzPoints[0].x,
      imzPoints[0].y
    );

    for (let i = 1; i < imzPoints.length; i++) {

      imzGraphics.lineTo(
        imzPoints[i].x,
        imzPoints[i].y
      );
    }
  }


  /* =====================================================
   * POINTS
   * ===================================================== */

  for (const point of imzPoints) {

    imzGraphics.beginFill(
      0xF5B800,
      1
    );

    imzGraphics.drawCircle(
      point.x,
      point.y,
      3
    );

    imzGraphics.endFill();
  }
}

function cancelCurrentZoneDrawing() {

  imzPoints = [];
  imzFinishedPoints = [];

  if (imzGraphics) {
    imzGraphics.clear();
  }
}

function activateOpacitySlider(dialog) {

  const slider = dialog.element.querySelector(
    ".imz-alpha-slider"
  );

  const valueDisplay = dialog.element.querySelector(
    ".imz-alpha-value"
  );

  if (!slider || !valueDisplay) {
    return;
  }

  // Mettre immédiatement la bonne valeur
  valueDisplay.textContent =
    `${Math.round(Number(slider.value) * 100)} %`;

  slider.addEventListener("input", () => {

    valueDisplay.textContent =
      `${Math.round(Number(slider.value) * 100)} %`;

  });
}

async function openZoneConfiguration() {

  const journals = game.journal.map(journal => ({
    name: journal.name,
    uuid: journal.uuid
  }));

  const content =
  await foundry.applications.handlebars.renderTemplate(
    "modules/interactive-map-zones/templates/zone-config.hbs",
    {
      journals,

      zone: {
  name: "",
  journalUuid: null,

  fillColor: "#f5b800",
  fillAlpha: 0.25,
  fillAlphaPercent: 25,

  borderColor: "#f5b800",
  borderWidth: 3,

  showLabel: true,
  labelX: null,
labelY: null,

  labelFontSize: 24,
  labelColor: "#ffffff",
  labelStrokeColor: "#000000",
  labelStrokeWidth: 4
}
    }
  );

  const dialog = new foundry.applications.api.DialogV2({
    window: {
      title: game.i18n.localize(
  "IMZ.Dialog.ZoneConfiguration"
)
    },
    position: {
      width: 600
    },

    content,

submit: async (result, dialog) => {

  console.log(
    "Interactive Map Zones | Dialog soumis :",
    result
  );

},

    buttons: [
      {
        action: "cancel",
        label: game.i18n.localize(
  "IMZ.Actions.Cancel"
),
        type: "button",
        icon: "fa-solid fa-xmark"
        
      },

      {
        action: "save",
  label: game.i18n.localize(
  "IMZ.Actions.Save"
),
  type: "submit",
  icon: "fa-solid fa-floppy-disk",
  default: true,

  callback: async (event, button, dialog) => {

    const form = button.form;

    if (!form) {
      ui.notifications.error(
  game.i18n.localize(
    "IMZ.Notifications.FormNotFound"
  )
);
      return;
    }

    const formData = new FormData(form);

  const journalUuid =
    formData.get("journalUuid") || null;

  let zoneName =
    formData.get("name")?.trim() || "";

  // Si aucun nom n'est indiqué,
  // utiliser automatiquement le nom du Journal.
  if (!zoneName && journalUuid) {

    const journal = await fromUuid(journalUuid);

    if (journal) {
      zoneName = journal.name;
    }
  }

  // Dernier recours
  if (!zoneName) {
    zoneName = game.i18n.localize(
  "IMZ.Zone.DefaultName"
);
  }

  const zone = {

  id: foundry.utils.randomID(),

  name: zoneName,

  journalUuid,

  points: structuredClone(
    imzFinishedPoints
  ),

  fillColor:
    formData.get("fillColor") ||
    "#f5b800",

  fillAlpha:
    Number(
      formData.get("fillAlpha") ?? 0.25
    ),

  borderColor:
    formData.get("borderColor") ||
    "#f5b800",

  borderWidth:
    Number(
      formData.get("borderWidth") ?? 3
    ),

  showLabel:
    formData.get("showLabel") === "on",
    labelX: null,
labelY: null,

  labelFontSize:
    Number(
      formData.get("labelFontSize") ?? 24
    ),

  labelColor:
    formData.get("labelColor") ||
    "#ffffff",

  labelStrokeColor:
    formData.get("labelStrokeColor") ||
    "#000000",

  labelStrokeWidth:
    Number(
      formData.get("labelStrokeWidth") ?? 4
    )
};

  await saveZone(zone);
}

      }
    ]
  }).render({
    force: true
  });
}

async function saveZone(zoneData) {

  if (!canvas.scene) {
    ui.notifications.error(
  game.i18n.localize(
    "IMZ.Notifications.NoActiveScene"
  )
);
    return;
  }

  const zones = foundry.utils.deepClone(
    canvas.scene.getFlag(
      "interactive-map-zones",
      "zones"
    ) ?? []
  );

  zones.push(zoneData);

  await canvas.scene.setFlag(
    "interactive-map-zones",
    "zones",
    zones
  );

  await renderSavedZones();

if (imzGraphics) {
  imzGraphics.clear();
}

// Préparer immédiatement la prochaine zone
imzPoints = [];
imzFinishedPoints = [];
imzMode = "draw";

  console.log(
    "Interactive Map Zones | Zone sauvegardée :",
    zoneData
  );

  ui.notifications.info(
  game.i18n.format(
    "IMZ.Notifications.ZoneSaved",
    {
      name: zoneData.name
    }
  )
);
}

async function renderSavedZones() {

  if (!canvas.scene) return;
  if (!imzZonesContainer) return;

  // Nettoyer les anciennes zones
  hideZoneHighlight();
  imzZonesContainer.removeChildren();

  const zones =
    canvas.scene.getFlag(
      "interactive-map-zones",
      "zones"
    ) ?? [];

  console.log(
    "Interactive Map Zones | Zones chargées :",
    zones
  );

  for (const zone of zones) {

    if (
  imzMode === "edit-shape" &&
  imzEditingZone?.id === zone.id
) {
  continue;
}

    if (!zone.points?.length) continue;

    const graphics = new PIXI.Graphics();

    // Zone de clic indépendante de l'opacité visuelle
graphics.hitArea = new PIXI.Polygon(
  zone.points.flatMap(point => [
    point.x,
    point.y
  ])
);

    // Informations de la zone sur l'objet graphique
graphics.imzZone = zone;

// Rendre la zone interactive
graphics.eventMode = "static";
graphics.cursor = zone.journalUuid ? "pointer" : "default";
graphics.cursor = "pointer";

    const fillColor = Number(
      zone.fillColor.replace("#", "0x")
    );

    const borderColor = Number(
      zone.borderColor.replace("#", "0x")
    );

    /* =========================
     * REMPLISSAGE
     * ========================= */

    graphics.beginFill(
      fillColor,
      zone.fillAlpha
    );

    graphics.moveTo(
      zone.points[0].x,
      zone.points[0].y
    );

    for (
      let i = 1;
      i < zone.points.length;
      i++
    ) {

      graphics.lineTo(
        zone.points[i].x,
        zone.points[i].y
      );
    }

    graphics.lineTo(
      zone.points[0].x,
      zone.points[0].y
    );

    graphics.endFill();


    /* =========================
     * CONTOUR
     * ========================= */

    graphics.lineStyle(
      zone.borderWidth,
      borderColor,
      1
    );

    graphics.moveTo(
      zone.points[0].x,
      zone.points[0].y
    );

    for (
      let i = 1;
      i < zone.points.length;
      i++
    ) {

      graphics.lineTo(
        zone.points[i].x,
        zone.points[i].y
      );
    }

    graphics.lineTo(
      zone.points[0].x,
      zone.points[0].y
    );

    /* =========================
 * INTERACTIONS
 * ========================= */

// Survol
graphics.on("pointerover", () => {

  if (imzMode !== "select") {
    return;
  }

  showZoneHighlight(zone);
});

// Fin du survol
graphics.on("pointerout", () => {

  hideZoneHighlight();
});

// Clic sur la zone
graphics.on("pointertap", async (event) => {

  if (imzMode === "draw") return;

  // Empêcher le clic de se propager au canvas
  event.stopPropagation();

  if (!zone.journalUuid) {
    return;
  }

  const journal = await fromUuid(
    zone.journalUuid
  );

  if (!journal) {

    ui.notifications.warn(
  game.i18n.format(
    "IMZ.Notifications.JournalNotFound",
    {
      name: zone.name
    }
  )
);

    return;
  }

  journal.sheet.render(true);
});

graphics.on("rightdown", async (event) => {

  if (imzMode !== "select") return;

  event.stopPropagation();
  event.nativeEvent?.preventDefault();

  await openZoneActions(zone);
});

    imzZonesContainer.addChild(
      graphics
    );


    /* =========================
     * NOM DE LA ZONE
     * ========================= */

    if (zone.showLabel && zone.name) {

      const center = getZoneCenter(
        zone.points
      );

      const labelColor = Number(
  (zone.labelColor ?? "#ffffff")
    .replace("#", "0x")
);

const labelStrokeColor = Number(
  (zone.labelStrokeColor ?? "#000000")
    .replace("#", "0x")
);

const label = new PIXI.Text(
  zone.name,
  {
    fontFamily: "Arial",

    fontSize:
      zone.labelFontSize ?? 24,

    fill:
      labelColor,

    stroke:
      labelStrokeColor,

    strokeThickness:
      zone.labelStrokeWidth ?? 4,

    align: "center"
  }
);

      label.anchor.set(
        0.5,
        0.5
      );

      label.position.set(
  zone.labelX ?? center.x,
  zone.labelY ?? center.y
);

      imzZonesContainer.addChild(
        label
      );
    }
  }
}

function getZoneCenter(points) {

  let x = 0;
  let y = 0;

  for (const point of points) {
    x += point.x;
    y += point.y;
  }

  return {
    x: x / points.length,
    y: y / points.length
  };
}

async function openZoneActions(zone) {

  const dialog = new foundry.applications.api.DialogV2({

    window: {
  title: zone.name,
  classes: [
    "imz-zone-actions"
  ]
},
    
    content: `
  <div style="padding: 10px;">
    <p>
      ${game.i18n.format(
        "IMZ.Dialog.ZoneActions",
        {
          name: foundry.utils.escapeHTML(
            zone.name
          )
        }
      )}
    </p>
  </div>
`,

    buttons: [

      {
        action: "edit",
        label: game.i18n.localize(
  "IMZ.Actions.Edit"
),classes: [
    "imz-dialog-button"
  ],
        icon: "fa-solid fa-pen",

        callback: async () => {
    await openZoneEditConfiguration(zone);
  }
      },

      {
  action: "edit-shape",classes: [
    "imz-dialog-button"
  ],
  label: game.i18n.localize(
  "IMZ.Actions.EditShape"
),
  icon: "fa-solid fa-draw-polygon",

  callback: async () => {
    await startZoneShapeEditing(zone);
  }
},

      {
        action: "delete",classes: [
    "imz-dialog-button"
  ],
        label: game.i18n.localize(
  "IMZ.Actions.Delete"
),
        icon: "fa-solid fa-trash",

        callback: async () => {
          await confirmDeleteZone(zone);
        }
      },

      {
        action: "cancel",classes: [
    "imz-dialog-button"
  ],
        label: game.i18n.localize(
  "IMZ.Actions.Cancel"
),
        icon: "fa-solid fa-xmark"
      }
      
    ]

});

await dialog.render({
  force: true
});

activateOpacitySlider(dialog);
}

async function startZoneShapeEditing(zone) {

  // Nettoyer une ancienne édition
  await cancelZoneShapeEditing(false);

  // Copier la zone à éditer
  imzEditingZone = zone;

  imzEditPoints = structuredClone(
    zone.points
  );

  // Position temporaire du texte
  const center = getZoneCenter(
    zone.points
  );

  imzEditLabelX =
    zone.labelX ?? center.x;

  imzEditLabelY =
    zone.labelY ?? center.y;

  // Activer le mode édition
  imzMode = "edit-shape";

  // Masquer la zone sauvegardée
  await renderSavedZones();

  // Créer le calque d'édition
  imzEditContainer =
    new PIXI.Container();

  canvas.stage.addChild(
    imzEditContainer
  );

  // Dessiner la zone éditable
  drawZoneShapeEditor();

  ui.notifications.info(
    game.i18n.format(
      "IMZ.Notifications.ShapeEditing",
      {
        name: zone.name
      }
    )
  );

  openZoneShapeEditDialog();
}

async function confirmDeleteZone(zone) {

  const confirmed =
  await foundry.applications.api.DialogV2.confirm({

    window: {
      title: game.i18n.localize(
        "IMZ.Dialog.DeleteZone"
      )
    },

    content: `
      <p>
        ${game.i18n.format(
          "IMZ.Dialog.DeleteConfirmation",
          {
            name: foundry.utils.escapeHTML(
              zone.name
            )
          }
        )}
      </p>

      <p>
        ${game.i18n.localize(
          "IMZ.Dialog.DeleteWarning"
        )}
      </p>
    `,

    yes: {
      label: game.i18n.localize(
        "IMZ.Actions.Delete"
      ),
      icon: "fa-solid fa-trash"
    },

    no: {
      label: game.i18n.localize(
        "IMZ.Actions.Cancel"
      )
    }
  });

  if (!confirmed) return;

  await deleteZone(zone.id);
}

async function deleteZone(zoneId) {

  if (!canvas.scene) return;

  const zones =
    foundry.utils.deepClone(
      canvas.scene.getFlag(
        "interactive-map-zones",
        "zones"
      ) ?? []
    );

  const newZones = zones.filter(
    zone => zone.id !== zoneId
  );

  await canvas.scene.setFlag(
    "interactive-map-zones",
    "zones",
    newZones
  );

  await renderSavedZones();

ui.notifications.info(
  game.i18n.localize(
    "IMZ.Notifications.ZoneDeleted"
  )
);

  console.log(
    "Interactive Map Zones | Zone supprimée :",
    zoneId
  );
}

async function openZoneEditConfiguration(zone) {

  const journals = game.journal.map(journal => ({
    name: journal.name,
    uuid: journal.uuid,
    selected: journal.uuid === zone.journalUuid
  }));


  const templateZone = {
    ...zone,

    fillColor:
      zone.fillColor ?? "#f5b800",

    fillAlpha:
      zone.fillAlpha ?? 0.25,

    fillAlphaPercent:
      Math.round((zone.fillAlpha ?? 0.25) * 100),

    borderColor:
      zone.borderColor ?? "#f5b800",

    borderWidth:
      zone.borderWidth ?? 3,

    showLabel:
      zone.showLabel ?? true,

      labelFontSize:
  zone.labelFontSize ?? 24,

labelColor:
  zone.labelColor ?? "#ffffff",

labelStrokeColor:
  zone.labelStrokeColor ?? "#000000",

labelStrokeWidth:
  zone.labelStrokeWidth ?? 4
  };


  const content =
    await foundry.applications.handlebars.renderTemplate(
      "modules/interactive-map-zones/templates/zone-config.hbs",
      {
        journals,
        zone: templateZone
      }
    );


  const dialog = new foundry.applications.api.DialogV2({

    window: {
      title: game.i18n.format(
  "IMZ.Dialog.EditZone",
  {
    name: zone.name
  }
)
    },
    position: {
      width: 600
    },

    content,

    buttons: [

      {
        action: "cancel",
        label: game.i18n.localize(
  "IMZ.Actions.Cancel"
),
        icon: "fa-solid fa-xmark",
        type: "button"
      },

      {
        action: "save",
        label: game.i18n.localize(
  "IMZ.Actions.Save"
),
        icon: "fa-solid fa-floppy-disk",
        type: "submit",
        default: true,

        callback: async (event, button, dialog) => {

          const form = button.form;

          if (!form) {

            ui.notifications.error(
  game.i18n.localize(
    "IMZ.Notifications.FormNotFound"
  )
);

            return;
          }


          const formData =
            new FormData(form);


          const journalUuid =
            formData.get("journalUuid") || null;


          let zoneName =
            formData.get("name")?.trim() || "";


          // Si le nom est vide,
          // utiliser celui du Journal.
          if (!zoneName && journalUuid) {

            const journal =
              await fromUuid(journalUuid);

            if (journal) {
              zoneName = journal.name;
            }
          }


          if (!zoneName) {
            zoneName = game.i18n.localize(
  "IMZ.Zone.DefaultName"
);
          }


          const updatedZone = {

            ...zone,

            name: zoneName,

            journalUuid,

            fillColor:
              formData.get("fillColor") ||
              "#f5b800",

            fillAlpha:
              Number(
                formData.get("fillAlpha") ?? 0.25
              ),

            borderColor:
              formData.get("borderColor") ||
              "#f5b800",

            borderWidth:
              Number(
                formData.get("borderWidth") ?? 3
              ),

            showLabel:
              formData.get("showLabel") === "on",

              labelFontSize:
    Number(
      formData.get("labelFontSize") ?? 24
    ),

  labelColor:
    formData.get("labelColor") ||
    "#ffffff",

  labelStrokeColor:
    formData.get("labelStrokeColor") ||
    "#000000",

  labelStrokeWidth:
    Number(
      formData.get("labelStrokeWidth") ?? 4
    )
          };


          await updateZone(updatedZone);
        }
      }
    ]

  });

await dialog.render({
  force: true
});

activateOpacitySlider(dialog);
}

async function updateZone(updatedZone) {

  if (!canvas.scene) {
    return;
  }


  const zones =
    foundry.utils.deepClone(
      canvas.scene.getFlag(
        "interactive-map-zones",
        "zones"
      ) ?? []
    );


  const index =
    zones.findIndex(
      zone => zone.id === updatedZone.id
    );


  if (index === -1) {

    ui.notifications.error(
  game.i18n.localize(
    "IMZ.Notifications.ZoneNotFound"
  )
);

    return;
  }


  // Remplacer la zone existante
  zones[index] = updatedZone;


  await canvas.scene.setFlag(
    "interactive-map-zones",
    "zones",
    zones
  );


  // Redessiner immédiatement
  await renderSavedZones();


ui.notifications.info(
  game.i18n.format(
    "IMZ.Notifications.ZoneUpdated",
    {
      name: updatedZone.name
    }
  )
);


  console.log(
    "Interactive Map Zones | Zone modifiée :",
    updatedZone
  );
}

function drawZoneShapeEditor() {

  if (!imzEditContainer) return;
  if (!imzEditingZone) return;

  imzEditContainer.removeChildren();

  if (imzEditPoints.length < 3) return;


  /* =====================================================
   * POLYGONE
   * ===================================================== */

  const polygon = new PIXI.Graphics();

  polygon.eventMode = "static";
  polygon.cursor = "crosshair";

  polygon.hitArea = new PIXI.Polygon(
    imzEditPoints.flatMap(point => [
      point.x,
      point.y
    ])
  );


  const fillColor = Number(
    (imzEditingZone.fillColor ?? "#f5b800")
      .replace("#", "0x")
  );

  const borderColor = Number(
    (imzEditingZone.borderColor ?? "#f5b800")
      .replace("#", "0x")
  );

  const fillAlpha =
    imzEditingZone.fillAlpha ?? 0.25;

  const borderWidth =
    imzEditingZone.borderWidth ?? 3;


  polygon.beginFill(
    fillColor,
    fillAlpha
  );

  polygon.lineStyle(
    borderWidth,
    borderColor,
    1
  );


  polygon.moveTo(
    imzEditPoints[0].x,
    imzEditPoints[0].y
  );

  for (
    let i = 1;
    i < imzEditPoints.length;
    i++
  ) {

    polygon.lineTo(
      imzEditPoints[i].x,
      imzEditPoints[i].y
    );
  }


  // Fermer le polygone
  polygon.lineTo(
    imzEditPoints[0].x,
    imzEditPoints[0].y
  );

  polygon.endFill();


  /* =====================================================
   * DOUBLE-CLIC = AJOUTER UN SOMMET
   * ===================================================== */

  polygon.on(
    "pointertap",
    event => {

      if (event.detail !== 2) {
        return;
      }

      event.stopPropagation();

      const position =
        event.getLocalPosition(
          canvas.stage
        );

      addVertexToNearestEdge(
        position
      );
    }
  );


  imzEditContainer.addChild(
    polygon
  );


  /* =====================================================
   * SOMMETS
   * ===================================================== */

  imzEditPoints.forEach(
    (point, index) => {

      const vertex =
        new PIXI.Graphics();

      vertex.beginFill(
        0xFFFFFF,
        1
      );

      vertex.lineStyle(
        2,
        0x000000,
        1
      );

      vertex.drawCircle(
        0,
        0,
        5
      );

      vertex.endFill();

      vertex.position.set(
        point.x,
        point.y
      );

      vertex.eventMode = "static";
      vertex.cursor = "grab";


      // Déplacer le sommet
      vertex.on(
        "pointerdown",
        event => {

          event.stopPropagation();

          imzDraggingVertex =
            index;

          vertex.cursor =
            "grabbing";
        }
      );


      // Clic droit = supprimer
      vertex.on(
        "rightdown",
        event => {

          event.stopPropagation();

          event.nativeEvent
            ?.preventDefault();

          removeZoneVertex(
            index
          );
        }
      );


      imzEditContainer.addChild(
        vertex
      );
    }
  );


  /* =====================================================
   * TEXTE DE LA ZONE
   * ===================================================== */

  if (
    imzEditingZone.showLabel &&
    imzEditingZone.name
  ) {

    const center =
      getZoneCenter(
        imzEditPoints
      );


    const labelColor = Number(
      (
        imzEditingZone.labelColor ??
        "#ffffff"
      ).replace("#", "0x")
    );


    const labelStrokeColor =
      Number(
        (
          imzEditingZone
            .labelStrokeColor ??
          "#000000"
        ).replace("#", "0x")
      );


    const label =
      new PIXI.Text(
        imzEditingZone.name,
        {
          fontFamily: "Arial",

          fontSize:
            imzEditingZone
              .labelFontSize ?? 24,

          fill:
            labelColor,

          stroke:
            labelStrokeColor,

          strokeThickness:
            imzEditingZone
              .labelStrokeWidth ?? 4,

          align: "center"
        }
      );


    label.anchor.set(
      0.5,
      0.5
    );


    label.position.set(
      imzEditLabelX ?? center.x,
      imzEditLabelY ?? center.y
    );


    label.eventMode = "static";
    label.cursor = "grab";


    label.on(
      "pointerdown",
      event => {

        event.stopPropagation();

        imzDraggingLabel = true;

        label.cursor =
          "grabbing";
      }
    );


    imzEditContainer.addChild(
      label
    );
  }
}

function addVertexToNearestEdge(position) {

  if (imzEditPoints.length < 2) {
    return;
  }

  let nearestIndex = -1;
  let nearestPoint = null;
  let nearestDistance = Infinity;

  for (
    let i = 0;
    i < imzEditPoints.length;
    i++
  ) {

    const start =
      imzEditPoints[i];

    const end =
      imzEditPoints[
        (i + 1) %
        imzEditPoints.length
      ];

    const result =
      getClosestPointOnSegment(
        position,
        start,
        end
      );

    if (
      result.distance <
      nearestDistance
    ) {

      nearestDistance =
        result.distance;

      nearestPoint =
        result.point;

      nearestIndex =
        i + 1;
    }
  }

  /*
   * Empêche d'ajouter un sommet
   * si on clique trop loin
   * d'une frontière.
   */
  const MAX_DISTANCE = 15;

  if (
    nearestDistance >
    MAX_DISTANCE
  ) {

    return;
  }

  imzEditPoints.splice(
    nearestIndex,
    0,
    nearestPoint
  );

  drawZoneShapeEditor();

ui.notifications.info(
  game.i18n.localize(
    "IMZ.Notifications.VertexAdded"
  )
);
}

function getClosestPointOnSegment(
  point,
  start,
  end
) {

  const dx =
    end.x - start.x;

  const dy =
    end.y - start.y;

  const lengthSquared =
    dx * dx +
    dy * dy;

  if (lengthSquared === 0) {

    return {
      point: {
        x: start.x,
        y: start.y
      },

      distance: Math.hypot(
        point.x - start.x,
        point.y - start.y
      )
    };
  }

  let t =
    (
      (point.x - start.x) * dx +
      (point.y - start.y) * dy
    ) /
    lengthSquared;

  t = Math.max(
    0,
    Math.min(1, t)
  );

  const closest = {

    x:
      start.x +
      t * dx,

    y:
      start.y +
      t * dy
  };

  return {

    point: closest,

    distance:
      Math.hypot(
        point.x - closest.x,
        point.y - closest.y
      )
  };
}

function openZoneShapeEditDialog() {

  new foundry.applications.api.DialogV2({

    window: {
      title: game.i18n.format(
        "IMZ.Dialog.EditShape",
        {
          name: imzEditingZone.name
        }
      )
    },

    content: `
      <p>
        ${game.i18n.localize(
          "IMZ.Dialog.ShapeInstructions"
        )}
      </p>
    `,

    buttons: [

      {
        action: "cancel",

        label: game.i18n.localize(
          "IMZ.Actions.Cancel"
        ),

        icon: "fa-solid fa-xmark",

        callback: () => {
          cancelZoneShapeEditing();
        }
      },

      {
        action: "save",

        label: game.i18n.localize(
          "IMZ.Actions.Save"
        ),

        icon: "fa-solid fa-floppy-disk",
        default: true,

        callback: async () => {
          await saveZoneShapeEditing();
        }
      }
    ]

  }).render({
    force: true
  });
}

async function saveZoneShapeEditing() {

  if (!imzEditingZone) {
    return;
  }

const updatedZone = {
  ...imzEditingZone,

  points: structuredClone(
    imzEditPoints
  ),

  labelX: imzEditLabelX,
  labelY: imzEditLabelY
};

  /*
   * IMPORTANT :
   * quitter le mode édition AVANT
   * de redessiner les zones.
   */
  cleanupZoneShapeEditor();

  imzMode = "select";

  // Sauvegarde + redessin
  await updateZone(
    updatedZone
  );

ui.notifications.info(
  game.i18n.format(
    "IMZ.Notifications.ShapeSaved",
    {
      name: updatedZone.name
    }
  )
);
}

async function cancelZoneShapeEditing(
  notify = true
) {

  if (!imzEditingZone) {
    return;
  }

  const zoneName =
    imzEditingZone.name;

  cleanupZoneShapeEditor();

  imzMode = "select";

  // Réaffiche la zone originale
  await renderSavedZones();

  if (notify) {
    ui.notifications.info(
  game.i18n.format(
    "IMZ.Notifications.ShapeCancelled",
    {
      name: zoneName
    }
  )
);
  }
}

function cleanupZoneShapeEditor() {

  if (imzEditContainer) {

    imzEditContainer.destroy({
      children: true
    });

    imzEditContainer = null;
  }

  imzEditingZone = null;
  imzEditPoints = [];
  imzDraggingVertex = null;
  imzDraggingLabel = false;
  imzEditLabelX = null;
imzEditLabelY = null;
}

function removeZoneVertex(index) {

  if (imzMode !== "edit-shape") {
    return;
  }

  if (imzEditPoints.length <= 3) {

    ui.notifications.warn(
  game.i18n.localize(
    "IMZ.Notifications.MinimumThreeVertices"
  )
);

    return;
  }

  imzEditPoints.splice(
    index,
    1
  );

  imzDraggingVertex = null;

  drawZoneShapeEditor();

  ui.notifications.info(
  game.i18n.localize(
    "IMZ.Notifications.VertexRemoved"
  )
);
}

function showZoneHighlight(zone) {

  hideZoneHighlight();

  if (!zone?.points?.length) {
    return;
  }

  imzHighlightGraphics =
    new PIXI.Graphics();

  /*
   * Contour blanc légèrement
   * plus épais que le contour normal.
   */
  const highlightWidth =
    (zone.borderWidth ?? 3) + 4;

  imzHighlightGraphics.lineStyle(
    highlightWidth,
    0xFFFFFF,
    0.85
  );

  imzHighlightGraphics.moveTo(
    zone.points[0].x,
    zone.points[0].y
  );

  for (
    let i = 1;
    i < zone.points.length;
    i++
  ) {

    imzHighlightGraphics.lineTo(
      zone.points[i].x,
      zone.points[i].y
    );
  }

  // Fermer le contour
  imzHighlightGraphics.lineTo(
    zone.points[0].x,
    zone.points[0].y
  );

  /*
   * Le highlight est uniquement visuel.
   * Il ne doit jamais intercepter les clics.
   */
  imzHighlightGraphics.eventMode =
    "none";

  imzZonesContainer.addChild(
    imzHighlightGraphics
  );
}


function hideZoneHighlight() {

  if (!imzHighlightGraphics) {
    return;
  }

  imzHighlightGraphics.destroy();

  imzHighlightGraphics = null;
}