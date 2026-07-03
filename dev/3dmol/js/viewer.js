// The shared 3Dmol viewer instance plus the base rendering styles and the atom
// label toggle. The viewer is created once here and imported everywhere else.
// Initial background matches THEME.light.bg (the app starts in light mode); the
// theme toggle in ui.js recolours it live.
export const viewer = $3Dmol.createViewer("viewer", { backgroundColor: "#f6f8fa" });

export const STYLES = {
  stick:     { stick: { radius: 0.15 } },
  ballstick: { stick: { radius: 0.12 }, sphere: { scale: 0.28 } },
  sphere:    { sphere: { scale: 1.0 } },
  line:      { stick: { radius: 0.04, colorscheme: "Jmol" } },
};

let labelsOn = false;

export function toggleLabels() {
  labelsOn = !labelsOn;
  viewer.removeAllLabels();
  if (labelsOn) {
    viewer.getModel().selectedAtoms({}).forEach(atom => {
      viewer.addLabel(atom.elem, {
        position: { x: atom.x, y: atom.y, z: atom.z },
        fontSize: 11, fontColor: "white",
        backgroundColor: "black", backgroundOpacity: 0.55, inFront: true,
      });
    });
  }
  viewer.render();
}

// Clear labels and the on/off flag — used when a new molecule is loaded.
export function resetLabels() {
  labelsOn = false;
  viewer.removeAllLabels();
}
