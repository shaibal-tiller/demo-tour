// app.js

import { DataService } from "./js/data.js";
import { MapService } from "./js/map.js";
import { UI } from "./js/ui.js";
import { showToast } from "./js/utils.js";

// --- APPLICATION STATE ---
const state = {
  tourData: null,
  currentDestination: null, // The string ID (e.g., "bandarban")
  selectedResort: null, // The resort object
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  attachGlobalListeners();
  await initApp();
});

/**
 * Main Initialization Sequence
 * 1. Loads data (checks local storage, then falls back to online JSON)
 * 2. Updates the UI to show where data came from
 * 3. Renders the main application view
 */
async function initApp() {
  const loaded = await DataService.load();

  if (loaded && loaded.data) {
    state.tourData = loaded.data;

    // Update the "Using Custom Data" indicator in the UI
    UI.updateStorageIndicator(loaded.source === "local", loaded.filename);

    const dests = Object.keys(state.tourData.destinations);

    if (dests.length > 0) {
      // Ensure we have a valid current destination
      // If state.currentDestination is null or doesn't exist in new data, default to first one
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

/**
 * Renders the entire application state based on current data
 */
function renderAppState() {
  const destKeys = Object.keys(state.tourData.destinations);
  const destData = state.tourData.destinations[state.currentDestination];

  // 1. Render Navigation Tabs (or Dropdown for mobile)
  UI.renderTabs(destKeys, state.currentDestination, handleDestinationSwitch);

  // 2. Setup Map
  MapService.init(destData);
  MapService.renderMarkers(
    destData.resorts,
    state.selectedResort?.id,
    handleResortSelect,
  );

  // 3. Render Content Sections
  UI.renderItinerary(destData.itinerary);

  // 4. Calculate Costs
  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);

  // Add resize listener to handle switching between Tabs and Dropdown on window resize
  // We remove it first to avoid duplicates if initApp is called multiple times
  window.removeEventListener("resize", handleResize);
  window.addEventListener("resize", handleResize);
}

// --- HANDLERS ---

function handleResize() {
  // Re-render only tabs on resize to switch between button/select view
  if (state.tourData) {
    UI.renderTabs(
      Object.keys(state.tourData.destinations),
      state.currentDestination,
      handleDestinationSwitch,
    );
  }
}

function handleDestinationSwitch(destKey) {
  if (state.currentDestination === destKey) return;

  state.currentDestination = destKey;
  state.selectedResort = null; // Reset selection when switching places

  UI.hideResortDetails();
  renderAppState();
}

function handleResortSelect(resort) {
  state.selectedResort = resort;

  // Show details panel
  UI.showResortDetails(resort);

  // Update map markers to highlight selection
  MapService.renderMarkers(
    state.tourData.destinations[state.currentDestination].resorts,
    resort.id,
    handleResortSelect,
  );

  // Recalculate cost with resort price
  UI.updateCost(state.tourData, state.currentDestination, resort);
}

// --- INPUT LOGIC HANDLERS ---

function updateInput(type, delta) {
  const map = {
    people: "totalPeople",
    couple: "coupleRooms",
    family: "familyRooms",
  };
  const id = map[type];
  const input = document.getElementById(id);

  // Prevent negative values (people min 1, rooms min 0)
  const minVal = type === "people" ? 1 : 0;
  const newVal = Math.max(minVal, (parseInt(input.value) || 0) + delta);

  input.value = newVal;

  // Trigger sync logic
  if (type === "people") syncRoomsToPeople();
  else syncPeopleToRooms();
}

/**
 * When Total People changes -> Update Cost (Keep rooms as is, or you could add logic to suggest rooms)
 */
function syncRoomsToPeople() {
  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);
}

/**
 * When Rooms change -> Update Total People count automatically
 * (2 per couple room, 4 per family room)
 */
function syncPeopleToRooms() {
  const couple = parseInt(document.getElementById("coupleRooms").value) || 0;
  const family = parseInt(document.getElementById("familyRooms").value) || 0;

  const newTotal = couple * 2 + family * 4;

  // Only update if rooms create more capacity than 0, otherwise keep people at 1
  document.getElementById("totalPeople").value = Math.max(1, newTotal);

  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);
}

// --- EVENT LISTENERS ---

function attachGlobalListeners() {
  // 1. Data Management Widget Toggle
  const toggleBtn = document.getElementById("dataWidgetToggle");
  const content = document.getElementById("dataWidgetContent");
  let isExpanded = false;

  if (toggleBtn && content) {
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
  }

  // 2. File Upload Handling
  const fileUpload = document.getElementById("fileUpload");
  if (fileUpload) {
    fileUpload.addEventListener("change", async (e) => {
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

          if (!newData.destinations)
            throw new Error("Invalid Data Format: Missing 'destinations'");

          // Save to LocalStorage
          DataService.saveLocal(newData, file.name);
          showToast(`Uploaded ${file.name} successfully`, "success");

          // Reload App
          await initApp();
        } catch (err) {
          showToast(err.message, "error");
          console.error(err);
        }
        e.target.value = ""; // Reset input to allow re-uploading same file
      };
      reader.readAsText(file);
    });
  }

  // 3. Reset Data Button
  const resetBtn = document.getElementById("resetDataBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      if (confirm("Clear custom data and revert to default?")) {
        DataService.clearLocal();
        showToast("Reverted to default data", "warning");
        await initApp();
      }
    });
  }

  // 4. Cost Calculator Buttons (+ / -)
  ["people", "couple", "family"].forEach((type) => {
    const minusBtn = document.getElementById(`${type}-minus`);
    const plusBtn = document.getElementById(`${type}-plus`);

    if (minusBtn)
      minusBtn.addEventListener("click", () => updateInput(type, -1));
    if (plusBtn) plusBtn.addEventListener("click", () => updateInput(type, 1));
  });

  // 5. Cost Calculator Direct Inputs
  ["totalPeople", "coupleRooms", "familyRooms"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        // Ensure value is valid
        if (el.value === "" || parseInt(el.value) < 0) el.value = 0;

        if (id === "totalPeople") {
          if (parseInt(el.value) < 1) el.value = 1;
          syncRoomsToPeople();
        } else {
          syncPeopleToRooms();
        }
      });
    }
  });

  // 6. Close Resort Details Button
  const closeResortBtn = document.getElementById("closeResortBtn");
  if (closeResortBtn) {
    closeResortBtn.addEventListener("click", () => {
      state.selectedResort = null;
      UI.hideResortDetails();

      // Un-highlight map marker
      MapService.renderMarkers(
        state.tourData.destinations[state.currentDestination].resorts,
        null,
        handleResortSelect,
      );

      // Reset cost to standard (no resort selected)
      UI.updateCost(state.tourData, state.currentDestination, null);
    });
  }
}
