"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BULK_DISCOUNT_TIERS, FLEET_SERVICE_TYPES } from "@/lib/constants";
import {
  getFleetVehicles,
  saveFleetVehicles,
  getFleetServiceHistory,
  saveFleetServiceHistory,
  initDemoFleet,
  getFleetTier,
} from "@/lib/fleet/fleetStorage";

/**
 * Calculate the per-booking volume discount based on vehicle count.
 * Overrides the account-level tier for the booking pricing display.
 */
function calcBookingDiscount(vehicleCount) {
  for (const tier of BULK_DISCOUNT_TIERS) {
    if (vehicleCount >= tier.minVehicles) {
      return { discountPercent: tier.discountPercent, tierLabel: tier.label };
    }
  }
  return { discountPercent: 0, tierLabel: "Standard" };
}

function generateId() {
  return "fleet-booking-" + Math.random().toString(36).substring(2, 11);
}

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const useFleetStore = create(
  persist(
    (set, get) => ({
      // ── Fleet account ──────────────────────────────────────────
      fleetAccount: null,
      vehicles: [],
      serviceHistory: [],

      // ── Bookings ────────────────────────────────────────────────
      bookings: [],

      // ── Booking flow state ────────────────────────────────────
      selectedVehicleIds: [],
      selectedDate: "",
      selectedTime: "",
      vehicleServices: {}, // { vehicleId: serviceTypeValue }

      // ── Confirmation ──────────────────────────────────────────
      lastBooking: null,

      // ── Loading ────────────────────────────────────────────────
      initialized: false,

      /**
       * Initialize fleet data from localStorage (demo).
       * Call once on the fleet dashboard mount.
       */
      initialize: () => {
        const fleet = initDemoFleet();
        const vehicles = getFleetVehicles();
        const history = getFleetServiceHistory();
        set({
          fleetAccount: fleet,
          vehicles,
          serviceHistory: history,
          initialized: true,
        });
      },

      // ── Vehicle selection ─────────────────────────────────────

      toggleVehicle: (vehicleId) => {
        const { selectedVehicleIds } = get();
        if (selectedVehicleIds.includes(vehicleId)) {
          set({
            selectedVehicleIds: selectedVehicleIds.filter((id) => id !== vehicleId),
            vehicleServices: Object.fromEntries(
              Object.entries(get().vehicleServices).filter(([k]) => k !== vehicleId)
            ),
          });
        } else {
          set({
            selectedVehicleIds: [...selectedVehicleIds, vehicleId],
            vehicleServices: {
              ...get().vehicleServices,
              [vehicleId]: "general_service",
            },
          });
        }
      },

      selectAllVehicles: () => {
        const allIds = get().vehicles.map((v) => v.id);
        const services = {};
        for (const v of get().vehicles) {
          services[v.id] = get().vehicleServices[v.id] || "general_service";
        }
        set({ selectedVehicleIds: allIds, vehicleServices: services });
      },

      deselectAll: () => {
        set({ selectedVehicleIds: [], vehicleServices: {} });
      },

      setVehicleService: (vehicleId, serviceType) => {
        set({
          vehicleServices: {
            ...get().vehicleServices,
            [vehicleId]: serviceType,
          },
        });
      },

      // ── Date / Time ──────────────────────────────────────────

      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedTime: (time) => set({ selectedTime: time }),

      // ── Pricing ──────────────────────────────────────────────

      getVehicleBasePrice: (serviceType) => {
        const svc = FLEET_SERVICE_TYPES.find((s) => s.value === serviceType);
        return svc ? svc.basePrice : 2500;
      },

      getPricingBreakdown: () => {
        const { vehicles, selectedVehicleIds, vehicleServices, fleetAccount } = get();
        const count = selectedVehicleIds.length;
        if (count === 0) return null;

        let subtotal = 0;
        const lineItems = selectedVehicleIds.map((vid) => {
          const v = vehicles.find((veh) => veh.id === vid);
          const svc = vehicleServices[vid] || "general_service";
          const price = get().getVehicleBasePrice(svc);
          subtotal += price;
          return {
            vehicleId: vid,
            vehicleName: v
              ? `${v.make} ${v.model} (${v.plate})`
              : "Unknown vehicle",
            serviceType: svc,
            price,
          };
        });

        // Account-level loyal discount (from fleetStorage tier)
        const accountTier = fleetAccount
          ? getFleetTier(fleetAccount.totalSpent || 0)
          : { discountRate: 0 };
        const accountDiscountPercent = accountTier.discountRate || 0;

        // Per-booking volume discount
        const { discountPercent: bookingDiscountPercent, tierLabel: bookingTierLabel } =
          calcBookingDiscount(count);

        // Use the higher of the two discounts (but they don't stack)
        const effectiveDiscountPercent = Math.max(accountDiscountPercent, bookingDiscountPercent);
        const effectiveLabel =
          effectiveDiscountPercent === accountDiscountPercent
            ? accountTier.label || "Standard"
            : bookingTierLabel;

        const discountAmount = Math.round(subtotal * (effectiveDiscountPercent / 100));
        const total = subtotal - discountAmount;

        return {
          count,
          lineItems,
          subtotal,
          accountDiscountPercent,
          bookingDiscountPercent,
          effectiveDiscountPercent,
          effectiveLabel,
          discountAmount,
          total,
        };
      },

      // ── Submit booking ───────────────────────────────────────

      submitBooking: () => {
        const { selectedVehicleIds, selectedDate, selectedTime, vehicles, vehicleServices } = get();
        if (selectedVehicleIds.length === 0 || !selectedDate || !selectedTime) return null;

        const pricing = get().getPricingBreakdown();
        if (!pricing) return null;

        const booking = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          scheduledDate: `${selectedDate}T${selectedTime}:00`,
          vehicles: selectedVehicleIds.map((vid) => {
            const v = vehicles.find((veh) => veh.id === vid);
            return {
              vehicleId: vid,
              vehicleName: v ? `${v.make} ${v.model} (${v.plate})` : "Unknown",
              serviceType: vehicleServices[vid] || "general_service",
            };
          }),
          vehicleCount: selectedVehicleIds.length,
          pricing: {
            subtotal: pricing.subtotal,
            discountPercent: pricing.effectiveDiscountPercent,
            discountLabel: pricing.effectiveLabel,
            discountAmount: pricing.discountAmount,
            total: pricing.total,
          },
          status: "confirmed",
        };

        // Persist to localStorage service history
        const newHistoryEntries = selectedVehicleIds.map((vid) => {
          const v = vehicles.find((veh) => veh.id === vid);
          return {
            id: "fsh-" + Math.random().toString(36).substring(2, 9),
            vehicleId: vid,
            vehicleName: v ? `${v.make} ${v.model} (${v.plate})` : "Unknown",
            serviceType: vehicleServices[vid] || "general_service",
            description: `Bulk booking - ${vehicleServices[vid] || "service"}`,
            status: "scheduled",
            date: `${selectedDate}T${selectedTime}:00`,
            amount: pricing.lineItems.find((li) => li.vehicleId === vid)?.price || 2500,
            providerName: "TBD",
            bookingId: booking.id,
          };
        });

        const updatedHistory = [...newHistoryEntries, ...get().serviceHistory];
        saveFleetServiceHistory(updatedHistory);

        const updatedBookings = [booking, ...get().bookings];
        set({
          bookings: updatedBookings,
          serviceHistory: updatedHistory,
          selectedVehicleIds: [],
          selectedDate: "",
          selectedTime: "",
          vehicleServices: {},
          lastBooking: booking,
        });

        return booking;
      },

      // ── Reset booking flow ───────────────────────────────────

      clearLastBooking: () => set({ lastBooking: null }),

      resetBookingForm: () => {
        set({
          selectedVehicleIds: [],
          selectedDate: "",
          selectedTime: "",
          vehicleServices: {},
          lastBooking: null,
        });
      },
    }),
    {
      name: "clutchd-fleet-store",
      partialize: (state) => ({
        bookings: state.bookings,
        serviceHistory: state.serviceHistory,
      }),
    }
  )
);
