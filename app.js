let map;
let markers = [];
let currentDestination = "";
let selectedResort = null;
let tourData = null; // Data will be loaded here

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

async function loadData() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error("Could not load data.json");

    tourData = await response.json();

    // Set default destination to the first key found in data
    const destinations = Object.keys(tourData.destinations);
    if (destinations.length > 0) {
      currentDestination = destinations[0];

      // Initialize the app parts
      renderDestinationTabs(destinations);
      initMap();
      renderItinerary();
      updateCosts();
      attachGlobalListeners();
    } else {
      console.error("No destinations found in data.json");
    }
  } catch (error) {
    console.error("Error loading tour data:", error);
    alert("Failed to load tour data. Please check console.");
  }
}

function renderDestinationTabs(destinations) {
  const container = document.getElementById("destination-tabs");
  container.innerHTML = ""; // Clear existing

  destinations.forEach((destKey) => {
    const btn = document.createElement("button");
    btn.textContent = destKey.charAt(0).toUpperCase() + destKey.slice(1);
    btn.id = `tab-${destKey}`;
    btn.onclick = () => switchDestination(destKey);

    // Base Classes
    btn.className =
      "flex-1 py-3 px-4 rounded-xl font-semibold transition-all whitespace-nowrap min-w-[120px]";

    // Apply Active/Inactive styles
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

  // Re-render tabs to update styling (Active vs Inactive)
  renderDestinationTabs(Object.keys(tourData.destinations));

  // Logic to switch map and data
  const destData = tourData.destinations[dest];
  map.setView(destData.center, destData.zoom);

  selectedResort = null;
  closeResortDetails();
  loadMarkers();
  renderItinerary();
  updateCosts();
}

// Map Logic
function initMap() {
  if (!tourData || !currentDestination) return;

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
                <span class="text-yellow-500 font-bold">★ ${resort.rating}</span>
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
  document.getElementById("resortContact").textContent = resort.contact;
  document.getElementById("resortContact").href = `tel:${resort.contact}`;
  document.getElementById("resortEmail").textContent = resort.email;
  document.getElementById("resortEmail").href = `mailto:${resort.email}`;

  // Render Rating
  const ratingHtml = Array(5)
    .fill(0)
    .map(
      (_, i) =>
        `<svg class="w-4 h-4 ${i < Math.floor(resort.rating) ? "fill-current" : ""}" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`,
    )
    .join("");
  document.getElementById("resortRating").innerHTML =
    ratingHtml +
    `<span class="text-sm font-semibold ml-1">${resort.rating}</span>`;

  // Render Activities
  const activitiesHtml = resort.activities
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
  // People Counter
  document
    .getElementById("people-minus")
    .addEventListener("click", () => changePeople(-1));
  document
    .getElementById("people-plus")
    .addEventListener("click", () => changePeople(1));
  document
    .getElementById("totalPeople")
    .addEventListener("change", updateRoomConfig);

  // Couple Rooms Counter
  document
    .getElementById("couple-minus")
    .addEventListener("click", () => changeRooms("couple", -1));
  document
    .getElementById("couple-plus")
    .addEventListener("click", () => changeRooms("couple", 1));
  document
    .getElementById("coupleRooms")
    .addEventListener("change", updateFromRooms);

  // Family Rooms Counter
  document
    .getElementById("family-minus")
    .addEventListener("click", () => changeRooms("family", -1));
  document
    .getElementById("family-plus")
    .addEventListener("click", () => changeRooms("family", 1));
  document
    .getElementById("familyRooms")
    .addEventListener("change", updateFromRooms);

  // Close Resort Details
  document
    .getElementById("closeResortBtn")
    .addEventListener("click", closeResortDetails);
}

// Logic Functions
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
  if (!tourData) return;
  const itinerary = tourData.destinations[currentDestination].itinerary;
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

  const coupleRate = selectedResort ? selectedResort.pricePerNight : 5000;
  const familyRate = selectedResort
    ? Math.round(selectedResort.pricePerNight * 1.6)
    : 8000;

  const baseCosts = tourData.baseCosts;

  const accommodation =
    coupleRooms * coupleRate * 2 + familyRooms * familyRate * 2;
  const food = people * baseCosts.foodPerPerson;
  const activities = people * baseCosts.activitiesPerPerson;
  const total = baseCosts.bus + accommodation + food + activities;
  const perPerson = Math.round(total / people);

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
