import { EditorState } from "./editor-state.js";
import { EditorMap } from "./editor-map.js";

export const EditorUI = {
  // --- CONFIRM MODAL ---
  confirmCallback: null,

  initConfirmation() {
    document.getElementById("confirmCancelBtn").onclick = () => {
      document.getElementById("confirmModal").classList.add("hidden");
      this.confirmCallback = null;
    };
    document.getElementById("confirmOkBtn").onclick = () => {
      if (this.confirmCallback) this.confirmCallback();
      document.getElementById("confirmModal").classList.add("hidden");
      this.confirmCallback = null;
    };
  },

  showConfirm(title, msg, cb) {
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMsg").textContent = msg;
    document.getElementById("confirmModal").classList.remove("hidden");
    this.confirmCallback = cb;
  },

  // --- RENDERING ---

  renderGlobalSettings() {
    const bc = EditorState.get().baseCosts;
    document.getElementById("costBusUp").value = bc.busTicketUp || 0;
    document.getElementById("costBusDown").value = bc.busTicketDown || 0;
    document.getElementById("costActivity").value = bc.activitiesPerPerson || 0;

    this.updateBusLabels();
  },

  updateBusLabels() {
    const activeId = EditorState.activeDestId;
    const upLabel = document.getElementById("busUpLabel");
    const downLabel = document.getElementById("busDownLabel");

    if (activeId) {
      const name = activeId.charAt(0).toUpperCase() + activeId.slice(1);
      upLabel.textContent = `Dhaka to ${name}`;
      downLabel.textContent = `${name} to Dhaka`;
    } else {
      upLabel.textContent = "Dhaka to Destination";
      downLabel.textContent = "Destination to Dhaka";
    }
  },

  renderDestList(switchCb) {
    const list = document.getElementById("destList");
    list.innerHTML = "";
    const data = EditorState.get();
    const activeId = EditorState.activeDestId;

    Object.keys(data.destinations).forEach((id) => {
      const div = document.createElement("div");
      div.className = `p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${activeId === id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-gray-100 border border-transparent"}`;
      div.innerHTML = `
                <span class="font-medium text-sm text-gray-700 capitalize">${id}</span>
                ${activeId === id ? '<span class="w-2 h-2 rounded-full bg-emerald-500"></span>' : ""}
            `;
      div.onclick = () => switchCb(id);
      list.appendChild(div);
    });

    this.toggleEditorView(!!activeId);
    if (activeId) {
      this.renderActiveEditor();
      this.updateBusLabels();
    }
  },

  toggleEditorView(show) {
    if (show) {
      document.getElementById("emptyState").classList.add("hidden");
      document.getElementById("activeEditor").classList.remove("hidden");
    } else {
      document.getElementById("emptyState").classList.remove("hidden");
      document.getElementById("activeEditor").classList.add("hidden");
    }
  },

  renderActiveEditor() {
    const id = EditorState.activeDestId;
    if (!id) return;
    const dest = EditorState.get().destinations[id];

    // Settings
    document.getElementById("destId").value = id;
    document.getElementById("destLat").value = dest.center[0];
    document.getElementById("destLng").value = dest.center[1];

    // Resorts
    const rList = document.getElementById("resortsList");
    rList.innerHTML = "";
    dest.resorts.forEach((r, idx) => {
      const el = document.createElement("div");
      el.className =
        "bg-gray-50 p-4 rounded-lg border border-gray-200 relative group";
      el.innerHTML = `
                <button data-action="remove-resort" data-idx="${idx}" class="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
                <div class="grid grid-cols-12 gap-3">
                    <div class="col-span-1 flex flex-col items-center justify-center bg-gray-200 rounded text-gray-500 font-bold text-lg">${idx + 1}</div>
                    <div class="col-span-11 space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Name" class="w-full p-2 border rounded text-sm font-bold" value="${r.name || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'name', v:this.value}}))">
                            <input type="number" placeholder="Price" class="w-full p-2 border rounded text-sm" value="${r.pricePerNight || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'pricePerNight', v:this.value}}))">
                        </div>
                        <input type="text" placeholder="Location" class="w-full p-2 border rounded text-sm" value="${r.location || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'location', v:this.value}}))">
                        
                        <div class="flex gap-2">
                            <input type="number" step="0.0001" placeholder="Lat" class="w-1/3 p-2 border rounded text-sm bg-white" value="${r.lat || ""}" id="resort-lat-${idx}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'lat', v:this.value}}))">
                            <input type="number" step="0.0001" placeholder="Lng" class="w-1/3 p-2 border rounded text-sm bg-white" value="${r.lng || ""}" id="resort-lng-${idx}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'lng', v:this.value}}))">
                            <button data-action="pick-map" data-type="resort" data-idx="${idx}" class="bg-blue-50 text-blue-600 px-3 rounded border border-blue-100 hover:bg-blue-100 text-xs font-bold">Pick</button>
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="Contact" class="p-2 border rounded text-sm" value="${r.contact || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'contact', v:this.value}}))">
                            <input type="text" placeholder="Email" class="p-2 border rounded text-sm" value="${r.email || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'email', v:this.value}}))">
                            <input type="number" step="0.1" max="5" placeholder="Rating" class="p-2 border rounded text-sm" value="${r.rating || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'rating', v:this.value}}))">
                        </div>
                        <input type="text" placeholder="Image URL" class="w-full p-2 border rounded text-sm text-xs text-gray-500" value="${r.image || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'image', v:this.value}}))">
                        <input type="text" placeholder="Activities (comma sep)" class="w-full p-2 border rounded text-sm" value="${(r.activities || []).join(", ")}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'activities', v:this.value}}))">
                    </div>
                </div>`;
      rList.appendChild(el);
    });

    // Itinerary
    const iList = document.getElementById("itineraryList");
    iList.innerHTML = "";
    (dest.itinerary || []).forEach((day, idx) => {
      const el = document.createElement("div");
      el.className =
        "bg-blue-50 p-3 rounded-lg border border-blue-100 relative";
      el.innerHTML = `
                <button data-action="remove-day" data-idx="${idx}" class="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs font-bold">Remove</button>
                <div class="flex gap-4 mb-2">
                    <input type="text" class="bg-transparent font-bold text-blue-800 border-b border-transparent hover:border-blue-300 focus:outline-none flex-1" value="${day.day}" onchange="window.dispatchEvent(new CustomEvent('update-day', {detail:{idx:${idx}, f:'day', v:this.value}}))">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-blue-600 font-semibold">Food Cost:</span>
                        <input type="number" class="w-24 p-1 text-sm border border-blue-200 rounded" placeholder="500" value="${day.foodCost || ""}" onchange="window.dispatchEvent(new CustomEvent('update-day', {detail:{idx:${idx}, f:'foodCost', v:this.value}}))">
                    </div>
                </div>
                <textarea class="w-full text-sm p-2 rounded border border-blue-200 h-20" placeholder="Time - Activity" onchange="window.dispatchEvent(new CustomEvent('update-day-items', {detail:{idx:${idx}, v:this.value}}))">${day.items.map((i) => `${i.time} - ${i.activity}`).join("\n")}</textarea>
            `;
      iList.appendChild(el);
    });

    // Re-bind listeners for the dynamic buttons
    this.bindDynamicListeners();
  },

  bindDynamicListeners() {
    // Map Pickers
    document
      .querySelectorAll('button[data-action="pick-map"]')
      .forEach((btn) => {
        btn.onclick = () => {
          const type = btn.dataset.type;
          const idx = parseInt(btn.dataset.idx);
          // Get current coords
          let lat, lng;
          if (type === "resort") {
            const r =
              EditorState.get().destinations[EditorState.activeDestId].resorts[
                idx
              ];
            lat = r.lat;
            lng = r.lng;
          }
          EditorMap.open(
            lat || 23.8,
            lng || 90.4,
            { type, index: idx },
            (newLat, newLng, target) => {
              if (target.type === "resort") {
                EditorState.updateResort(target.index, "lat", newLat);
                EditorState.updateResort(target.index, "lng", newLng);
              }
              this.renderActiveEditor();
            },
          );
        };
      });

    // Removers
    document
      .querySelectorAll('button[data-action="remove-resort"]')
      .forEach((btn) => {
        btn.onclick = () => {
          this.showConfirm("Remove Resort?", "Sure?", () => {
            EditorState.removeResort(parseInt(btn.dataset.idx));
            this.renderActiveEditor();
          });
        };
      });

    document
      .querySelectorAll('button[data-action="remove-day"]')
      .forEach((btn) => {
        btn.onclick = () => {
          this.showConfirm("Remove Day?", "Sure?", () => {
            EditorState.removeDay(parseInt(btn.dataset.idx));
            this.renderActiveEditor();
          });
        };
      });
  },
};
