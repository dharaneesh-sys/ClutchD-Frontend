import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Trash2, Plus, Car, Loader2, AlertTriangle } from "lucide-react";
import api from "../../lib/api";
import { useThemeStore } from "../../store/themeStore";
import { extractApiError } from "../../lib/api";

export function VehicleManagerModal({ isOpen, onClose, onVehiclesChanged }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    license_plate: "",
    color: "",
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (e) {
      console.warn("Failed to fetch vehicles", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
      setAdding(false);
    }
  }, [isOpen]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : undefined,
      };
      await api.post("/vehicles", payload);
      await fetchVehicles();
      setAdding(false);
      setFormData({ make: "", model: "", year: "", license_plate: "", color: "" });
      if (onVehiclesChanged) onVehiclesChanged();
    } catch (e) {
      setDeleteError(extractApiError(e, "Failed to add vehicle"));
      setTimeout(() => setDeleteError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      if (onVehiclesChanged) onVehiclesChanged();
      setDeleteConfirmId(null);
    } catch (e) {
      setDeleteError(extractApiError(e, "Failed to delete vehicle"));
      setTimeout(() => setDeleteError(null), 4000);
      setDeleteConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage My Vehicles">
      {deleteError && (
        <div className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-sm ${
          isLight ? "bg-red-50 border border-red-200 text-red-700" : "bg-red-500/10 border border-red-500/30 text-red-300"
        }`}>
          <AlertTriangle size={14} className="shrink-0" />
          {deleteError}
        </div>
      )}
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 size={32} className={`animate-spin ${isLight ? "text-yellow-500" : "text-emerald-400"}`} />
        </div>
      ) : adding ? (
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <h4 className={`text-sm font-semibold mb-2 ${isLight ? "text-slate-900" : "text-white"}`}>Add New Vehicle</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Make *" name="make" required value={formData.make} onChange={handleChange} placeholder="e.g. Honda" />
            <Input label="Model *" name="model" required value={formData.model} onChange={handleChange} placeholder="e.g. Civic" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Year" name="year" type="number" min="1900" max="2100" value={formData.year} onChange={handleChange} />
            <Input label="Color" name="color" value={formData.color} onChange={handleChange} />
          </div>
          <Input label="License Plate" name="license_plate" value={formData.license_plate} onChange={handleChange} placeholder="e.g. KA-01-AB-1234" />
          
          <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Vehicle"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className={`text-center py-6 border border-dashed rounded-xl ${isLight ? "border-slate-300 bg-slate-50" : "border-white/10 bg-white/5"}`}>
              <Car size={32} className={`mx-auto mb-2 ${isLight ? "text-slate-300" : "text-white/20"}`} />
              <p className={isLight ? "text-slate-500" : "text-white/50"}>No vehicles added yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {vehicles.map(v => (
                <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLight ? "bg-yellow-500/20 text-yellow-600" : "bg-emerald-500/20 text-emerald-400"}`}>
                      <Car size={18} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{v.year} {v.make} {v.model}</p>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>
                        {v.license_plate || "No plate"} {v.color ? `• ${v.color}` : ""}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDeleteConfirmId(v.id)}
                    disabled={deletingId === v.id}
                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === v.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <Button className="w-full mt-4" onClick={() => setAdding(true)}>
            <Plus size={16} className="mr-2" /> Add Vehicle
          </Button>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId)}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle?"
        confirmLabel="Delete"
        isLoading={!!deletingId}
      />
    </Modal>
  );
}
