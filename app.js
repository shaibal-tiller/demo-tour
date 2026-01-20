let map;
let markers = [];
let currentDestination = "";
let selectedResort = null;
let tourData = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  attachDataControls(); // Attach widget controls immediately
  loadData(); // Then load data
  attachGlobalListeners();
});

// --- Toast Notification System ---
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  // Toast Styles
  const baseClasses =
    "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full opacity-0 max-w-sm pointer-events-auto border-l-4";
  let typeClasses = "";
  let icon = "";

  if (type === "success") {
    typeClasses = "bg-white text-gray-800 border-emerald-500";
    icon = `<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
  } else if (type === "error") {
    typeClasses = "bg-white text-gray-800 border-red-500";
    icon = `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  } else if (type === "warning") {
    typeClasses = "bg-white text-gray-800 border-orange-500";
    icon = `<svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
  } else {
    typeClasses = "bg-white text-gray-800 border-blue-500";
    icon = `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  }

  toast.className = `${baseClasses} ${typeClasses}`;
  toast.innerHTML = `
        <div class="shrink-0">${icon}</div>
        <p class="text-sm font-medium">${message}</p>
    `;

  container.appendChild(toast);

  // Animate In
  requestAnimationFrame(() => {
    toast.classList.remove("translate-x-full", "opacity-0");
  });

  // Auto Dismiss
  setTimeout(() => {
    toast.classList.add("translate-x-full", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function loadData() {
  try {
    // 1. Check LocalStorage first
    const localData = localStorage.getItem("tourData");
    const filename = localStorage.getItem("tourDataFilename");

    if (localData) {
      tourData = JSON.parse(localData);
      showToast(`Loaded from Local: ${filename || "Custom Data"}`, "success");
      showStorageIndicator(true, filename);
      initAppWithData();
    } else {
      // 2. Fallback to default data.json
      const response = await fetch("./data.json");
      if (!response.ok) throw new Error("Could not load data.json");
      tourData = await response.json();

      showToast("Loaded default data from Online", "info");
      showStorageIndicator(false);
      initAppWithData();
    }
  } catch (error) {
    console.error("Error loading tour data:", error);
    showToast("Failed to load data. Please check console.", "error");
  }
}

function initAppWithData() {
  if (!tourData || !tourData.destinations) {
    showToast("Data appears invalid or empty.", "error");
    return;
  }

  const destinations = Object.keys(tourData.destinations);
  if (destinations.length > 0) {
    // Check if current destination still exists in new data, else reset
    if (!currentDestination || !tourData.destinations[currentDestination]) {
      currentDestination = destinations[0];
    }

    renderDestinationTabs(destinations);
    initMap();
    renderItinerary();
    updateCosts();
  } else {
    showToast("No destinations found in data.", "warning");
  }
}

// --- Data Control Widget Logic ---

function attachDataControls() {
  const toggleBtn = document.getElementById("dataWidgetToggle");
  const content = document.getElementById("dataWidgetContent");
  const fileInput = document.getElementById("fileUpload");
  const resetBtn = document.getElementById("resetDataBtn");
  let isExpanded = false;

  // Toggle Animation
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

  // File Upload Handler
  fileInput.addEventListener("change", handleFileUpload);

  // Reset Handler
  resetBtn.addEventListener("click", resetToDefault);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const content = e.target.result;

    try {
      let newData;

      if (file.name.endsWith(".csv")) {
        newData = parseCSVtoData(content);
      } else {
        newData = JSON.parse(content);
      }

      // Simple validation
      if (!newData.destinations && !newData.baseCosts) {
        throw new Error("Invalid data structure");
      }

      // Save
      localStorage.setItem("tourData", JSON.stringify(newData));
      localStorage.setItem("tourDataFilename", file.name); // Save filename

      // Re-initialize without reload
      tourData = newData;
      showToast(`Loaded ${file.name} successfully!`, "success");
      showStorageIndicator(true, file.name);
      initAppWithData();
    } catch (err) {
      console.error(err);
      showToast("Error parsing file: " + err.message, "error");
    }

    // Clear input so same file can be selected again if needed
    event.target.value = "";
  };

  reader.readAsText(file);
}

function resetToDefault() {
  localStorage.removeItem("tourData");
  localStorage.removeItem("tourDataFilename");
  showToast("Clearing local data...", "warning");

  // Reload data from online
  loadData();
}

function showStorageIndicator(isCustom, filename = "") {
  const el = document.getElementById("storageIndicator");
  const msg = document.getElementById("storageMsg");

  if (isCustom) {
    el.classList.remove("hidden");
    msg.textContent = `Using: ${filename || "Custom Data"}`;
  } else {
    el.classList.add("hidden");
  }
}

// --- CSV Helper (Same as before) ---
function parseCSVtoData(csvText) {
  const lines = csvText.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const resorts = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    if (row.length < headers.length) continue;

    let resort = { id: i, activities: [] };

    headers.forEach((header, index) => {
      const val = row[index] ? row[index].trim() : "";

      if (header.includes("price"))
        resort.pricePerNight = parseInt(val) || 5000;
      else if (header.includes("lat")) resort.lat = parseFloat(val);
      else if (header.includes("lng")) resort.lng = parseFloat(val);
      else if (header.includes("rating")) resort.rating = parseFloat(val);
      else if (header.includes("activities"))
        resort.activities = val.split(";").map((s) => s.trim());
      else resort[header] = val;
    });

    if (!resort.lat) resort.lat = 22.2;
    if (!resort.lng) resort.lng = 92.2;
    if (!resort.image)
      resort.image =
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop";

    resorts.push(resort);
  }

  return {
    baseCosts: { bus: 50000, foodPerPerson: 2000, activitiesPerPerson: 1000 },
    destinations: {
      "custom-import": {
        center: [resorts[0]?.lat || 22.2, resorts[0]?.lng || 92.2],
        zoom: 10,
        resorts: resorts,
        itinerary: [
          {
            day: "Day 1",
            items: [{ time: "10 AM", activity: "Custom Tour Start" }],
          },
        ],
      },
    },
  };
}

// --- Core UI Logic (Rendering & Listeners) ---

function renderDestinationTabs(destinations) {
  const container = document.getElementById("destination-tabs");
  container.innerHTML = "";

  destinations.forEach((destKey) => {
    const btn = document.createElement("button");
    btn.textContent = destKey.charAt(0).toUpperCase() + destKey.slice(1);
    btn.id = `tab-${destKey}`;
    btn.onclick = () => switchDestination(destKey);

    btn.className =
      "flex-1 py-3 px-4 rounded-xl font-semibold transition-all whitespace-nowrap min-w-[120px]";

    if (destKey === currentDestination) {
      btn.classList.add("tab-active", "text-white");
    } else {
      btn.classList.add("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
    }

    container.appendChild(btn);
  });
}

function switchDestination(dest) {
  if (!tourData.destinations[dest]) return;
  currentDestination = dest;
  renderDestinationTabs(Object.keys(tourData.destinations));

  const destData = tourData.destinations[dest];
  map.setView(destData.center, destData.zoom);

  selectedResort = null;
  closeResortDetails();
  loadMarkers();
  renderItinerary();
  updateCosts();
}

function initMap() {
  if (!tourData || !currentDestination) return;

  if (map) {
    map.remove();
    map = null;
  }

  const dest = tourData.destinations[currentDestination];
  map = L.map("map").setView(dest.center, dest.zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  loadMarkers();
}

function loadMarkers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  const dest = tourData.destinations[currentDestination];
  dest.resorts.forEach((resort) => {
    const icon = L.divIcon({
      className: "custom-marker",
      html: `<img src="${resort.image}" class="marker-image ${selectedResort?.id === resort.id ? "marker-selected" : ""}" />`,
      iconSize: [50, 50],
    });

    const marker = L.marker([resort.lat, resort.lng], { icon })
      .addTo(map)
      .on("click", () => selectResort(resort));

    marker.bindPopup(`
            <div class="text-center p-1">
                <strong class="text-emerald-800">${resort.name}</strong><br>
                <span class="text-xs text-gray-600">${resort.location}</span><br>
                <span class="text-yellow-500 font-bold">★ ${resort.rating || 4.0}</span>
            </div>
        `);

    markers.push(marker);
  });
}

function selectResort(resort) {
  selectedResort = resort;
  loadMarkers();

  const details = document.getElementById("resortDetails");
  details.classList.remove("hidden");

  document.getElementById("resortName").textContent = resort.name;
  document.getElementById("resortLocation").textContent = resort.location;
  document.getElementById("resortContact").textContent =
    resort.contact || "N/A";
  document.getElementById("resortContact").href = `tel:${resort.contact || ""}`;
  document.getElementById("resortEmail").textContent = resort.email || "N/A";
  document.getElementById("resortEmail").href = `mailto:${resort.email || ""}`;

  const rating = resort.rating || 4.5;
  const ratingHtml = Array(5)
    .fill(0)
    .map(
      (_, i) =>
        `<svg class="w-4 h-4 ${i < Math.floor(rating) ? "fill-current" : ""}" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`,
    )
    .join("");
  document.getElementById("resortRating").innerHTML =
    ratingHtml + `<span class="text-sm font-semibold ml-1">${rating}</span>`;

  const acts = resort.activities || [];
  const activitiesHtml = acts
    .map(
      (activity) =>
        `<span class="px-3 py-1 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200">${activity}</span>`,
    )
    .join("");
  document.getElementById("resortActivities").innerHTML = activitiesHtml;

  updateCosts();
  if (window.innerWidth < 768) {
    details.scrollIntoView({ behavior: "smooth" });
  }
}

function closeResortDetails() {
  selectedResort = null;
  document.getElementById("resortDetails").classList.add("hidden");
  loadMarkers();
}

function attachGlobalListeners() {
  document
    .getElementById("people-minus")
    .addEventListener("click", () => changePeople(-1));
  document
    .getElementById("people-plus")
    .addEventListener("click", () => changePeople(1));
  document
    .getElementById("totalPeople")
    .addEventListener("change", updateRoomConfig);

  document
    .getElementById("couple-minus")
    .addEventListener("click", () => changeRooms("couple", -1));
  document
    .getElementById("couple-plus")
    .addEventListener("click", () => changeRooms("couple", 1));
  document
    .getElementById("coupleRooms")
    .addEventListener("change", updateFromRooms);

  document
    .getElementById("family-minus")
    .addEventListener("click", () => changeRooms("family", -1));
  document
    .getElementById("family-plus")
    .addEventListener("click", () => changeRooms("family", 1));
  document
    .getElementById("familyRooms")
    .addEventListener("change", updateFromRooms);

  document
    .getElementById("closeResortBtn")
    .addEventListener("click", closeResortDetails);
}

function changePeople(delta) {
  const input = document.getElementById("totalPeople");
  const newValue = Math.max(1, parseInt(input.value) + delta);
  input.value = newValue;
  updateRoomConfig();
}

function changeRooms(type, delta) {
  const input = document.getElementById(type + "Rooms");
  const newValue = Math.max(0, parseInt(input.value) + delta);
  input.value = newValue;
  updateFromRooms();
}

function updateRoomConfig() {
  const people = parseInt(document.getElementById("totalPeople").value);
  const coupleRooms = parseInt(document.getElementById("coupleRooms").value);
  const familyRooms = parseInt(document.getElementById("familyRooms").value);
  const totalRooms = coupleRooms + familyRooms;
  document.getElementById("totalRooms").textContent = totalRooms;
  updateCosts();
}

function updateFromRooms() {
  const coupleRooms = parseInt(document.getElementById("coupleRooms").value);
  const familyRooms = parseInt(document.getElementById("familyRooms").value);
  const totalPeople = coupleRooms * 2 + familyRooms * 4;
  document.getElementById("totalPeople").value = totalPeople;
  document.getElementById("totalRooms").textContent = coupleRooms + familyRooms;
  updateCosts();
}

function renderItinerary() {
  if (!tourData || !tourData.destinations[currentDestination]) return;
  const itinerary = tourData.destinations[currentDestination].itinerary || [];
  const container = document.getElementById("itineraryContainer");

  container.innerHTML = itinerary
    .map(
      (day, idx) => `
        <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">
                    ${idx + 1}
                </div>
                ${day.day}
            </h3>
            <div class="space-y-3 ml-4 border-l-2 border-teal-200 pl-6">
                ${day.items
                  .map(
                    (item) => `
                    <div class="relative flex items-start gap-3 group">
                        <div class="absolute -left-[29px] w-4 h-4 rounded-full bg-teal-400 border-4 border-white group-hover:bg-teal-500 transition-colors"></div>
                        <div class="bg-teal-50 p-3 rounded-xl flex-1 hover:bg-teal-100 transition-colors">
                            <span class="font-semibold text-teal-700 text-sm">${item.time}</span>
                            <p class="text-gray-700">${item.activity}</p>
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
    `,
    )
    .join("");
}

function updateCosts() {
  if (!tourData) return;

  const people = parseInt(document.getElementById("totalPeople").value);
  const coupleRooms = parseInt(document.getElementById("coupleRooms").value);
  const familyRooms = parseInt(document.getElementById("familyRooms").value);

  const coupleRate = selectedResort
    ? selectedResort.pricePerNight || 5000
    : 5000;
  const familyRate = Math.round(coupleRate * 1.6);

  const baseCosts = tourData.baseCosts || {
    bus: 0,
    foodPerPerson: 0,
    activitiesPerPerson: 0,
  };

  const accommodation =
    coupleRooms * coupleRate * 2 + familyRooms * familyRate * 2;
  const food = people * baseCosts.foodPerPerson;
  const activities = people * baseCosts.activitiesPerPerson;
  const total = baseCosts.bus + accommodation + food + activities;
  const perPerson = people > 0 ? Math.round(total / people) : 0;

  if (selectedResort) {
    document.getElementById("resortCost").textContent =
      `BDT ${accommodation.toLocaleString()}`;
  }

  const costBreakdown = document.getElementById("costBreakdown");
  costBreakdown.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3">
                    <div class="bg-purple-100 p-2 rounded-lg">
                        <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        </svg>
                    </div>
                    <span class="font-medium text-gray-700">Bus (Round Trip - AC Coach)</span>
                </div>
                <span class="font-bold text-gray-800">BDT ${baseCosts.bus.toLocaleString()}</span>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-100 p-2 rounded-lg">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                    </div>
                    <span class="font-medium text-gray-700">Accommodation (${selectedResort ? "at " + selectedResort.name : "Standard"})</span>
                </div>
                <span class="font-bold text-gray-800">BDT ${accommodation.toLocaleString()}</span>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3">
                    <div class="bg-orange-100 p-2 rounded-lg">
                        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                    </div>
                    <span class="font-medium text-gray-700">Premium Catering (6 Meals)</span>
                </div>
                <span class="font-bold text-gray-800">BDT ${food.toLocaleString()}</span>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3">
                    <div class="bg-green-100 p-2 rounded-lg">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                        </svg>
                    </div>
                    <span class="font-medium text-gray-700">Local Chander Gari & Entry Fees</span>
                </div>
                <span class="font-bold text-gray-800">BDT ${activities.toLocaleString()}</span>
            </div>

            <div class="border-t-2 border-dashed border-gray-300 pt-4 mt-4">
                <div class="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-4 text-white">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-lg font-bold">TOTAL PACKAGE</span>
                        <span class="text-2xl font-bold">BDT ${total.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center text-cyan-100 border-t border-white/20 pt-2">
                        <span class="text-sm">Cost Per Participant</span>
                        <span class="text-xl font-semibold">BDT ${perPerson.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}
