import { EditorState } from "./editor-state.js";
import { EditorMap } from "./editor-map.js";

export const EditorUI = {
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

  renderGlobalSettings() {
    const bc = EditorState.get().baseCosts;
    document.getElementById("costBusUp").value = bc.busTicketUp || 0;
    document.getElementById("costBusDown").value = bc.busTicketDown || 0;
    document.getElementById("costActivity").value = bc.activitiesPerPerson || 0;
    this.updateBusLabels();
  },

  updateBusLabels() {
    const activeId = EditorState.activeDestId;
    const name = activeId
      ? activeId.charAt(0).toUpperCase() + activeId.slice(1)
      : "Destination";
    document.getElementById("busUpLabel").textContent = `Dhaka to ${name}`;
    document.getElementById("busDownLabel").textContent = `${name} to Dhaka`;
  },

  renderDestList(switchCb) {
    const list = document.getElementById("destList");
    list.innerHTML = "";
    const data = EditorState.get();
    Object.keys(data.destinations).forEach((id) => {
      const div = document.createElement("div");
      div.className = `p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${EditorState.activeDestId === id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-gray-100 border border-transparent"}`;
      div.innerHTML = `<span class="font-medium text-sm text-gray-700 capitalize">${id}</span>${EditorState.activeDestId === id ? '<span class="w-2 h-2 rounded-full bg-emerald-500"></span>' : ""}`;
      div.onclick = () => switchCb(id);
      list.appendChild(div);
    });
    this.toggleEditorView(!!EditorState.activeDestId);
    if (EditorState.activeDestId) {
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

    document.getElementById("destId").value = id;
    document.getElementById("destLat").value = dest.center[0];
    document.getElementById("destLng").value = dest.center[1];

    const rList = document.getElementById("resortsList");
    rList.innerHTML = "";
    dest.resorts.forEach((r, idx) => {
      const el = document.createElement("div");
      el.className =
        "bg-gray-50 p-4 rounded-lg border border-gray-200 relative group shadow-sm";
      el.innerHTML = `
                <button data-action="remove-resort" data-idx="${idx}" class="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                <div class="grid grid-cols-12 gap-3">
                    <div class="col-span-1 flex flex-col items-center justify-center bg-gray-200 rounded text-gray-500 font-bold text-lg">${idx + 1}</div>
                    <div class="col-span-11 space-y-3">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" placeholder="Name" class="w-full p-2 border rounded text-sm font-bold" value="${r.name || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'name', v:this.value}}))">
                            <input type="text" placeholder="Location" class="w-full p-2 border rounded text-sm" value="${r.location || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'location', v:this.value}}))">
                        </div>
                        <div class="grid grid-cols-3 gap-2 bg-emerald-50 p-2 rounded border border-emerald-100">
                            <div><label class="text-[10px] text-emerald-700 font-bold">Couple (2px)</label><input type="number" class="w-full p-1 border rounded text-xs" value="${r.priceCouple || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'priceCouple', v:this.value}}))"></div>
                            <div><label class="text-[10px] text-emerald-700 font-bold">Family (4px)</label><input type="number" class="w-full p-1 border rounded text-xs" value="${r.priceFamily || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'priceFamily', v:this.value}}))"></div>
                            <div><label class="text-[10px] text-emerald-700 font-bold">Dorm (6px)</label><input type="number" class="w-full p-1 border rounded text-xs" value="${r.priceDorm || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'priceDorm', v:this.value}}))"></div>
                        </div>
                        <div class="flex gap-2">
                            <input type="number" step="0.0001" placeholder="Lat" class="w-1/3 p-2 border rounded text-sm bg-white" value="${r.lat || ""}" id="resort-lat-${idx}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'lat', v:this.value}}))">
                            <input type="number" step="0.0001" placeholder="Lng" class="w-1/3 p-2 border rounded text-sm bg-white" value="${r.lng || ""}" id="resort-lng-${idx}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'lng', v:this.value}}))">
                            <button data-action="pick-map" data-type="resort" data-idx="${idx}" class="bg-blue-50 text-blue-600 px-3 rounded border border-blue-100 hover:bg-blue-100 text-xs font-bold">Pick</button>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Facebook Link" class="p-2 border rounded text-sm text-xs" value="${r.facebook || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'facebook', v:this.value}}))">
                            <input type="text" placeholder="Google Maps Link" class="p-2 border rounded text-sm text-xs" value="${r.maps || ""}" onchange="window.dispatchEvent(new CustomEvent('update-resort', {detail:{idx:${idx}, f:'maps', v:this.value}}))">
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

    const iList = document.getElementById("itineraryList");
    iList.innerHTML = "";
    (dest.itinerary || []).forEach((day, dayIdx) => {
      const el = document.createElement("div");
      el.className =
        "bg-blue-50 p-3 rounded-lg border border-blue-100 relative";
      el.innerHTML = `
                <div class="flex justify-between items-center mb-2 border-b border-blue-200 pb-2">
                    <input type="text" class="bg-transparent font-bold text-blue-800 text-lg hover:bg-blue-100 rounded px-1" value="${day.day}" onchange="window.dispatchEvent(new CustomEvent('update-day', {detail:{idx:${dayIdx}, f:'day', v:this.value}}))">
                    <button data-action="remove-day" data-idx="${dayIdx}" class="text-red-400 hover:text-red-600 p-1 bg-white rounded shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
                <div class="space-y-2 mb-3">
                    ${(day.items || [])
                      .map(
                        (item, itemIdx) => `
                        <div class="flex gap-2 items-start bg-white p-2 rounded border border-blue-100">
                            <div class="flex-1 space-y-1">
                                <div class="flex gap-2">
                                    <input type="text" placeholder="Time" class="w-24 p-1 text-xs border rounded bg-gray-50 font-mono" value="${item.time}" onchange="window.dispatchEvent(new CustomEvent('update-item', {detail:{dIdx:${dayIdx}, iIdx:${itemIdx}, f:'time', v:this.value}}))">
                                    <input type="text" placeholder="Activity" class="flex-1 p-1 text-xs border rounded font-semibold" value="${item.activity}" onchange="window.dispatchEvent(new CustomEvent('update-item', {detail:{dIdx:${dayIdx}, iIdx:${itemIdx}, f:'activity', v:this.value}}))">
                                </div>
                                <div class="flex gap-2 items-center">
                                    <span class="text-[10px] text-gray-400 uppercase font-bold">Costs (BDT):</span>
                                    <input type="number" placeholder="Food" title="Food" class="w-20 p-1 text-xs border rounded border-orange-200 bg-orange-50" value="${item.costFood || 0}" onchange="window.dispatchEvent(new CustomEvent('update-item', {detail:{dIdx:${dayIdx}, iIdx:${itemIdx}, f:'costFood', v:this.value}}))">
                                    <input type="number" placeholder="Trans." title="Trans." class="w-20 p-1 text-xs border rounded border-green-200 bg-green-50" value="${item.costTransport || 0}" onchange="window.dispatchEvent(new CustomEvent('update-item', {detail:{dIdx:${dayIdx}, iIdx:${itemIdx}, f:'costTransport', v:this.value}}))">
                                    <input type="number" placeholder="Entry" title="Entry" class="w-20 p-1 text-xs border rounded border-purple-200 bg-purple-50" value="${item.costActivity || 0}" onchange="window.dispatchEvent(new CustomEvent('update-item', {detail:{dIdx:${dayIdx}, iIdx:${itemIdx}, f:'costActivity', v:this.value}}))">
                                </div>
                            </div>
                            <button data-action="remove-item" data-didx="${dayIdx}" data-iidx="${itemIdx}" class="text-gray-400 hover:text-red-500 mt-1">&times;</button>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <button data-action="add-item" data-idx="${dayIdx}" class="w-full py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded">+ Add Activity Item</button>
            `;
      iList.appendChild(el);
    });

    this.bindDynamicListeners();
  },

  bindDynamicListeners() {
    document
      .querySelectorAll('button[data-action="pick-map"]')
      .forEach((btn) => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx);
          let lat, lng;
          const r =
            EditorState.get().destinations[EditorState.activeDestId].resorts[
              idx
            ];
          lat = r.lat;
          lng = r.lng;
          EditorMap.open(
            lat || 23.8,
            lng || 90.4,
            { type: "resort", index: idx },
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
    document
      .querySelectorAll('button[data-action="remove-resort"]')
      .forEach((btn) => {
        btn.onclick = () =>
          this.showConfirm("Remove Resort?", "Sure?", () => {
            EditorState.removeResort(parseInt(btn.dataset.idx));
            this.renderActiveEditor();
          });
      });
    document
      .querySelectorAll('button[data-action="remove-day"]')
      .forEach((btn) => {
        btn.onclick = () =>
          this.showConfirm("Remove Day?", "Sure?", () => {
            EditorState.removeDay(parseInt(btn.dataset.idx));
            this.renderActiveEditor();
          });
      });
    document
      .querySelectorAll('button[data-action="add-item"]')
      .forEach((btn) => {
        btn.onclick = () => {
          EditorState.addItem(parseInt(btn.dataset.idx));
          this.renderActiveEditor();
        };
      });
    document
      .querySelectorAll('button[data-action="remove-item"]')
      .forEach((btn) => {
        btn.onclick = () => {
          EditorState.removeItem(
            parseInt(btn.dataset.didx),
            parseInt(btn.dataset.iidx),
          );
          this.renderActiveEditor();
        };
      });
  },
};
