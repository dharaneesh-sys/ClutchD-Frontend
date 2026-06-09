// Emulates real-time events: STATUS_UPDATE, LOCATION_UPDATE, NOTIFICATION_UPDATE

const MOCK_MECHANIC = {
  id: "mech-1",
  name: "Rajesh M.",
  phone: "+919876543211",
};

const STATUSES = [
  "searching",
  "assigned",
  "en_route",
  "in_progress",
  "payment_pending",
];

let active = false;
let statusTimer = null;
let locationTimer = null;
const listeners = {};

function emit(type, payload) {
  const handlers = listeners[type] || [];
  const event = { data: JSON.stringify({ type, payload }) };
  handlers.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      // Silently handle listener errors
    }
  });
}

export const wsSimulator = {
  start() {
    if (active) return;
    active = true;

    let step = 0;
    let locStep = 0;

    emit("LOCATION_UPDATE", {
      coords: { lat: 11.0168, lon: 76.9558, heading: 45 },
    });

    statusTimer = setInterval(() => {
      if (!active) return;
      const status = STATUSES[step % STATUSES.length];
      const mechanic = step >= 1 ? MOCK_MECHANIC : null;
      const pricing =
        status === "payment_pending"
          ? { totalAmount: 850, partsCost: 350, laborCost: 500, tax: 0 }
          : null;

      emit("STATUS_UPDATE", { status, mechanic, pricing });
      step++;

      if (step % 2 === 0) {
        emit("NOTIFICATION_UPDATE", { unreadCount: step });
      }
    }, 4000);

    locationTimer = setInterval(() => {
      if (!active) return;
      locStep++;
      // Mechanic "drives" toward customer
      const baseLat = 11.0168 + locStep * 0.00008;
      const baseLon = 76.9558 + locStep * 0.00004;
      emit("LOCATION_UPDATE", {
        coords: {
          lat: baseLat + (Math.random() - 0.5) * 0.001,
          lon: baseLon + (Math.random() - 0.5) * 0.001,
          heading: (locStep * 15) % 360,
        },
      });
    }, 2500);
  },

  stop() {
    active = false;
    if (statusTimer) {
      clearInterval(statusTimer);
      statusTimer = null;
    }
    if (locationTimer) {
      clearInterval(locationTimer);
      locationTimer = null;
    }
    Object.keys(listeners).forEach((k) => (listeners[k] = []));
  },

  on(type, handler) {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(handler);
    return () => {
      listeners[type] = listeners[type].filter((h) => h !== handler);
    };
  },

  removeAllListeners() {
    Object.keys(listeners).forEach((k) => (listeners[k] = []));
  },

  isActive() {
    return active;
  },
};
