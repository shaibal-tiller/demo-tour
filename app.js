// app.js
import { DataService } from "./js/data.js";
import { MapService } from "./js/map.js";
import { UI } from "./js/ui.js";
import { showToast } from "./js/utils.js";

// --- STATE ---
const state = {
  tourData: null,
  currentDestination: null,
  selectedResort: null,
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  attachGlobalListeners();
  await initApp();
});

async function initApp() {
  const loaded = await DataService.load();

  if (loaded && loaded.data) {
    state.tourData = loaded.data;
    UI.updateStorageIndicator(loaded.source === "local", loaded.filename);

    const dests = Object.keys(state.tourData.destinations);
    if (dests.length > 0) {
      // Validate if current destination exists in new data
      if (
        !state.currentDestination ||
        !state.tourData.destinations[state.currentDestination]
      ) {
        state.currentDestination = dests[0];
      }
      renderAppState();
    } else {
      showToast("No destinations found in data.", "error");
    }
  }
}

// --- CORE LOGIC ---
function renderAppState() {
  // 1. Render Tabs
  UI.renderTabs(
    Object.keys(state.tourData.destinations),
    state.currentDestination,
    handleDestinationSwitch,
  );

  // 2. Setup Map
  const destData = state.tourData.destinations[state.currentDestination];
  MapService.init(destData);
  MapService.renderMarkers(
    destData.resorts,
    state.selectedResort?.id,
    handleResortSelect,
  );

  // 3. Render Content
  UI.renderItinerary(destData.itinerary);
  UI.updateCost(state.tourData, state.selectedResort);
}

// --- HANDLERS ---
function handleDestinationSwitch(destKey) {
  state.currentDestination = destKey;
  state.selectedResort = null;
  UI.hideResortDetails();
  renderAppState();
}

function handleResortSelect(resort) {
  state.selectedResort = resort;
  UI.showResortDetails(resort);
  MapService.renderMarkers(
    state.tourData.destinations[state.currentDestination].resorts,
    resort.id,
    handleResortSelect,
  );
  UI.updateCost(state.tourData, resort);
}

// --- EVENT LISTENERS ---
function attachGlobalListeners() {
  // Widget Toggle
  const toggleBtn = document.getElementById("dataWidgetToggle");
  const content = document.getElementById("dataWidgetContent");
  let isExpanded = false;

  toggleBtn.addEventListener("click", () => {
    isExpanded = !isExpanded;
    if (isExpanded) {
      content.classList.remove(
        "translate-y-10",
        "opacity-0",
        "pointer-events-none",
      );
      toggleBtn.classList.add("rotate-180", "bg-emerald-800");
    } else {
      content.classList.add(
        "translate-y-10",
        "opacity-0",
        "pointer-events-none",
      );
      toggleBtn.classList.remove("rotate-180", "bg-emerald-800");
    }
  });

  // File Upload
  document
    .getElementById("fileUpload")
    .addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          let newData;
          if (file.name.endsWith(".csv")) {
            newData = DataService.parseCSV(evt.target.result);
          } else {
            newData = JSON.parse(evt.target.result);
          }

          if (!newData.destinations) throw new Error("Invalid Format");

          DataService.saveLocal(newData, file.name);
          showToast(`Uploaded ${file.name}`, "success");
          await initApp(); // Reload app state
        } catch (err) {
          showToast(err.message, "error");
        }
        e.target.value = ""; // Reset input
      };
      reader.readAsText(file);
    });

  // Reset Data
  document
    .getElementById("resetDataBtn")
    .addEventListener("click", async () => {
      DataService.clearLocal();
      showToast("Resetting to default...", "warning");
      await initApp();
    });

  // Cost Calculator Inputs
  ["people", "couple", "family"].forEach((type) => {
    document
      .getElementById(`${type}-minus`)
      .addEventListener("click", () => updateInput(type, -1));
    document
      .getElementById(`${type}-plus`)
      .addEventListener("click", () => updateInput(type, 1));
  });

  // Listen for direct input changes
  ["totalPeople", "coupleRooms", "familyRooms"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      if (id === "totalPeople") syncRoomsToPeople();
      else syncPeopleToRooms();
    });
  });

  document.getElementById("closeResortBtn").addEventListener("click", () => {
    state.selectedResort = null;
    UI.hideResortDetails();
    MapService.renderMarkers(
      state.tourData.destinations[state.currentDestination].resorts,
      null,
      handleResortSelect,
    );
    UI.updateCost(state.tourData, null);
  });
}

// Logic for input updates
function updateInput(type, delta) {
  const map = {
    people: "totalPeople",
    couple: "coupleRooms",
    family: "familyRooms",
  };
  const id = map[type];
  const input = document.getElementById(id);
  input.value = Math.max(
    type === "people" ? 1 : 0,
    parseInt(input.value) + delta,
  );

  if (type === "people") syncRoomsToPeople();
  else syncPeopleToRooms();
}

function syncRoomsToPeople() {
  UI.updateCost(state.tourData, state.selectedResort);
}

function syncPeopleToRooms() {
  const couple = parseInt(document.getElementById("coupleRooms").value) || 0;
  const family = parseInt(document.getElementById("familyRooms").value) || 0;
  document.getElementById("totalPeople").value = couple * 2 + family * 4;
  UI.updateCost(state.tourData, state.selectedResort);
}
