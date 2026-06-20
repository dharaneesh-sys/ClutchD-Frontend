import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { User, CheckCircle2 } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

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
      <div className="mb-6 p-4 rounded-xl border bg-surface-soft border-border-subtle">
         <h4 className="font-semibold mb-1 text-text-primary">{job.customer} • <span className="text-red-500">{job.issue}</span></h4>
         <p className="text-sm text-text-muted">{job.desc}</p>
         <p className="text-xs mt-2 text-text-dim">Location: {job.location}</p>
      </div>

      <h4 className="text-sm font-medium mb-3 text-text-muted">Available Mechanics</h4>
      
      <div className="space-y-2 mb-6 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
        {MOCK_STAFF.map((staff) => (
          <div 
            key={staff.id}
            onClick={() => staff.status === 'available' && setSelectedMechanic(staff.id)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              staff.status !== 'available' 
                ? 'opacity-50 cursor-not-allowed bg-surface-soft border-border-subtle'
                : selectedMechanic === staff.id
                  ? 'bg-surface-soft border-primary cursor-pointer shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.15)]'
                  : 'bg-bg-card border-border-subtle cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-mid text-icon-highlight">
                <User size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{staff.name}</p>
                <p className="text-[10px] text-text-dim">⭐ {staff.rating} • {staff.jobsToday} jobs today</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                staff.status === 'available' 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {staff.status.toUpperCase()}
              </span>
              {selectedMechanic === staff.id && (
                <CheckCircle2 size={16} className="mt-1 text-icon-highlight" />
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
