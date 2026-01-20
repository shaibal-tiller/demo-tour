export const UI = {
  renderTabs(destinations, currentDest, onSwitch) {
    const container = document.getElementById("destination-tabs");
    container.innerHTML = "";
    const isMobile = window.innerWidth < 768;
    const manyItems = destinations.length > 4;

    if (isMobile || manyItems) {
      const wrapper = document.createElement("div");
      wrapper.className = "relative w-full";
      const select = document.createElement("select");
      select.className =
        "w-full appearance-none bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500";

      destinations.forEach((dest) => {
        const option = document.createElement("option");
        option.value = dest;
        option.textContent = dest.charAt(0).toUpperCase() + dest.slice(1);
        if (dest === currentDest) option.selected = true;
        select.appendChild(option);
      });
      select.onchange = (e) => onSwitch(e.target.value);
      const arrow = document.createElement("div");
      arrow.className =
        "pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-600";
      arrow.innerHTML = `<svg class="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>`;
      wrapper.appendChild(select);
      wrapper.appendChild(arrow);
      container.appendChild(wrapper);
    } else {
      destinations.forEach((destKey) => {
        const btn = document.createElement("button");
        btn.textContent = destKey.charAt(0).toUpperCase() + destKey.slice(1);
        const baseClass =
          "flex-1 py-3 px-4 rounded-xl font-semibold transition-all whitespace-nowrap min-w-[120px]";
        btn.className =
          destKey === currentDest
            ? `${baseClass} tab-active text-white`
            : `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
        btn.onclick = () => onSwitch(destKey);
        container.appendChild(btn);
      });
    }
  },

  renderItinerary(itinerary) {
    const container = document.getElementById("itineraryContainer");
    if (!itinerary || itinerary.length === 0) {
      container.innerHTML =
        "<p class='text-gray-500 italic'>No itinerary details available.</p>";
      return;
    }

    container.innerHTML = itinerary
      .map(
        (day, idx) => `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">${idx + 1}</div>
                        ${day.day}
                    </h3>
                </div>
                <div class="space-y-3 ml-4 border-l-2 border-teal-200 pl-6">
                    ${(day.items || [])
                      .map(
                        (item) => `
                        <div class="relative flex items-start gap-3 group">
                            <div class="absolute -left-[29px] w-4 h-4 rounded-full bg-teal-400 border-4 border-white group-hover:bg-teal-500 transition-colors"></div>
                            <div class="bg-teal-50 p-3 rounded-xl flex-1 hover:bg-teal-100 transition-colors">
                                <span class="font-semibold text-teal-700 text-sm block">${item.time}</span>
                                <span class="text-gray-700 block">${item.activity}</span>
                                ${
                                  item.costFood > 0 ||
                                  item.costTransport > 0 ||
                                  item.costActivity > 0
                                    ? `<div class="mt-1 text-xs text-gray-500 flex gap-2">
                                        ${item.costFood > 0 ? `<span class="text-orange-600">🍔 ${item.costFood}</span>` : ""}
                                        ${item.costTransport > 0 ? `<span class="text-green-600">🚗 ${item.costTransport}</span>` : ""}
                                        ${item.costActivity > 0 ? `<span class="text-purple-600">🎫 ${item.costActivity}</span>` : ""}
                                    </div>`
                                    : ""
                                }
                            </div>
                        </div>`,
                      )
                      .join("")}
                </div>
            </div>`,
      )
      .join("");
  },

  updateCost(tourData, currentDestKey, selectedResort) {
    const people = parseInt(document.getElementById("totalPeople").value) || 0;
    const coupleRooms =
      parseInt(document.getElementById("coupleRooms").value) || 0;
    const familyRooms =
      parseInt(document.getElementById("familyRooms").value) || 0;
    const dormRooms = parseInt(document.getElementById("dormRooms").value) || 0;

    // 1. Bus
    const bc = tourData.baseCosts || {};
    const busUp = parseInt(bc.busTicketUp) || 0;
    const busDown = parseInt(bc.busTicketDown) || 0;
    const totalBusCost = (busUp + busDown) * people;

    // 2. Accommodation
    // Default prices if no resort selected
    let pCouple = 5000,
      pFamily = 8000,
      pDorm = 12000;
    if (selectedResort) {
      pCouple =
        selectedResort.priceCouple || selectedResort.pricePerNight || 5000;
      pFamily = selectedResort.priceFamily || Math.round(pCouple * 1.6);
      pDorm = selectedResort.priceDorm || Math.round(pCouple * 2.5);
    }

    // 2 nights default multiplier
    const accommodation =
      coupleRooms * pCouple * 2 +
      familyRooms * pFamily * 2 +
      dormRooms * pDorm * 2;

    // 3. Itinerary Totals (Food, Transport, Activities)
    const currentDest = tourData.destinations[currentDestKey];
    let sumFood = 0,
      sumTrans = 0,
      sumAct = 0;

    if (currentDest && currentDest.itinerary) {
      currentDest.itinerary.forEach((day) => {
        (day.items || []).forEach((item) => {
          sumFood += parseInt(item.costFood) || 0;
          sumTrans += parseInt(item.costTransport) || 0;
          sumAct += parseInt(item.costActivity) || 0;
        });
      });
    }

    // Add global activity fallback if granular activity cost is 0
    const globalAct = bc.activitiesPerPerson || 0;
    if (sumAct === 0 && globalAct > 0) sumAct = globalAct;

    const totalFood = sumFood * people;
    const totalTrans = sumTrans * people;
    const totalAct = sumAct * people;

    const total =
      totalBusCost + accommodation + totalFood + totalTrans + totalAct;
    const perPerson = people > 0 ? Math.round(total / people) : 0;

    // DOM Updates
    document.getElementById("totalRooms").textContent =
      coupleRooms + familyRooms + dormRooms;
    if (selectedResort) {
      document.getElementById("resortCost").textContent =
        `BDT ${accommodation.toLocaleString()}`;
    }

    document.getElementById("costBreakdown").innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <div class="flex flex-col">
                        <span class="font-medium text-gray-700">Bus Tickets</span>
                        <div class="text-xs text-gray-500">Up: ${busUp} + Down: ${busDown}</div>
                    </div>
                    <span class="font-bold text-gray-800">BDT ${totalBusCost.toLocaleString()}</span>
                </div>

                <div class="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <span class="font-medium text-gray-700">Accommodation (2 Nights)</span>
                    <span class="font-bold text-gray-800">BDT ${accommodation.toLocaleString()}</span>
                </div>

                <div class="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <div class="flex flex-col">
                        <span class="font-medium text-gray-700">Food</span>
                        <span class="text-xs text-gray-500">${sumFood.toLocaleString()}/person</span>
                    </div>
                    <span class="font-bold text-gray-800">BDT ${totalFood.toLocaleString()}</span>
                </div>
                
                 <div class="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <div class="flex flex-col">
                        <span class="font-medium text-gray-700">Transport (Local)</span>
                        <span class="text-xs text-gray-500">${sumTrans.toLocaleString()}/person</span>
                    </div>
                    <span class="font-bold text-gray-800">BDT ${totalTrans.toLocaleString()}</span>
                </div>

                <div class="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <div class="flex flex-col">
                         <span class="font-medium text-gray-700">Entry & Activities</span>
                         <span class="text-xs text-gray-500">${sumAct.toLocaleString()}/person</span>
                    </div>
                    <span class="font-bold text-gray-800">BDT ${totalAct.toLocaleString()}</span>
                </div>

                <div class="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                    <div class="flex justify-between mb-2">
                        <span class="text-lg font-bold">TOTAL PACKAGE</span>
                        <span class="text-2xl font-bold">BDT ${total.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between border-t border-white/20 pt-2">
                        <span class="text-sm opacity-90">Cost Per Participant</span>
                        <span class="text-xl font-semibold">BDT ${perPerson.toLocaleString()}</span>
                    </div>
                </div>
            </div>`;
  },

  showResortDetails(resort) {
    const details = document.getElementById("resortDetails");
    details.classList.remove("hidden");
    document.getElementById("resortName").textContent = resort.name;
    document.getElementById("resortLocation").textContent = resort.location;
    document.getElementById("resortContact").textContent =
      resort.contact || "N/A";
    document.getElementById("resortEmail").textContent = resort.email || "N/A";
    document.getElementById("resortActivities").innerHTML = (
      resort.activities || []
    )
      .map(
        (act) =>
          `<span class="px-3 py-1 bg-white rounded-full text-xs font-medium text-emerald-700 border border-emerald-200">${act}</span>`,
      )
      .join("");
    if (window.innerWidth < 768) details.scrollIntoView({ behavior: "smooth" });
  },

  hideResortDetails() {
    document.getElementById("resortDetails").classList.add("hidden");
  },

  updateStorageIndicator(isCustom, filename) {
    const el = document.getElementById("storageIndicator");
    const msg = document.getElementById("storageMsg");
    if (isCustom) {
      el.classList.remove("hidden");
      msg.textContent = `Using: ${filename || "Custom Data"}`;
    } else {
      el.classList.add("hidden");
    }
  },

  setInputs(totalPeople, coupleRooms, familyRooms) {
    document.getElementById("totalPeople").value = totalPeople;
    document.getElementById("coupleRooms").value = coupleRooms;
    document.getElementById("familyRooms").value = familyRooms;
  },
};
