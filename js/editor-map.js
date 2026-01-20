import { showToast } from "./utils.js";

export const EditorMap = {
  map: null,
  target: null,
  callback: null,

  init() {
    this.setupSearch();
  },

  open(initialLat, initialLng, targetData, onConfirm) {
    this.target = targetData;
    this.callback = onConfirm;
    const modal = document.getElementById("mapModal");
    modal.classList.remove("hidden");
    document.getElementById("mapSearchInput").value = "";
    document.getElementById("mapSearchResults").classList.add("hidden");

    if (!this.map) {
      this.map = L.map("pickerMap").setView([initialLat, initialLng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        this.map,
      );
      this.map.on("move", () => {
        const c = this.map.getCenter();
        document.getElementById("mapCoords").textContent =
          `Lat: ${c.lat.toFixed(4)}, Lng: ${c.lng.toFixed(4)}`;
      });
    }
    setTimeout(() => {
      this.map.invalidateSize();
      this.map.setView([initialLat, initialLng], 14);
    }, 200);
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
    if (this.callback)
      this.callback(
        parseFloat(c.lat.toFixed(5)),
        parseFloat(c.lng.toFixed(5)),
        this.target,
      );
    this.close();
    showToast("Location Updated", "success");
  },

  setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");
    const resultsBox = document.getElementById("mapSearchResults");
    const performSearch = async (query) => {
      if (!query || query.length < 3) return;
      resultsBox.innerHTML =
        '<div class="p-3 text-sm text-gray-500">Searching...</div>';
      resultsBox.classList.remove("hidden");
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=88.0,20.5,92.8,26.8&bounded=0&limit=5`;
        const response = await fetch(url, {
          headers: { "Accept-Language": "en" },
        });
        const data = await response.json();
        resultsBox.innerHTML = "";
        if (data.length === 0) {
          resultsBox.innerHTML =
            '<div class="p-3 text-sm text-gray-500">No results</div>';
          return;
        }
        data.forEach((place) => {
          const div = document.createElement("div");
          div.className =
            "p-3 border-b border-gray-100 hover:bg-emerald-50 cursor-pointer flex flex-col";
          div.innerHTML = `<span class="font-bold text-sm text-gray-800">${place.name || place.display_name.split(",")[0]}</span><span class="text-xs text-gray-500 truncate">${place.display_name}</span>`;
          div.onclick = () => {
            this.map.setView(
              [parseFloat(place.lat), parseFloat(place.lon)],
              16,
            );
            resultsBox.classList.add("hidden");
            input.value = place.display_name;
          };
          resultsBox.appendChild(div);
        });
      } catch (error) {
        resultsBox.innerHTML =
          '<div class="p-3 text-sm text-red-500">Error</div>';
      }
    };
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch(input.value);
    });
    btn.addEventListener("click", () => performSearch(input.value));
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !resultsBox.contains(e.target))
        resultsBox.classList.add("hidden");
    });
  },
};
