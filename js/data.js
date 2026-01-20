// js/data.js
import { showToast } from "./utils.js";

export const DataService = {
  async load() {
    try {
      // 1. Check LocalStorage
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

      // 2. Fetch Online
      const response = await fetch("./data.json");
      if (!response.ok) throw new Error("Could not load data.json");

      const data = await response.json();
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

      // Defaults
      if (!resort.lat) resort.lat = 22.2;
      if (!resort.lng) resort.lng = 92.2;
      if (!resort.image)
        resort.image =
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop";

      resorts.push(resort);
    }

    return {
      baseCosts: { bus: 50000, foodPerPerson: 2000, activitiesPerPerson: 1000 },
      destinations: {
        "custom-import": {
          center: [resorts[0]?.lat || 22.2, resorts[0]?.lng || 92.2],
          zoom: 10,
          resorts: resorts,
          itinerary: [
            {
              day: "Day 1",
              items: [{ time: "10 AM", activity: "Custom Tour Start" }],
            },
          ],
        },
      },
    };
  },
};
