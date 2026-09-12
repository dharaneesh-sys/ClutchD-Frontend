"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Car, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import {
  VEHICLE_MAKES,
  VEHICLE_MODELS,
  VEHICLE_YEARS,
  VEHICLE_VARIANTS,
} from "@/lib/vehicleData";

const STORAGE_KEY = "clutchd-selected-vehicle";

/**
 * Reads persisted vehicle from localStorage.
 * Returns null if nothing stored or JSON fails to parse.
 */
function loadVehicle() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate shape — must have at least a make
    if (parsed && typeof parsed === "object" && parsed.make) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cascading vehicle selector for VIN fitment.
 *
 * Renders four chained dropdowns (Make → Model → Year → Variant),
 * persists the full selection to localStorage, and calls onVehicleChange
 * whenever the selection changes.
 *
 * @param {Object}   props
 * @param {Function} [props.onVehicleChange] — Called with the vehicle object
 *   `{ make, makeLabel, model, modelLabel, year, variant, variantLabel }`
 *   whenever the user completes or changes the full selection.
 * @param {string}   [props.className]       — Additional wrapper classes
 */
export function VehicleSelector({ onVehicleChange, className, initialVehicle }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [variant, setVariant] = useState("");

  // ── Initialise from initialVehicle (priority) or localStorage ──
  useEffect(() => {
    if (initialVehicle) {
      setMake(initialVehicle.make || "");
      setModel(initialVehicle.model || "");
      setYear(initialVehicle.year || "");
      setVariant(initialVehicle.variant || "");
    } else {
      const saved = loadVehicle();
      if (saved) {
        setMake(saved.make || "");
        setModel(saved.model || "");
        setYear(saved.year || "");
        setVariant(saved.variant || "");
      }
    }
  }, [initialVehicle]);

  // ── Derived: available options for each cascade level ────────────
  const availableModels = useMemo(
    () => (make ? VEHICLE_MODELS[make] ?? [] : []),
    [make],
  );

  const availableVariants = useMemo(
    () => {
      if (!make || !model) return [];
      const key = `${make}-${model}`;
      return VEHICLE_VARIANTS[key] ?? [];
    },
    [make, model],
  );

  // ── Reset dependent dropdowns when parent changes ───────────────
  const handleMakeChange = useCallback((e) => {
    const newMake = e.target.value;
    setMake(newMake);
    setModel("");
    setYear("");
    setVariant("");
  }, []);

  const handleModelChange = useCallback((e) => {
    const newModel = e.target.value;
    setModel(newModel);
    setYear("");
    setVariant("");
  }, []);

  const handleYearChange = useCallback((e) => {
    setYear(e.target.value);
    setVariant("");
  }, []);

  const handleVariantChange = useCallback((e) => {
    setVariant(e.target.value);
  }, []);

  // ── Persist to localStorage whenever the full selection updates ─
  const fullSelection = useMemo(() => {
    if (!make) return null;

    const makeMeta = VEHICLE_MAKES.find((m) => m.value === make);
    const modelMeta = availableModels.find((m) => m.value === model);
    const variantMeta = availableVariants.find((v) => v.value === variant);

    return {
      make,
      makeLabel: makeMeta?.label ?? make,
      model,
      modelLabel: modelMeta?.label ?? model,
      year,
      variant,
      variantLabel: variantMeta?.label ?? variant,
    };
  }, [make, model, year, variant, availableModels, availableVariants]);

  useEffect(() => {
    if (fullSelection && fullSelection.make && fullSelection.model && fullSelection.year && fullSelection.variant) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullSelection));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
      onVehicleChange?.(fullSelection);
    } else {
      // Partial selection — notify with null so parent knows it's incomplete
      onVehicleChange?.(null);
    }
  }, [fullSelection, onVehicleChange]);

  // ── Clear ────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setMake("");
    setModel("");
    setYear("");
    setVariant("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    onVehicleChange?.(null);
  }, [onVehicleChange]);

  const isComplete = !!(make && model && year && variant);

  return (
    <GlassCard variant="glass-lux" className={cn("p-5 sm:p-6", className)}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary-light">
            <Car size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Vehicle Fitment
            </h3>
            <p className="text-[0.6875rem] text-text-dim">
              Select your vehicle to check part compatibility
            </p>
          </div>
        </div>

        {isComplete && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.6875rem] font-medium text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
            title="Clear vehicle selection"
          >
            <RotateCcw size={13} />
            Clear
          </button>
        )}
      </div>

      {/* ── Dropdown grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Make */}
        <Select
          label="Make"
          placeholder="Select make…"
          options={VEHICLE_MAKES}
          value={make}
          onChange={handleMakeChange}
        />

        {/* Model — disabled until make is selected */}
        <Select
          label="Model"
          placeholder={make ? "Select model…" : "Select make first"}
          options={availableModels}
          value={model}
          onChange={handleModelChange}
          disabled={!make}
        />

        {/* Year — disabled until model is selected */}
        <Select
          label="Year"
          placeholder={model ? "Select year…" : "Select model first"}
          options={VEHICLE_YEARS}
          value={year}
          onChange={handleYearChange}
          disabled={!model}
        />

        {/* Variant — disabled until year is selected */}
        <Select
          label="Variant"
          placeholder={year ? "Select variant…" : "Select year first"}
          options={availableVariants}
          value={variant}
          onChange={handleVariantChange}
          disabled={!year}
        />
      </div>

      {/* ── Selection summary ────────────────────────────────── */}
      {isComplete && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-icon-highlight/20 bg-icon-highlight/10 px-4 py-2.5 text-sm">
          <CheckCircle2 size={16} className="shrink-0 text-icon-highlight" />
          <span className="text-text-primary">
            <span className="font-medium">{fullSelection.makeLabel}</span>{" "}
            <span className="text-text-muted">{fullSelection.modelLabel}</span>
            {" · "}
            <span className="text-text-muted">{fullSelection.year}</span>
            {" · "}
            <span className="text-text-dim">{fullSelection.variantLabel}</span>
          </span>
        </div>
      )}
    </GlassCard>
  );
}
