// js/data.js
import { showToast } from "./utils.js";

export const DataService = {
  async load() {
    try {
      const localData = localStorage.getItem("tourData");
      const filename = localStorage.getItem("tourDataFilename");

      if (localData) {
        showToast(`Loaded from Local: ${filename || "Custom Data"}`, "success");
        return {
          data: JSON.parse(localData),
          source: "local",
          filename: filename,
        };
      }

      const response = await fetch("./data.json");
      if (!response.ok) throw new Error("Could not load data.json");
      const data = await response.json();

      // Normalize data if it uses the old format (Auto-migration)
      if (data.baseCosts && data.baseCosts.bus) {
        data.baseCosts.busTicketPrice = Math.round(data.baseCosts.bus / 30); // Approx conversion
        delete data.baseCosts.bus;
      }

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

  parseCSV(csvText) {
    // ... (Keep existing CSV logic, but default busTicketPrice instead of bus total) ...
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
          resort.pricePerNight = parseInt(val) || 5000;
        else if (header.includes("lat")) resort.lat = parseFloat(val);
        else if (header.includes("lng")) resort.lng = parseFloat(val);
        else if (header.includes("rating")) resort.rating = parseFloat(val);
        else if (header.includes("activities"))
          resort.activities = val.split(";").map((s) => s.trim());
        else resort[header] = val;
      });
      if (!resort.lat) resort.lat = 22.2;
      if (!resort.lng) resort.lng = 92.2;
      resorts.push(resort);
    }

    return {
      baseCosts: { busTicketPrice: 1500, activitiesPerPerson: 1000 },
      destinations: {
        "custom-import": {
          center: [resorts[0]?.lat || 22.2, resorts[0]?.lng || 92.2],
          zoom: 10,
          resorts: resorts,
          itinerary: [
            {
              day: "Day 1",
              foodCost: 500,
              items: [{ time: "10 AM", activity: "Arrival" }],
            },
          ],
        },
      },
    };
  },
};
