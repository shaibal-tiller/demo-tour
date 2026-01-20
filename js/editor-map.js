import { showToast } from "./utils.js";

export const EditorMap = {
  map: null,
  target: null, // { type: 'dest'|'resort', index: number }
  callback: null,

  init() {
    // Lazy init in open() to ensure DOM exists and modal is shown
  },

  open(initialLat, initialLng, targetData, onConfirm) {
    this.target = targetData;
    this.callback = onConfirm;

    const modal = document.getElementById("mapModal");
    modal.classList.remove("hidden");

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

    this.map.setView([initialLat, initialLng], 14);
    setTimeout(() => this.map.invalidateSize(), 100);

    // Bind buttons
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
};
