import { showToast } from "./utils.js";
import { DataService } from "./data.js";

// --- STATE ---
let editorState = {
  baseCosts: { bus: 50000, foodPerPerson: 2000, activitiesPerPerson: 1000 },
  destinations: {},
};
let activeDestId = null;
let pickerTarget = null; // { type: 'dest' | 'resort', index: number }
let mapInstance = null;
let currentMapCenter = [23.8103, 90.4125]; // Default Dhaka

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  setupEventListeners();
});

function initEditor() {
  // Try to load existing data from local or default
  const localData = localStorage.getItem("tourData");
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (parsed.destinations) {
        editorState = parsed;
        showToast("Loaded stored data", "success");
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    // Initialize with default template if nothing exists
    createDestination("bandarban"); // Default starter
  }

  renderGlobalSettings();
  renderDestList();
}

// --- RENDERING ---

function renderGlobalSettings() {
  document.getElementById("costBus").value = editorState.baseCosts.bus || 0;
  document.getElementById("costFood").value =
    editorState.baseCosts.foodPerPerson || 0;
  document.getElementById("costActivity").value =
    editorState.baseCosts.activitiesPerPerson || 0;
}

function renderDestList() {
  const list = document.getElementById("destList");
  list.innerHTML = "";

  Object.keys(editorState.destinations).forEach((id) => {
    const div = document.createElement("div");
    div.className = `p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${activeDestId === id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-gray-100 border border-transparent"}`;
    div.innerHTML = `
            <span class="font-medium text-sm text-gray-700 capitalize">${id}</span>
            ${activeDestId === id ? '<span class="w-2 h-2 rounded-full bg-emerald-500"></span>' : ""}
        `;
    div.onclick = () => switchDestination(id);
    list.appendChild(div);
  });

  // Update Main View
  const emptyState = document.getElementById("emptyState");
  const activeEditor = document.getElementById("activeEditor");

  if (activeDestId) {
    emptyState.classList.add("hidden");
    activeEditor.classList.remove("hidden");
    renderActiveEditor();
  } else {
    emptyState.classList.remove("hidden");
    activeEditor.classList.add("hidden");
  }
}

function renderActiveEditor() {
  if (!activeDestId) return;
  const data = editorState.destinations[activeDestId];

  // Dest Config
  document.getElementById("destId").value = activeDestId;
  document.getElementById("destLat").value = data.center[0];
  document.getElementById("destLng").value = data.center[1];

  // Resorts
  const resortsList = document.getElementById("resortsList");
  resortsList.innerHTML = "";
  data.resorts.forEach((resort, idx) => {
    const el = document.createElement("div");
    el.className =
      "bg-gray-50 p-4 rounded-lg border border-gray-200 relative group";
    el.innerHTML = `
            <button onclick="removeResort(${idx})" class="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            <div class="grid grid-cols-12 gap-3">
                <div class="col-span-1 flex flex-col items-center justify-center bg-gray-200 rounded text-gray-500 font-bold text-lg">
                    ${idx + 1}
                </div>
                <div class="col-span-11 space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Resort Name" class="w-full p-2 border rounded text-sm font-bold" value="${resort.name || ""}" onchange="updateResort(${idx}, 'name', this.value)">
                        <input type="number" placeholder="Price/Night" class="w-full p-2 border rounded text-sm" value="${resort.pricePerNight || ""}" onchange="updateResort(${idx}, 'pricePerNight', this.value)">
                    </div>
                    <input type="text" placeholder="Address/Location" class="w-full p-2 border rounded text-sm" value="${resort.location || ""}" onchange="updateResort(${idx}, 'location', this.value)">
                    
                    <div class="flex gap-2">
                        <input type="number" step="0.0001" placeholder="Lat" class="w-1/3 p-2 border rounded text-sm bg-white" value="${resort.lat || ""}" id="resort-lat-${idx}" onchange="updateResort(${idx}, 'lat', this.value)">
                        <input type="number" step="0.0001" placeholder="Lng" class="w-1/3 p-2 border rounded text-sm bg-white" value="${resort.lng || ""}" id="resort-lng-${idx}" onchange="updateResort(${idx}, 'lng', this.value)">
                        <button onclick="openPicker('resort', ${idx})" class="bg-blue-50 text-blue-600 px-3 rounded border border-blue-100 hover:bg-blue-100 text-xs font-bold">Pick Map</button>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="Contact No" class="p-2 border rounded text-sm" value="${resort.contact || ""}" onchange="updateResort(${idx}, 'contact', this.value)">
                        <input type="text" placeholder="Email" class="p-2 border rounded text-sm" value="${resort.email || ""}" onchange="updateResort(${idx}, 'email', this.value)">
                        <input type="number" step="0.1" max="5" placeholder="Rating (0-5)" class="p-2 border rounded text-sm" value="${resort.rating || ""}" onchange="updateResort(${idx}, 'rating', this.value)">
                    </div>

                    <input type="text" placeholder="Image URL (Unsplash/Direct Link)" class="w-full p-2 border rounded text-sm font-mono text-xs text-gray-500" value="${resort.image || ""}" onchange="updateResort(${idx}, 'image', this.value)">
                    <input type="text" placeholder="Activities (comma separated: Pool, Trekking)" class="w-full p-2 border rounded text-sm" value="${(resort.activities || []).join(", ")}" onchange="updateResort(${idx}, 'activities', this.value)">
                </div>
            </div>
        `;
    resortsList.appendChild(el);
  });

  // Itinerary
  const itinList = document.getElementById("itineraryList");
  itinList.innerHTML = "";
  (data.itinerary || []).forEach((day, idx) => {
    const el = document.createElement("div");
    el.className = "bg-blue-50 p-3 rounded-lg border border-blue-100 relative";
    el.innerHTML = `
            <button onclick="removeDay(${idx})" class="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs font-bold">Remove</button>
            <input type="text" class="bg-transparent font-bold text-blue-800 mb-2 border-b border-transparent hover:border-blue-300 focus:outline-none" value="${day.day}" onchange="updateDay(${idx}, 'day', this.value)">
            <textarea class="w-full text-sm p-2 rounded border border-blue-200 h-20" placeholder="Activities (One per line, format: Time - Activity)" onchange="updateDayItems(${idx}, this.value)">${day.items.map((i) => `${i.time} - ${i.activity}`).join("\n")}</textarea>
        `;
    itinList.appendChild(el);
  });
}

