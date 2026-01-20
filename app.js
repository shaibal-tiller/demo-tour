import { DataService } from "./js/data.js";
import { MapService } from "./js/map.js";
import { UI } from "./js/ui.js";
import { showToast } from "./js/utils.js";

const state = {
  tourData: null,
  currentDestination: null,
  selectedResort: null,
};

document.addEventListener("DOMContentLoaded", async () => {
  attachGlobalListeners();
  await initApp();
});

async function initApp() {
  const loaded = await DataService.load();

  if (loaded && loaded.data) {
    state.tourData = loaded.data;
    UI.updateStorageIndicator(loaded.source === "local", loaded.filename);

    const destKeys = Object.keys(state.tourData.destinations);

    if (destKeys.length > 0) {
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

function renderAppState() {
  const destKeys = Object.keys(state.tourData.destinations);
  const destData = state.tourData.destinations[state.currentDestination];

  UI.renderTabs(destKeys, state.currentDestination, handleDestinationSwitch);
  MapService.init(destData);
  MapService.renderMarkers(
    destData.resorts,
    state.selectedResort?.id,
    handleResortSelect,
  );
  UI.renderItinerary(destData.itinerary);
  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);

  window.removeEventListener("resize", handleResize);
  window.addEventListener("resize", handleResize);
}

function handleResize() {
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
  UI.updateCost(state.tourData, state.currentDestination, resort);
}

function updateInput(type, delta) {
  const map = {
    people: "totalPeople",
    couple: "coupleRooms",
    family: "familyRooms",
    dorm: "dormRooms",
  };
  const id = map[type];
  const input = document.getElementById(id);
  const minVal = type === "people" ? 1 : 0;
  const newVal = Math.max(minVal, (parseInt(input.value) || 0) + delta);
  input.value = newVal;

  if (type === "people") syncRoomsToPeople();
  else syncPeopleToRooms();
}

function syncRoomsToPeople() {
  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);
}

function syncPeopleToRooms() {
  const couple = parseInt(document.getElementById("coupleRooms").value) || 0;
  const family = parseInt(document.getElementById("familyRooms").value) || 0;
  const dorm = parseInt(document.getElementById("dormRooms").value) || 0;
  const newTotal = couple * 2 + family * 4 + dorm * 6;
  document.getElementById("totalPeople").value = Math.max(1, newTotal);
  UI.updateCost(state.tourData, state.currentDestination, state.selectedResort);
}

function attachGlobalListeners() {
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
            DataService.migrateData(newData);
          }
          if (!newData.destinations) throw new Error("Invalid Data Format");
          DataService.saveLocal(newData, file.name);
          showToast(`Uploaded ${file.name} successfully`, "success");
          await initApp();
        } catch (err) {
          showToast(err.message, "error");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    });
  }

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

  ["people", "couple", "family", "dorm"].forEach((type) => {
    const minusBtn = document.getElementById(`${type}-minus`);
    const plusBtn = document.getElementById(`${type}-plus`);
    if (minusBtn)
      minusBtn.addEventListener("click", () => updateInput(type, -1));
    if (plusBtn) plusBtn.addEventListener("click", () => updateInput(type, 1));
  });

  ["totalPeople", "coupleRooms", "familyRooms", "dormRooms"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
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

  const closeResortBtn = document.getElementById("closeResortBtn");
  if (closeResortBtn) {
    closeResortBtn.addEventListener("click", () => {
      state.selectedResort = null;
      UI.hideResortDetails();
      MapService.renderMarkers(
        state.tourData.destinations[state.currentDestination].resorts,
        null,
        handleResortSelect,
      );
      UI.updateCost(state.tourData, state.currentDestination, null);
    });
  }
}
