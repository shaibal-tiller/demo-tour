import { showToast } from "./utils.js";
import { DataService } from "./data.js";

export const EditorState = {
  data: {
    baseCosts: {
      busTicketUp: 1000,
      busTicketDown: 1500,
      activitiesPerPerson: 0,
    },
    destinations: {},
  },
  activeDestId: null,

  init(loadedData) {
    if (loadedData && loadedData.destinations) {
      DataService.migrateData(loadedData);
      this.data = loadedData;
    } else {
      this.createDestination("bandarban");
    }
  },

  get() {
    return this.data;
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
          items: [
            {
              time: "Morning",
              activity: "Arrival",
              costActivity: 0,
              costFood: 0,
              costTransport: 0,
            },
          ],
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
      priceCouple: 4000,
      priceFamily: 6000,
      priceDorm: 8000,
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
    if (
      [
        "priceCouple",
        "priceFamily",
        "priceDorm",
        "rating",
        "lat",
        "lng",
      ].includes(field)
    )
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
      itin.push({ day: `Day ${itin.length + 1}`, items: [] });
    }
  },

  removeDay(idx) {
    if (this.activeDestId) {
      this.data.destinations[this.activeDestId].itinerary.splice(idx, 1);
    }
  },

  updateDay(idx, field, val) {
    const day = this.data.destinations[this.activeDestId].itinerary[idx];
    day[field] = val;
  },

  addItem(dayIdx) {
    const day = this.data.destinations[this.activeDestId].itinerary[dayIdx];
    day.items.push({
      time: "10:00 AM",
      activity: "New Activity",
      costActivity: 0,
      costFood: 0,
      costTransport: 0,
    });
  },

  removeItem(dayIdx, itemIdx) {
    const day = this.data.destinations[this.activeDestId].itinerary[dayIdx];
    day.items.splice(itemIdx, 1);
  },

  updateItem(dayIdx, itemIdx, field, val) {
    const item =
      this.data.destinations[this.activeDestId].itinerary[dayIdx].items[
        itemIdx
      ];
    if (["costActivity", "costFood", "costTransport"].includes(field))
      val = parseInt(val) || 0;
    item[field] = val;
  },
};
