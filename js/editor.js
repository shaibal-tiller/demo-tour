import { EditorState } from "./js/editor-state.js";
import { EditorUI } from "./js/editor-ui.js";
import { EditorMap } from "./js/editor-map.js";
import { showToast } from "./js/utils.js";
import { DataService } from "./js/data.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize State
  const loaded = await DataService.load(); // Reusing the DataService
  if (loaded && loaded.data) {
    EditorState.init(loaded.data);
  } else {
    EditorState.init(null);
  }

  // 2. Init UI
  EditorUI.initConfirmation();
  EditorMap.init();

  refreshUI();

  // 3. Attach Listeners
  setupGlobalListeners();
});

function refreshUI() {
  EditorUI.renderGlobalSettings();
  EditorUI.renderDestList((id) => {
    EditorState.activeDestId = id;
    refreshUI();
  });
}

function setupGlobalListeners() {
  // Global Costs
  ["costBusUp", "costBusDown", "costActivity"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const key =
        id === "costBusUp"
          ? "busTicketUp"
          : id === "costBusDown"
            ? "busTicketDown"
            : "activitiesPerPerson";
      EditorState.updateGlobalCost(key, parseInt(e.target.value) || 0);
      if (id !== "costActivity") EditorUI.updateBusLabels(); // Redundant update but safe
    });
  });

  // Destination CRUD
  document.getElementById("addDestBtn").onclick = () => {
    const name = prompt("Enter Destination Name:");
    if (name) {
      const id = EditorState.createDestination(name);
      if (id) refreshUI();
      else showToast("Exists or Invalid", "error");
    }
  };

  document.getElementById("deleteDestBtn").onclick = () => {
    EditorUI.showConfirm("Delete Destination?", "Cannot undo.", () => {
      EditorState.deleteDestination(EditorState.activeDestId);
      refreshUI();
    });
  };

  // Destination Coords
  document
    .querySelectorAll('.pick-map-btn[data-target="dest"]')
    .forEach((btn) => {
      btn.onclick = () => {
        const dest = EditorState.get().destinations[EditorState.activeDestId];
        EditorMap.open(
          dest.center[0],
          dest.center[1],
          { type: "dest" },
          (lat, lng) => {
            EditorState.updateDestCenter(lat, lng);
            refreshUI();
          },
        );
      };
    });

  document.getElementById("destLat").onchange = (e) =>
    (EditorState.get().destinations[EditorState.activeDestId].center[0] =
      parseFloat(e.target.value));
  document.getElementById("destLng").onchange = (e) =>
    (EditorState.get().destinations[EditorState.activeDestId].center[1] =
      parseFloat(e.target.value));

  // Child Items (Resorts/Days)
  document.getElementById("addResortBtn").onclick = () => {
    EditorState.addResort();
    EditorUI.renderActiveEditor();
  };
  document.getElementById("addDayBtn").onclick = () => {
    EditorState.addDay();
    EditorUI.renderActiveEditor();
  };

  // CSV Export
  document.getElementById("downloadResortCSV").onclick = () => {
    // Simple inline implementation for the editor
    if (!EditorState.activeDestId) return;
    const resorts =
      EditorState.get().destinations[EditorState.activeDestId].resorts;
    const headers = [
      "name",
      "pricePerNight",
      "location",
      "lat",
      "lng",
      "rating",
      "activities",
    ];
    const rows = [headers.join(",")];
    resorts.forEach((r) => {
      rows.push(
        [
          `"${r.name}"`,
          r.pricePerNight,
          `"${r.location}"`,
          r.lat,
          r.lng,
          r.rating,
          `"${(r.activities || []).join(";")}"`,
        ].join(","),
      );
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resorts.csv";
    a.click();
  };

  // JSON Export
  document.getElementById("exportJSON").onclick = () => {
    const data = JSON.stringify(EditorState.get(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tour_data.json";
    a.click();
  };

  // Import
  document.getElementById("importBtn").onclick = () =>
    document.getElementById("importFile").click();
  document.getElementById("importFile").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        EditorState.init(json);
        refreshUI();
        showToast("Imported successfully", "success");
      } catch (e) {
        showToast("Import Failed", "error");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  // Custom Events from UI (debounced inputs)
  window.addEventListener("update-resort", (e) => {
    EditorState.updateResort(e.detail.idx, e.detail.f, e.detail.v);
  });
  window.addEventListener("update-day", (e) => {
    EditorState.updateDay(e.detail.idx, e.detail.f, e.detail.v);
  });
  window.addEventListener("update-day-items", (e) => {
    EditorState.updateDayItems(e.detail.idx, e.detail.v);
  });
}
