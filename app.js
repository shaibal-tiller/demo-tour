let map;
let markers = [];
let currentDestination = "bandarban";
let selectedResort = null;

// EMBEDDED DATA (Replaces data.json fetch)
const tourData = {
  baseCosts: {
    bus: 90000,
    foodPerPerson: 4200,
    activitiesPerPerson: 2850,
  },
  destinations: {
    bandarban: {
      center: [22.1953, 92.2183],
      zoom: 11,
      resorts: [
        {
          id: 1,
          name: "Green Peak Resort",
          location: "Meghla, Bandarban",
          lat: 22.192,
          lng: 92.213,
          contact: "01845-776633",
          email: "greenpeak@resort.com",
          activities: ["Infinity Pool", "Trekking", "Restaurant"],
          image:
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
          rating: 4.5,
          pricePerNight: 5500,
        },
        {
          id: 2,
          name: "Sairu Hill Resort",
          location: "Chimbook Road, Bandarban",
          lat: 22.0833,
          lng: 92.25,
          contact: "01531-411111",
          email: "sairuhill@resort.com",
          activities: ["Luxury Stay", "Cloud View", "Infinity Pool", "Spa"],
          image:
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=100&h=100&fit=crop",
          rating: 4.8,
          pricePerNight: 12000,
        },
        {
          id: 3,
          name: "Nilgiri Hill Resort",
          location: "Nilgiri Peak, Bandarban",
          lat: 22.031,
          lng: 92.316,
          contact: "01769-299999",
          email: "nilgiri@army.bd",
          activities: ["Army Managed", "Sunrise Point", "High Altitude"],
          image:
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=100&h=100&fit=crop",
          rating: 4.6,
          pricePerNight: 6000,
        },
        {
          id: 4,
          name: "Holiday Inn Bandarban",
          location: "Meghla, Bandarban",
          lat: 22.198,
          lng: 92.215,
          contact: "01815-414141",
          email: "holidayinn@bban.com",
          activities: ["Lake Front", "Mini Zoo", "Boating"],
          image:
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=100&h=100&fit=crop",
          rating: 4.2,
          pricePerNight: 4500,
        },
        {
          id: 5,
          name: "Bawm Resort",
          location: "Thanchi Road, Bandarban",
          lat: 22.15,
          lng: 92.23,
          contact: "01855-332211",
          email: "bawm@resort.com",
          activities: ["Tribal Theme", "Mountain View", "Local Food"],
          image:
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&h=100&fit=crop",
          rating: 4.3,
          pricePerNight: 5000,
        },
        {
          id: 6,
          name: "Tain Khali Resort",
          location: "Near Shoilo Propat",
          lat: 22.17,
          lng: 92.2,
          contact: "01711-889977",
          email: "tainkhali@resort.com",
          activities: ["Waterfall Proximity", "Nature Walk"],
          image:
            "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=100&h=100&fit=crop",
          rating: 4.1,
          pricePerNight: 3500,
        },
        {
          id: 7,
          name: "Hillside Resort",
          location: "Milonchori, Bandarban",
          lat: 22.155,
          lng: 92.21,
          contact: "01715-006699",
          email: "hillside@milonchori.com",
          activities: ["River View", "Eco Cottages", "Yoga"],
          image:
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop",
          rating: 4.4,
          pricePerNight: 4800,
        },
        {
          id: 8,
          name: "Cloud 9",
          location: "Chimbook Road",
          lat: 22.11,
          lng: 92.24,
          contact: "01822-113344",
          email: "cloud9@bandarban.com",
          activities: ["Sunset View", "Star Gazing"],
          image:
            "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=100&h=100&fit=crop",
          rating: 4.3,
          pricePerNight: 5200,
        },
        {
          id: 9,
          name: "Fanush Resort",
          location: "Nilachal Road",
          lat: 22.185,
          lng: 92.19,
          contact: "01788-554433",
          email: "fanush@resort.com",
          activities: ["Nilachal View", "BBQ Corner"],
          image:
            "https://images.unsplash.com/photo-1445013517791-41bcd7420f8c?w=100&h=100&fit=crop",
          rating: 4.2,
          pricePerNight: 4000,
        },
        {
          id: 10,
          name: "Venus Resort",
          location: "Meghla Tourism",
          lat: 22.194,
          lng: 92.217,
          contact: "01866-221100",
          email: "venus@meghla.com",
          activities: ["Cable Car", "Lake Side", "Family Suites"],
          image:
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=100&h=100&fit=crop",
          rating: 4.4,
          pricePerNight: 6500,
        },
      ],
      itinerary: [
        {
          day: "Day 0 (Night)",
          items: [{ time: "10:30 PM", activity: "VIP coach departure" }],
        },
        {
          day: "Day 1",
          items: [
            { time: "Morning", activity: "Check-in at resort" },
            { time: "9 AM", activity: "Nilachal tour" },
            { time: "12 PM", activity: "Tribal lunch" },
            { time: "2 PM", activity: "Golden Temple" },
            { time: "7 PM", activity: "BBQ dinner" },
          ],
        },
        {
          day: "Day 2",
          items: [
            { time: "5:30 AM", activity: "Sunrise at Nilgiri" },
            { time: "11 AM", activity: "Shoilo Propat" },
            { time: "9 PM", activity: "Luxury bus return" },
          ],
        },
      ],
    },
    rangamati: {
      center: [22.65, 92.18],
      zoom: 12,
      resorts: [
        {
          id: 11,
          name: "Aranyak Holiday Resort",
          location: "Cantonment Area, Rangamati",
          lat: 22.665,
          lng: 92.19,
          contact: "01769-312015",
          email: "aranyak@army.bd",
          activities: ["Lake View", "Swimming Pool", "Army Managed"],
          image:
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=100&h=100&fit=crop",
          rating: 4.7,
          pricePerNight: 7000,
        },
        {
          id: 12,
          name: "Polwel Park Resort",
          location: "DC Bungalow Road, Rangamati",
          lat: 22.655,
          lng: 92.175,
          contact: "01777-665544",
          email: "polwel@park.com",
          activities: ["Amusement Park", "Infinity Pool", "Cottages"],
          image:
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
          rating: 4.6,
          pricePerNight: 8500,
        },
        {
          id: 13,
          name: "Parjatan Motel",
          location: "Hanging Bridge, Rangamati",
          lat: 22.635,
          lng: 92.165,
          contact: "01711-223344",
          email: "parjatan@rangamati.com",
          activities: ["Hanging Bridge", "Boating", "Iconic View"],
          image:
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=100&h=100&fit=crop",
          rating: 4.1,
          pricePerNight: 4000,
        },
        {
          id: 14,
          name: "Hotel Prince",
          location: "Main Town, Rangamati",
          lat: 22.645,
          lng: 92.185,
          contact: "01819-332211",
          email: "prince@rangamati.com",
          activities: ["Market Access", "Restaurant"],
          image:
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=100&h=100&fit=crop",
          rating: 3.9,
          pricePerNight: 3500,
        },
        {
          id: 15,
          name: "Peda Ting Ting",
          location: "Isolated Island, Kaptai Lake",
          lat: 22.7,
          lng: 92.2,
          contact: "01715-223344",
          email: "peda@tingting.com",
          activities: ["Island Dining", "Boating", "Traditional food"],
          image:
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&h=100&fit=crop",
          rating: 4.4,
          pricePerNight: 5000,
        },
        {
          id: 16,
          name: "Hill Taj Resort",
          location: "Tabalchari, Rangamati",
          lat: 22.64,
          lng: 92.195,
          contact: "01755-998877",
          email: "hilltaj@resort.com",
          activities: ["Lake Front", "Garden"],
          image:
            "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=100&h=100&fit=crop",
          rating: 4.0,
          pricePerNight: 4200,
        },
        {
          id: 17,
          name: "Lake Shore Resort",
          location: "Kaptai Road",
          lat: 22.58,
          lng: 92.21,
          contact: "01833-221100",
          email: "lakeshore@kaptai.com",
          activities: ["Kayaking", "Fishing", "Cottages"],
          image:
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop",
          rating: 4.3,
          pricePerNight: 5500,
        },
        {
          id: 18,
          name: "Borgang Resort",
          location: "Kaptai Lake Shore",
          lat: 22.59,
          lng: 92.22,
          contact: "01711-445566",
          email: "borgang@resort.com",
          activities: ["Eco Tourism", "Hill Tracking"],
          image:
            "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=100&h=100&fit=crop",
          rating: 4.2,
          pricePerNight: 4800,
        },
        {
          id: 19,
          name: "Tuk Tuk Eco Village",
          location: "Kaptai Lake Island",
          lat: 22.71,
          lng: 92.22,
          contact: "01733-112233",
          email: "tuktuk@eco.com",
          activities: ["Bamboo Huts", "Boating", "Quiet Stay"],
          image:
            "https://images.unsplash.com/photo-1445013517791-41bcd7420f8c?w=100&h=100&fit=crop",
          rating: 4.2,
          pricePerNight: 3800,
        },
        {
          id: 20,
          name: "Kaptai Lake View",
          location: "Assambasti, Rangamati",
          lat: 22.62,
          lng: 92.2,
          contact: "01844-551122",
          email: "lakeview@resort.com",
          activities: ["Lakeside Park", "Restaurant"],
          image:
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=100&h=100&fit=crop",
          rating: 4.0,
          pricePerNight: 4500,
        },
      ],
      itinerary: [
        {
          day: "Day 0 (Night)",
          items: [{ time: "10:00 PM", activity: "VIP coach departure" }],
        },
        {
          day: "Day 1",
          items: [
            { time: "Morning", activity: "Check-in at resort" },
            { time: "9 AM", activity: "Kaptai Lake Boat tour" },
            { time: "12 PM", activity: "Chakma lunch" },
            { time: "2 PM", activity: "Hanging Bridge" },
            { time: "7 PM", activity: "Lakeside BBQ" },
          ],
        },
        {
          day: "Day 2",
          items: [
            { time: "6:00 AM", activity: "Sunrise boat ride" },
            { time: "10 AM", activity: "Rajban Vihara" },
            { time: "8:30 PM", activity: "Return journey" },
          ],
        },
      ],
    },
  },
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Removed Fetch logic
  initApp();
});

function initApp() {
  initMap();
  renderItinerary();
  updateCosts();
  attachEventListeners();
}

function attachEventListeners() {
  // Destination Tabs
  document
    .getElementById("tab-bandarban")
    .addEventListener("click", () => switchDestination("bandarban"));
  document
    .getElementById("tab-rangamati")
    .addEventListener("click", () => switchDestination("rangamati"));

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

// Map Logic
function initMap() {
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

function switchDestination(dest) {
  currentDestination = dest;

  // Update Tab Classes
  const btnBandarban = document.getElementById("tab-bandarban");
  const btnRangamati = document.getElementById("tab-rangamati");
  const activeClass =
    "flex-1 py-3 px-4 rounded-xl font-semibold transition-all tab-active";
  const inactiveClass =
    "flex-1 py-3 px-4 rounded-xl font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200";

  if (dest === "bandarban") {
    btnBandarban.className = activeClass;
    btnRangamati.className = inactiveClass;
  } else {
    btnBandarban.className = inactiveClass;
    btnRangamati.className = activeClass;
  }

  const destData = tourData.destinations[dest];
  map.setView(destData.center, destData.zoom);

  selectedResort = null;
  closeResortDetails();
  loadMarkers();
  renderItinerary();
  updateCosts();
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
