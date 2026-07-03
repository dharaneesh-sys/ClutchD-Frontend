import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { User } from "lucide-react";

export function AssignMechanicModal({ isOpen, onClose, job, onAssign }) {
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  
  if (!job) return null;

  const staff = job.mechanics || [];

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

      <h4 className="text-sm font-medium mb-3 text-text-muted">Select Mechanic</h4>
      
      {staff.length === 0 ? (
        <div className="mb-6 flex flex-col items-center justify-center py-8 text-center">
          <User size={32} className="mb-2 text-text-dim" />
          <p className="text-sm text-text-muted">No mechanics available.</p>
          <p className="text-xs text-text-dim mt-1">Add mechanics to your garage first.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {staff.map((staffMember) => (
            <div 
              key={staffMember.id}
              onClick={() => staffMember.status === 'available' && setSelectedMechanic(staffMember.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                staffMember.status !== 'available' 
                  ? 'opacity-50 cursor-not-allowed bg-surface-soft border-border-subtle'
                  : selectedMechanic === staffMember.id
                    ? 'bg-surface-soft border-primary cursor-pointer shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.15)]'
                    : 'bg-bg-card border-border-subtle cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-mid text-icon-highlight">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{staffMember.name}</p>
                  {staffMember.jobsToday !== undefined && (
                    <p className="text-[10px] text-text-dim">{staffMember.jobsToday} jobs today</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  staffMember.status === 'available' 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {staffMember.status.toUpperCase()}
                </span>
                {selectedMechanic === staffMember.id && (
                  <span className="text-[10px] mt-1 text-icon-highlight">SELECTED</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" disabled={!selectedMechanic} onClick={handleAssign}>Dispatch Mechanic</Button>
      </div>
    </Modal>
  );
}
