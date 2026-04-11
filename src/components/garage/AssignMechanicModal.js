import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { User, CheckCircle2 } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

const MOCK_STAFF = [
  { id: "m1", name: "Rahul S.", rating: 4.8, status: "available", jobsToday: 2 },
  { id: "m2", name: "Amit K.", rating: 4.5, status: "busy", jobsToday: 4 },
  { id: "m3", name: "Vikram R.", rating: 4.9, status: "available", jobsToday: 1 },
  { id: "m4", name: "Suresh P.", rating: 4.2, status: "available", jobsToday: 3 },
];

export function AssignMechanicModal({ isOpen, onClose, job, onAssign }) {
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  
  if (!job) return null;

  const handleAssign = () => {
    if (selectedMechanic) {
      onAssign(job.id, selectedMechanic);
      setSelectedMechanic(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Job to Mechanic">
      <div className={`mb-6 p-4 rounded-xl border ${isLight ? "bg-stone-50 border-stone-200" : "bg-black/20 border-white/5"}`}>
         <h4 className={`font-semibold mb-1 ${isLight ? "text-stone-900" : "text-white"}`}>{job.customer} • <span className="text-red-500">{job.issue}</span></h4>
         <p className={`text-sm ${isLight ? "text-stone-600" : "text-emerald-100/70"}`}>{job.desc}</p>
         <p className={`text-xs mt-2 ${isLight ? "text-stone-400" : "text-emerald-100/50"}`}>Location: {job.location}</p>
      </div>

      <h4 className={`text-sm font-medium mb-3 ${isLight ? "text-stone-600" : "text-emerald-100/80"}`}>Available Mechanics</h4>
      
      <div className="space-y-2 mb-6 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
        {MOCK_STAFF.map((staff) => (
          <div 
            key={staff.id}
            onClick={() => staff.status === 'available' && setSelectedMechanic(staff.id)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              staff.status !== 'available' 
                ? (isLight ? 'opacity-50 cursor-not-allowed bg-stone-50 border-stone-200' : 'opacity-50 cursor-not-allowed bg-black/20 border-white/5')
                : selectedMechanic === staff.id
                  ? (isLight ? 'bg-amber-50 border-amber-400 cursor-pointer shadow-[0_0_10px_rgba(212,160,17,0.1)]' : 'bg-emerald-500/20 border-emerald-500 cursor-pointer shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.15)]')
                  : (isLight ? 'bg-white border-stone-200 hover:bg-stone-50 cursor-pointer' : 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer')
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLight ? "bg-amber-100 text-amber-600" : "bg-emerald-500/10 text-emerald-400"}`}>
                <User size={16} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isLight ? "text-stone-900" : "text-white"}`}>{staff.name}</p>
                <p className={`text-[10px] ${isLight ? "text-stone-400" : "text-emerald-100/50"}`}>⭐ {staff.rating} • {staff.jobsToday} jobs today</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                staff.status === 'available' 
                  ? (isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/20 text-green-300') 
                  : (isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/20 text-red-300')
              }`}>
                {staff.status.toUpperCase()}
              </span>
              {selectedMechanic === staff.id && (
                <CheckCircle2 size={16} className={`mt-1 ${isLight ? "text-amber-500" : "text-emerald-400"}`} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" disabled={!selectedMechanic} onClick={handleAssign}>Dispatch Mechanic</Button>
      </div>
    </Modal>
  );
}