// --- ACTIONS & LOGIC ---

window.switchDestination = (id) => {
  activeDestId = id;
  renderDestList();
};

window.createDestination = (name) => {
  const id = name || prompt("Enter Destination Name (e.g., sylhet):");
  if (!id) return;

  const key = id.toLowerCase().replace(/\s+/g, "-");
  if (editorState.destinations[key]) {
    showToast("Destination already exists", "error");
    return;
  }

  editorState.destinations[key] = {
    center: [23.8, 90.4],
    zoom: 11,
    resorts: [],
    itinerary: [
      { day: "Day 1", items: [{ time: "Morning", activity: "Arrival" }] },
    ],
  };
  activeDestId = key;
  renderDestList();
};

document.getElementById("addDestBtn").onclick = () => createDestination();

document.getElementById("deleteDestBtn").onclick = () => {
  if (confirm(`Delete ${activeDestId}? This cannot be undone.`)) {
    delete editorState.destinations[activeDestId];
    activeDestId = Object.keys(editorState.destinations)[0] || null;
    renderDestList();
  }
};

// Global Inputs
["costBus", "costFood", "costActivity"].forEach((id) => {
  document.getElementById(id).addEventListener("change", (e) => {
    const key =
      id === "costBus"
        ? "bus"
        : id === "costFood"
          ? "foodPerPerson"
          : "activitiesPerPerson";
    editorState.baseCosts[key] = parseInt(e.target.value) || 0;
  });
});

// Destination Inputs
document.getElementById("destLat").addEventListener("change", (e) => {
  if (activeDestId)
    editorState.destinations[activeDestId].center[0] = parseFloat(
      e.target.value,
    );
});
document.getElementById("destLng").addEventListener("change", (e) => {
  if (activeDestId)
    editorState.destinations[activeDestId].center[1] = parseFloat(
      e.target.value,
    );
});

// Resort Actions
document.getElementById("addResortBtn").onclick = () => {
  const dest = editorState.destinations[activeDestId];
  dest.resorts.push({
    id: Date.now(),
    name: "New Resort",
    location: "Location",
    pricePerNight: 4000,
    lat: dest.center[0],
    lng: dest.center[1],
    rating: 4.0,
    activities: [],
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
  });
  renderActiveEditor();
};

window.removeResort = (idx) => {
  if (confirm("Remove this resort?")) {
    editorState.destinations[activeDestId].resorts.splice(idx, 1);
    renderActiveEditor();
  }
};

window.updateResort = (idx, field, value) => {
  const resort = editorState.destinations[activeDestId].resorts[idx];
  if (field === "pricePerNight" || field === "rating")
    value = parseFloat(value);
  if (field === "lat" || field === "lng") value = parseFloat(value);
  if (field === "activities")
    value = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

  resort[field] = value;
};

// Itinerary Actions
document.getElementById("addDayBtn").onclick = () => {
  const days = editorState.destinations[activeDestId].itinerary;
  days.push({ day: `Day ${days.length + 1}`, items: [] });
  renderActiveEditor();
};

window.removeDay = (idx) => {
  editorState.destinations[activeDestId].itinerary.splice(idx, 1);
  renderActiveEditor();
};

window.updateDay = (idx, field, value) => {
  editorState.destinations[activeDestId].itinerary[idx][field] = value;
};

window.updateDayItems = (idx, text) => {
  const lines = text.split("\n");
  const items = lines
    .map((line) => {
      const parts = line.split("-");
      if (parts.length > 1) {
        return {
          time: parts[0].trim(),
          activity: parts.slice(1).join("-").trim(),
        };
      }
      return { time: "", activity: line.trim() };
    })
    .filter((i) => i.activity);
  editorState.destinations[activeDestId].itinerary[idx].items = items;
};

// --- MAP PICKER ---

