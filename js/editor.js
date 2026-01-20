import { EditorState } from "./editor-state.js";
import { EditorUI } from "./editor-ui.js";
import { EditorMap } from "./editor-map.js";
import { showToast } from "./utils.js";
import { DataService } from "./data.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loaded = await DataService.load();
  if (loaded && loaded.data) {
    EditorState.init(loaded.data);
  } else {
    EditorState.init(null);
  }

  EditorUI.initConfirmation();
  EditorMap.init();

  refreshUI();
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
  ["costBusUp", "costBusDown", "costActivity"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const key =
        id === "costBusUp"
          ? "busTicketUp"
          : id === "costBusDown"
            ? "busTicketDown"
            : "activitiesPerPerson";
      EditorState.updateGlobalCost(key, parseInt(e.target.value) || 0);
      if (id !== "costActivity") EditorUI.updateBusLabels();
    });
  });

  document.getElementById("addDestBtn").onclick = () => {
    const name = prompt("Enter Destination Name (e.g. Sylhet):");
    if (name) {
      const id = EditorState.createDestination(name);
      if (id) refreshUI();
      else showToast("Destination already exists", "error");
    }
  };

  document.getElementById("deleteDestBtn").onclick = () => {
    EditorUI.showConfirm(
      "Delete Destination?",
      "This cannot be undone.",
      () => {
        EditorState.deleteDestination(EditorState.activeDestId);
        refreshUI();
      },
    );
  };

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

  const addResortBtn = document.getElementById("addResortBtn");
  if (addResortBtn)
    addResortBtn.onclick = () => {
      EditorState.addResort();
      EditorUI.renderActiveEditor();
    };

  const addDayBtn = document.getElementById("addDayBtn");
  if (addDayBtn)
    addDayBtn.onclick = () => {
      EditorState.addDay();
      EditorUI.renderActiveEditor();
    };

  const downloadResortCSV = document.getElementById("downloadResortCSV");
  if (downloadResortCSV) {
    downloadResortCSV.onclick = () => {
      if (!EditorState.activeDestId) return;
      const resorts =
        EditorState.get().destinations[EditorState.activeDestId].resorts;
      const headers = [
        "name",
        "priceCouple",
        "location",
        "lat",
        "lng",
        "rating",
        "activities",
        "facebook",
        "maps",
      ];
      const rows = [headers.join(",")];
      resorts.forEach((r) => {
        rows.push(
          [
            `"${r.name}"`,
            r.priceCouple,
            `"${r.location}"`,
            r.lat,
            r.lng,
            r.rating,
            `"${(r.activities || []).join(";")}"`,
            r.facebook,
            r.maps,
          ].join(","),
        );
      });
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${EditorState.activeDestId}_resorts.csv`;
      a.click();
    };
  }

  const exportJSON = document.getElementById("exportJSON");
  if (exportJSON) {
    exportJSON.onclick = () => {
      const data = JSON.stringify(EditorState.get(), null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tour_data.json";
      a.click();
    };
  }

  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  if (importBtn && importFile) {
    importBtn.onclick = () => importFile.click();
    importFile.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target.result);
          if (json.destinations) {
            EditorState.init(json);
            refreshUI();
            showToast("Imported successfully", "success");
          } else {
            throw new Error("Invalid structure");
          }
        } catch (e) {
          showToast("Import Failed", "error");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    };
  }

  window.addEventListener("update-resort", (e) =>
    EditorState.updateResort(e.detail.idx, e.detail.f, e.detail.v),
  );
  window.addEventListener("update-day", (e) =>
    EditorState.updateDay(e.detail.idx, e.detail.f, e.detail.v),
  );
  window.addEventListener("update-item", (e) =>
    EditorState.updateItem(
      e.detail.dIdx,
      e.detail.iIdx,
      e.detail.f,
      e.detail.v,
    ),
  );
}
