import { showToast } from "./utils.js";

export const DataService = {
  async load() {
    try {
      const localData = localStorage.getItem("tourData");
      const filename = localStorage.getItem("tourDataFilename");

      if (localData) {
        showToast(`Loaded from Local: ${filename || "Custom Data"}`, "success");
        const parsed = JSON.parse(localData);
        this.migrateData(parsed);
        return { data: parsed, source: "local", filename: filename };
      }

      const response = await fetch("./data.json");
      if (!response.ok) throw new Error("Could not load data.json");
      const data = await response.json();

      this.migrateData(data);

      showToast("Loaded default data from Online", "info");
      return { data: data, source: "online", filename: null };
    } catch (error) {
      console.error("Data Load Error:", error);
      showToast("Failed to load data.", "error");
      return null;
    }
  },

  saveLocal(data, filename) {
    localStorage.setItem("tourData", JSON.stringify(data));
    localStorage.setItem("tourDataFilename", filename);
  },

  clearLocal() {
    localStorage.removeItem("tourData");
    localStorage.removeItem("tourDataFilename");
  },

  migrateData(data) {
    const bc = data.baseCosts || {};

    // 1. Bus Migration (Split Up/Down)
    if (!bc.busTicketUp && !bc.busTicketDown) {
      let totalBus =
        bc.busTicketPrice || (bc.bus ? Math.round(bc.bus / 30) : 0);
      if (totalBus > 0) {
        bc.busTicketUp = totalBus;
        bc.busTicketDown = 0;
      }
    }

    // 2. Resort Price Migration (Couple/Family/Dorm)
    Object.values(data.destinations).forEach((dest) => {
      (dest.resorts || []).forEach((r) => {
        // If only pricePerNight exists, migrate it to granular
        if (r.pricePerNight && !r.priceCouple) {
          r.priceCouple = r.pricePerNight;
          r.priceFamily = Math.round(r.pricePerNight * 1.6); // Default 1.6x multiplier
          r.priceDorm = Math.round(r.pricePerNight * 2.5); // Default 2.5x multiplier
        }
        // Fallbacks if only some exist
        if (!r.priceCouple) r.priceCouple = 4000;
        if (!r.priceFamily) r.priceFamily = 6000;
        if (!r.priceDorm) r.priceDorm = 8000;
      });

      // 3. Itinerary Cost Migration (Granular Item Costs)
      if (dest.itinerary) {
        // Legacy Global Food check
        const globalFood = bc.foodPerPerson ? parseInt(bc.foodPerPerson) : 0;
        const dailyFoodShare =
          globalFood > 0 ? Math.round(globalFood / dest.itinerary.length) : 0;

        dest.itinerary.forEach((day) => {
          // Migrate daily foodCost to items if needed, or just ensure items exist
          if (!day.items) day.items = [];

          day.items.forEach((item) => {
            if (item.costActivity === undefined) item.costActivity = 0;
            if (item.costFood === undefined) item.costFood = 0;
            if (item.costTransport === undefined) item.costTransport = 0;
          });

          // If we had a legacy "daily food cost", we can leave it on the day object for reference
          // OR try to distribute it. For now, we'll keep the logic in UI to check items first.
          // But to support the NEW EDITOR, let's push legacy daily food cost into a "Lunch/Dinner" item if possible
          if (day.foodCost && !day.items.some((i) => i.costFood > 0)) {
            // Create a dummy food item if none exists
            day.items.push({
              time: "1:00 PM",
              activity: "Lunch & Dinner (Legacy Data)",
              costFood: day.foodCost,
              costActivity: 0,
              costTransport: 0,
            });
            delete day.foodCost; // Remove legacy field
          }
        });
      }
    });

    data.baseCosts = bc;
  },

  parseCSV(csvText) {
    // Simplified CSV parser logic
    const lines = csvText.split("\n").filter((l) => l.trim());
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const resorts = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",");
      if (row.length < headers.length) continue;
      let resort = { id: i, activities: [] };
      headers.forEach((header, index) => {
        const val = row[index] ? row[index].trim() : "";
        if (header.includes("price"))
          resort.priceCouple = parseInt(val) || 5000;
        else if (header.includes("lat")) resort.lat = parseFloat(val);
        else if (header.includes("lng")) resort.lng = parseFloat(val);
        else if (header.includes("rating")) resort.rating = parseFloat(val);
        else if (header.includes("activities"))
          resort.activities = val.split(";").map((s) => s.trim());
        else resort[header] = val;
      });
      // Defaults
      if (!resort.priceCouple) resort.priceCouple = 5000;
      resort.priceFamily = Math.round(resort.priceCouple * 1.6);
      resort.priceDorm = Math.round(resort.priceCouple * 2.5);
      if (!resort.lat) resort.lat = 22.2;
      if (!resort.lng) resort.lng = 92.2;
      resorts.push(resort);
    }

    return {
      baseCosts: {
        busTicketUp: 1000,
        busTicketDown: 1000,
        activitiesPerPerson: 0,
      },
      destinations: {
        "custom-import": {
          center: [resorts[0]?.lat || 22.2, resorts[0]?.lng || 92.2],
          zoom: 10,
          resorts: resorts,
          itinerary: [
            {
              day: "Day 1",
              items: [
                {
                  time: "10 AM",
                  activity: "Arrival",
                  costActivity: 0,
                  costFood: 500,
                  costTransport: 0,
                },
              ],
            },
          ],
        },
      },
    };
  },
};