window.openPicker = (type, index = null) => {
  pickerTarget = { type, index };
  const modal = document.getElementById("mapModal");
  modal.classList.remove("hidden");

  if (!mapInstance) {
    mapInstance = L.map("pickerMap").setView(currentMapCenter, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      mapInstance,
    );

    mapInstance.on("move", () => {
      const center = mapInstance.getCenter();
      document.getElementById("mapCoords").textContent =
        `Lat: ${center.lat.toFixed(4)}, Lng: ${center.lng.toFixed(4)}`;
    });
  }

  // Set view to current target location if valid
  let lat, lng;
  if (type === "dest") {
    [lat, lng] = editorState.destinations[activeDestId].center;
  } else {
    const r = editorState.destinations[activeDestId].resorts[index];
    lat = r.lat;
    lng = r.lng;
  }

  if (lat && lng) {
    mapInstance.setView([lat, lng], 14);
  }

  setTimeout(() => mapInstance.invalidateSize(), 100); // Fix rendering glitch
};

document.getElementById("closeMapBtn").onclick = () => {
  document.getElementById("mapModal").classList.add("hidden");
};

document.querySelectorAll(".pick-map-btn").forEach((btn) => {
  btn.onclick = () => openPicker(btn.dataset.target);
});

document.getElementById("confirmPickBtn").onclick = () => {
  const center = mapInstance.getCenter();
  const lat = parseFloat(center.lat.toFixed(5));
  const lng = parseFloat(center.lng.toFixed(5));

  if (pickerTarget.type === "dest") {
    editorState.destinations[activeDestId].center = [lat, lng];
    document.getElementById("destLat").value = lat;
    document.getElementById("destLng").value = lng;
  } else {
    const idx = pickerTarget.index;
    editorState.destinations[activeDestId].resorts[idx].lat = lat;
    editorState.destinations[activeDestId].resorts[idx].lng = lng;
    document.getElementById(`resort-lat-${idx}`).value = lat;
    document.getElementById(`resort-lng-${idx}`).value = lng;
  }

  showToast("Location updated!", "success");
  document.getElementById("mapModal").classList.add("hidden");
  currentMapCenter = [lat, lng];
};

// --- IMPORT / EXPORT ---

document.getElementById("exportJSON").onclick = () => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(editorState, null, 2));
  const node = document.createElement("a");
  node.setAttribute("href", dataStr);
  node.setAttribute("download", "tour_data.json");
  document.body.appendChild(node);
  node.click();
  node.remove();
  showToast("JSON Downloaded", "success");
};

document.getElementById("downloadResortCSV").onclick = () => {
  if (!activeDestId) return;

  const resorts = editorState.destinations[activeDestId].resorts;
  const headers = [
    "name",
    "location",
    "pricePerNight",
    "lat",
    "lng",
    "rating",
    "contact",
    "email",
    "image",
    "activities",
  ];

  const csvContent = [
    headers.join(","),
    ...resorts.map((r) => {
      return headers
        .map((h) => {
          let val = r[h] || "";
          if (h === "activities" && Array.isArray(val)) val = val.join(";");
          // Escape commas in values
          if (typeof val === "string" && val.includes(",")) val = `"${val}"`;
          return val;
        })
        .join(",");
    }),
  ].join("\n");

  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${activeDestId}_resorts.csv`);
  document.body.appendChild(link);
  link.click();
  showToast("CSV Downloaded", "success");
};

document.getElementById("importFile").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      if (file.name.endsWith(".json")) {
        const data = JSON.parse(evt.target.result);
        if (data.destinations) {
          editorState = data;
          activeDestId = Object.keys(data.destinations)[0];
          renderGlobalSettings();
          renderDestList();
          showToast("JSON Imported", "success");
        } else {
          throw new Error("Invalid JSON structure");
        }
      } else if (file.name.endsWith(".csv")) {
        const parsed = DataService.parseCSV(evt.target.result); // Reusing logic logic via module? No, let's copy simplified logic here to be safe or import if using modules.
        // Actually, importing DataService is cleaner, but parseCSV returns a full object structure for "custom-import".
        // Let's implement a specific CSV merge for the editor.

        const lines = evt.target.result.split("\n").filter((l) => l.trim());
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const newResorts = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(","); // Basic split
          let r = { activities: [] };
          headers.forEach((h, idx) => {
            let val = row[idx] ? row[idx].trim().replace(/^"|"$/g, "") : ""; // Remove quotes
            if (h === "activities")
              r.activities = val.split(";").map((s) => s.trim());
            else if (["lat", "lng", "rating", "pricePerNight"].includes(h))
              r[h] = parseFloat(val);
            else r[h] = val;
          });
          r.id = Date.now() + i;
          newResorts.push(r);
        }

        if (activeDestId) {
          editorState.destinations[activeDestId].resorts.push(...newResorts);
          renderActiveEditor();
          showToast(`Added ${newResorts.length} resorts from CSV`, "success");
        } else {
          showToast("Select a destination first", "warning");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Import failed", "error");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
};

function setupEventListeners() {
  // Already set up inline or via IDs above
}
