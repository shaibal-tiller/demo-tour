// app.js

import { DataService } from "./js/data.js";
import { MapService } from "./js/map.js";
import { UI } from "./js/ui.js";
import { showToast } from "./js/utils.js";

// --- APPLICATION STATE ---
const state = {
  tourData: null,
  currentDestination: null, // e.g. "bandarban"
  selectedResort: null, // Resort Object
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  attachGlobalListeners();
  await initApp();
});

/**
 * Main App Startup
 * 1. Loads data from LocalStorage or Online JSON
 * 2. Sets up initial state
 * 3. Renders the App
 */
async function initApp() {
  const loaded = await DataService.load();

  if (loaded && loaded.data) {
    state.tourData = loaded.data;
    UI.updateStorageIndicator(loaded.source === "local", loaded.filename);

    const destKeys = Object.keys(state.tourData.destinations);

    if (destKeys.length > 0) {
      // Validate State: If current dest is missing in new data, reset to first one
      if (
        !state.currentDestination ||
        !state.tourData.destinations[state.currentDestination]
      ) {
        state.currentDestination = destKeys[0];
      }
      renderAppState();
    } else {
      showToast("No destinations found in data.", "error");
    }
  }
}

/**
 * Orchestrates the rendering of all UI components
 */
function renderAppState() {
  const destKeys = Object.keys(state.tourData.destinations);
  const destData = state.tourData.destinations[state.currentDestination];

  // 1. Render Navigation (Tabs or Dropdown)
  UI.renderTabs(destKeys, state.currentDestination, handleDestinationSwitch);

  // 2. Initialize/Update Map
  MapService.init(destData);
  MapService.renderMarkers(
    destData.resorts,
    state.selectedResort?.id,
    handleResortSelect,
  );

  // 3. Render Itinerary List
  UI.renderItinerary(destData.itinerary);

  // 4. Calculate & Display Costs
  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);

  // Resize Listener: Switch between Tabs/Select on resize
  window.removeEventListener("resize", handleResize);
  window.addEventListener("resize", handleResize);
}

// --- LOGIC HANDLERS ---

function handleResize() {
  // Re-render tabs only to adjust layout
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
  state.selectedResort = null; // Reset selection

  UI.hideResortDetails();
  renderAppState();
}

function handleResortSelect(resort) {
  state.selectedResort = resort;

  UI.showResortDetails(resort);

  // Highlight marker on map
  MapService.renderMarkers(
    state.tourData.destinations[state.currentDestination].resorts,
    resort.id,
    handleResortSelect,
  );

  // Update costs with specific resort pricing
  UI.updateCost(state.tourData, state.currentDestination, resort);
}

// --- COST CALCULATOR LOGIC ---

/**
 * Handles + / - buttons for People and Rooms
 */
function updateInput(type, delta) {
  // Map button types to HTML IDs
  const map = {
    people: "totalPeople",
    couple: "coupleRooms",
    family: "familyRooms",
    dorm: "dormRooms",
  };
  const id = map[type];
  const input = document.getElementById(id);

  // Calculate new value (People min 1, Rooms min 0)
  const minVal = type === "people" ? 1 : 0;
  const newVal = Math.max(minVal, (parseInt(input.value) || 0) + delta);

  input.value = newVal;

  // Sync logic
  if (type === "people") syncRoomsToPeople();
  else syncPeopleToRooms();
}

/**
 * Triggered when Total People changes manually.
 * Just recalculates cost (does not auto-adjust rooms).
 */
function syncRoomsToPeople() {
  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);
}

/**
 * Triggered when Room counts change.
 * Automatically updates Total People based on room capacity.
 */
function syncPeopleToRooms() {
  const couple = parseInt(document.getElementById("coupleRooms").value) || 0;
  const family = parseInt(document.getElementById("familyRooms").value) || 0;
  const dorm = parseInt(document.getElementById("dormRooms").value) || 0;

  // Calculation: Couple(2), Family(4), Dorm(6)
  const newTotal = couple * 2 + family * 4 + dorm * 6;

  // Ensure at least 1 person if rooms exist, else 1
  document.getElementById("totalPeople").value = Math.max(1, newTotal);

  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);
}

// --- EVENT LISTENERS ---

function attachGlobalListeners() {
  // 1. Widget Toggle (Data Management)
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

  // 2. File Upload (JSON/CSV)
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
            DataService.migrateData(newData); // Ensure format is current
          }

          if (!newData.destinations) throw new Error("Invalid Data Format");

          DataService.saveLocal(newData, file.name);
          showToast(`Uploaded ${file.name} successfully`, "success");

          await initApp(); // Reload with new data
        } catch (err) {
          showToast(err.message, "error");
          console.error(err);
        }
        e.target.value = ""; // Reset input
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
  ["people", "couple", "family", "dorm"].forEach((type) => {
    const minusBtn = document.getElementById(`${type}-minus`);
    const plusBtn = document.getElementById(`${type}-plus`);

    if (minusBtn)
      minusBtn.addEventListener("click", () => updateInput(type, -1));
    if (plusBtn) plusBtn.addEventListener("click", () => updateInput(type, 1));
  });

  // 5. Cost Calculator Direct Inputs (Manual Typing)
  ["totalPeople", "coupleRooms", "familyRooms", "dormRooms"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        // Validation
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

  // 6. Close Resort Details
  const closeResortBtn = document.getElementById("closeResortBtn");
  if (closeResortBtn) {
    closeResortBtn.addEventListener("click", () => {
      state.selectedResort = null;
      UI.hideResortDetails();

      // Remove highlight
      MapService.renderMarkers(
        state.tourData.destinations[state.currentDestination].resorts,
        null,
        handleResortSelect,
      );

      // Revert to general cost
      UI.updateCost(state.tourData, state.currentDestination, null);
    });
  }
}
