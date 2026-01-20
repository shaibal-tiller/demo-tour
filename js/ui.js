// js/ui.js

export const UI = {
  renderTabs(destinations, currentDest, onSwitch) {
    const container = document.getElementById("destination-tabs");
    container.innerHTML = "";

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
  },

  renderItinerary(itinerary) {
    const container = document.getElementById("itineraryContainer");
    if (!itinerary) {
      container.innerHTML = "<p>No itinerary available.</p>";
      return;
    }

    container.innerHTML = itinerary
      .map(
        (day, idx) => `
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">${idx + 1}</div>
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
                        </div>`,
                      )
                      .join("")}
                </div>
            </div>`,
      )
      .join("");
  },

  updateCost(tourData, selectedResort) {
    const people = parseInt(document.getElementById("totalPeople").value) || 0;
    const coupleRooms =
      parseInt(document.getElementById("coupleRooms").value) || 0;
    const familyRooms =
      parseInt(document.getElementById("familyRooms").value) || 0;

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

    // DOM Updates
    document.getElementById("totalRooms").textContent =
      coupleRooms + familyRooms;
    if (selectedResort) {
      document.getElementById("resortCost").textContent =
        `BDT ${accommodation.toLocaleString()}`;
    }

    document.getElementById("costBreakdown").innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between p-4 bg-gray-50 rounded-xl"><span class="font-medium">Bus</span><span class="font-bold">BDT ${baseCosts.bus.toLocaleString()}</span></div>
                <div class="flex justify-between p-4 bg-gray-50 rounded-xl"><span class="font-medium">Accommodation</span><span class="font-bold">BDT ${accommodation.toLocaleString()}</span></div>
                <div class="flex justify-between p-4 bg-gray-50 rounded-xl"><span class="font-medium">Food</span><span class="font-bold">BDT ${food.toLocaleString()}</span></div>
                <div class="flex justify-between p-4 bg-gray-50 rounded-xl"><span class="font-medium">Activities</span><span class="font-bold">BDT ${activities.toLocaleString()}</span></div>
                <div class="bg-cyan-600 rounded-xl p-4 text-white">
                    <div class="flex justify-between mb-2"><span class="text-lg font-bold">TOTAL</span><span class="text-2xl font-bold">BDT ${total.toLocaleString()}</span></div>
                    <div class="flex justify-between border-t border-white/20 pt-2"><span class="text-sm">Per Person</span><span class="text-xl font-semibold">BDT ${perPerson.toLocaleString()}</span></div>
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
