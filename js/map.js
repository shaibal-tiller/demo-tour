let mapInstance = null;
let markers = [];

export const MapService = {
  init(destData) {
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }
    mapInstance = L.map("map").setView(destData.center, destData.zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(mapInstance);
  },

  renderMarkers(resorts, selectedResortId, onSelectCallback) {
    if (!mapInstance) return;
    markers.forEach((m) => mapInstance.removeLayer(m));
    markers = [];
    resorts.forEach((resort) => {
      const isSelected = selectedResortId === resort.id;
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<img src="${resort.image}" class="marker-image ${isSelected ? "marker-selected" : ""}" />`,
        iconSize: [50, 50],
      });
      const marker = L.marker([resort.lat, resort.lng], { icon })
        .addTo(mapInstance)
        .on("click", () => onSelectCallback(resort));
      marker.bindPopup(
        `<div class="text-center p-1"><strong class="text-emerald-800">${resort.name}</strong><br><span class="text-xs text-gray-600">${resort.location}</span><br><span class="text-yellow-500 font-bold">★ ${resort.rating || 4.0}</span></div>`,
      );
      markers.push(marker);
    });
  },
};
