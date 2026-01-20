import { showToast } from "./utils.js";

export const EditorState = {
  data: {
    baseCosts: {
      busTicketUp: 1000,
      busTicketDown: 1500,
      activitiesPerPerson: 1000,
    },
    destinations: {},
  },
  activeDestId: null,

  init(loadedData) {
    if (loadedData && loadedData.destinations) {
      this.migrateData(loadedData);
      this.data = loadedData;
    } else {
      // Seed with default if empty
      this.createDestination("bandarban");
    }
  },

  get() {
    return this.data;
  },

  migrateData(data) {
    const bc = data.baseCosts || {};

    // Bus Migration
    if (!bc.busTicketUp && !bc.busTicketDown) {
      let totalBus =
        bc.busTicketPrice || (bc.bus ? Math.round(bc.bus / 30) : 0);
      if (totalBus > 0) {
        bc.busTicketUp = totalBus;
        bc.busTicketDown = 0;
      }
    }

    // Food Migration
    if (bc.foodPerPerson) {
      const globalFood = parseInt(bc.foodPerPerson);
      Object.values(data.destinations).forEach((dest) => {
        if (dest.itinerary) {
          const daily = Math.round(globalFood / dest.itinerary.length);
          dest.itinerary.forEach((d) => {
            if (d.foodCost === undefined) d.foodCost = daily;
          });
        }
      });
      // We keep foodPerPerson key for reference but don't use it globally anymore
    }
    data.baseCosts = bc;
  },

  createDestination(name) {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    if (this.data.destinations[id]) return null;

    this.data.destinations[id] = {
      center: [23.8, 90.4],
      zoom: 11,
      resorts: [],
      itinerary: [
        {
          day: "Day 1",
          foodCost: 500,
          items: [{ time: "Morning", activity: "Arrival" }],
        },
      ],
    };
    this.activeDestId = id;
    return id;
  },

  deleteDestination(id) {
    delete this.data.destinations[id];
    this.activeDestId = Object.keys(this.data.destinations)[0] || null;
  },

  updateGlobalCost(key, val) {
    this.data.baseCosts[key] = val;
  },

  updateDestCenter(lat, lng) {
    if (this.activeDestId) {
      this.data.destinations[this.activeDestId].center = [lat, lng];
    }
  },

  addResort() {
    if (!this.activeDestId) return;
    const dest = this.data.destinations[this.activeDestId];
    dest.resorts.push({
      id: Date.now(),
      name: "New Resort",
      location: "Location",
      pricePerNight: 4000,
      lat: dest.center[0],
      lng: dest.center[1],
      rating: 4.0,
      activities: [],
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
    });
  },

  removeResort(idx) {
    if (this.activeDestId) {
      this.data.destinations[this.activeDestId].resorts.splice(idx, 1);
    }
  },

  updateResort(idx, field, val) {
    const r = this.data.destinations[this.activeDestId].resorts[idx];
    if (["pricePerNight", "rating", "lat", "lng"].includes(field))
      val = parseFloat(val);
    if (field === "activities" && typeof val === "string")
      val = val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    r[field] = val;
  },

  addDay() {
    if (this.activeDestId) {
      const itin = this.data.destinations[this.activeDestId].itinerary;
      itin.push({ day: `Day ${itin.length + 1}`, foodCost: 500, items: [] });
    }
  },

  removeDay(idx) {
    if (this.activeDestId) {
      this.data.destinations[this.activeDestId].itinerary.splice(idx, 1);
    }
  },

  updateDay(idx, field, val) {
    const day = this.data.destinations[this.activeDestId].itinerary[idx];
    if (field === "foodCost") val = parseInt(val) || 0;
    day[field] = val;
  },

  updateDayItems(idx, text) {
    const lines = text.split("\n");
    const items = lines
      .map((line) => {
        const parts = line.split("-");
        if (parts.length > 1) {
          return {
            time: parts[0].trim(),
            activity: parts.slice(1).join("-").trim(),
          };
        }
        return { time: "", activity: line.trim() };
      })
      .filter((i) => i.activity);
    this.data.destinations[this.activeDestId].itinerary[idx].items = items;
  },
};
