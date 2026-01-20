import { showToast } from "./utils.js";

export const EditorMap = {
  map: null,
  target: null, // { type: 'dest'|'resort', index: number }
  callback: null,

  init() {
    this.setupSearch();
  },

  open(initialLat, initialLng, targetData, onConfirm) {
    this.target = targetData;
    this.callback = onConfirm;

    const modal = document.getElementById("mapModal");
    modal.classList.remove("hidden");

    // Clear previous search
    document.getElementById("mapSearchInput").value = "";
    document.getElementById("mapSearchResults").classList.add("hidden");

    if (!this.map) {
      this.map = L.map("pickerMap").setView([initialLat, initialLng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(this.map);

      this.map.on("move", () => {
        const c = this.map.getCenter();
        document.getElementById("mapCoords").textContent =
          `Lat: ${c.lat.toFixed(4)}, Lng: ${c.lng.toFixed(4)}`;
      });
    }

    // Force map resize to fix gray areas
    setTimeout(() => {
      this.map.invalidateSize();
      this.map.setView([initialLat, initialLng], 14);
    }, 200);

    // Bind basic buttons
    document.getElementById("closeMapBtn").onclick = () => this.close();
    document.getElementById("confirmPickBtn").onclick = () => this.confirm();
  },

  close() {
    document.getElementById("mapModal").classList.add("hidden");
    this.target = null;
    this.callback = null;
  },

  confirm() {
    const c = this.map.getCenter();
    const lat = parseFloat(c.lat.toFixed(5));
    const lng = parseFloat(c.lng.toFixed(5));

    if (this.callback) this.callback(lat, lng, this.target);
    this.close();
    showToast("Location Updated", "success");
  },

  // --- SEARCH LOGIC (Nominatim) ---
  setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");
    const resultsBox = document.getElementById("mapSearchResults");

    // Search on Enter key
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.performSearch(input.value);
    });

    // Search on Button Click
    btn.addEventListener("click", () => this.performSearch(input.value));

    // Hide results when clicking outside
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
        resultsBox.classList.add("hidden");
      }
    });
  },

  async performSearch(query) {
    if (!query || query.length < 3) return;

    const resultsBox = document.getElementById("mapSearchResults");
    resultsBox.innerHTML =
      '<div class="p-3 text-sm text-gray-500">Searching...</div>';
    resultsBox.classList.remove("hidden");

    try {
      // Nominatim API (Free, No Key)
      // viewbox adds bias to Bangladesh area (approx coordinates)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=88.0,20.5,92.8,26.8&bounded=0&limit=5`;

      const response = await fetch(url, {
        headers: { "Accept-Language": "en" }, // Prefer English results
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();

      if (data.length === 0) {
        resultsBox.innerHTML =
          '<div class="p-3 text-sm text-gray-500">No results found</div>';
        return;
      }

      // Render Results
      resultsBox.innerHTML = "";
      data.forEach((place) => {
        const div = document.createElement("div");
        div.className =
          "p-3 border-b border-gray-100 hover:bg-emerald-50 cursor-pointer flex flex-col transition-colors";
        div.innerHTML = `
                    <span class="font-bold text-sm text-gray-800">${place.name || place.display_name.split(",")[0]}</span>
                    <span class="text-xs text-gray-500 truncate">${place.display_name}</span>
                `;

        div.onclick = () => {
          const lat = parseFloat(place.lat);
          const lng = parseFloat(place.lon);

          this.map.setView([lat, lng], 16); // Zoom in to result
          resultsBox.classList.add("hidden");
          document.getElementById("mapSearchInput").value = place.display_name;
        };

        resultsBox.appendChild(div);
      });
    } catch (error) {
      console.error(error);
      resultsBox.innerHTML =
        '<div class="p-3 text-sm text-red-500">Error fetching data</div>';
    }
  },
};
