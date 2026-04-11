import { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

const MOCK_DISPUTES = [
  {
    id: "DSP-1092",
    jobId: "JOB-4812",
    customer: "Amit S.",
    provider: "Vikram Motors",
    reason: "Overcharged for service",
    amount: "₹1,500",
    status: "Open",
    date: "2 hours ago",
    desc: "The mechanic quoted ₹500 in chat but forced me to pay ₹2000 after opening the hood.",
  },
  {
    id: "DSP-1085",
    jobId: "JOB-4755",
    customer: "Neha J.",
    provider: "Raju Mechanic",
    reason: "Mechanic didn't show up",
    amount: "₹300",
    status: "Investigating",
    date: "1 day ago",
    desc: "Waited for 2 hours, mechanic stopped answering phone.",
  }
];

export function DisputePanel() {
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const resolveDispute = (id) => {
    setDisputes(disputes.filter(d => d.id !== id));
    setSelectedDispute(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      <GlassCard className="flex-1 flex flex-col overflow-hidden max-h-full">
         <div className={`p-4 border-b flex justify-between items-center ${isLight ? "border-stone-200 bg-stone-50/50" : "border-white/5 bg-white/[0.02]"}`}>
            <h3 className={`font-semibold ${isLight ? "text-stone-900" : "text-white"}`}>Active Disputes</h3>
            <Badge variant="danger">{disputes.length} Open</Badge>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
           {disputes.length === 0 ? (
             <div className={`text-center py-12 ${isLight ? "text-stone-400" : "text-white/40"}`}>No active disputes 🎉</div>
           ) : (
             disputes.map(d => (
               <div 
                 key={d.id} 
                 onClick={() => setSelectedDispute(d)}
                 className={`p-4 rounded-xl border transition-all cursor-pointer ${
                   selectedDispute?.id === d.id 
                     ? (isLight ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-red-500/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]')
                     : (isLight ? 'bg-white border-stone-200 hover:bg-stone-50' : 'bg-white/5 border-white/10 hover:bg-white/10')
                 }`}
               >
                 <div className="flex justify-between items-start mb-2">
                   <Badge variant={d.status === 'Open' ? 'danger' : 'warning'} className="mb-2">{d.status}</Badge>
                   <span className={`text-xs ${isLight ? "text-stone-400" : "text-white/40"}`}>{d.date}</span>
                 </div>
                 <h4 className={`font-medium mb-1 ${isLight ? "text-stone-900" : "text-white"}`}><AlertCircle size={14} className="inline mr-1 text-red-500 mb-0.5" />{d.reason}</h4>
                 <p className={`text-sm ${isLight ? "text-stone-500" : "text-white/50"}`}>{d.customer} vs {d.provider}</p>
               </div>
             ))
           )}
         </div>
      </GlassCard>

      {/* Resolution Panel */}
      <GlassCard className={`flex-[1.5] flex flex-col overflow-hidden ${isLight ? "bg-stone-50/50" : "bg-black/40"}`}>
        {selectedDispute ? (
          <div className="p-4 sm:p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`text-xl font-bold mb-1 ${isLight ? "text-stone-900" : "text-white"}`}>Dispute {selectedDispute.id}</h3>
                <p className={`text-sm ${isLight ? "text-stone-500" : "text-emerald-100/60"}`}>Related Job: {selectedDispute.jobId}</p>
              </div>
              <Badge variant="danger" className="text-lg">
                Amount: {selectedDispute.amount}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-xl border ${isLight ? "bg-white border-stone-200" : "bg-white/5 border-white/10"}`}>
                <p className={`text-[10px] uppercase mb-1 ${isLight ? "text-stone-400" : "text-white/40"}`}>Customer</p>
                <p className={`font-medium ${isLight ? "text-stone-900" : "text-white"}`}>{selectedDispute.customer}</p>
              </div>
              <div className={`p-4 rounded-xl border ${isLight ? "bg-white border-stone-200" : "bg-white/5 border-white/10"}`}>
                <p className={`text-[10px] uppercase mb-1 ${isLight ? "text-stone-400" : "text-white/40"}`}>Provider</p>
                <p className={`font-medium ${isLight ? "text-stone-900" : "text-white"}`}>{selectedDispute.provider}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className={`font-medium mb-2 ${isLight ? "text-stone-900" : "text-white"}`}>Customer Complaint</p>
              <div className={`p-4 rounded-xl border text-sm leading-relaxed relative ${isLight ? "bg-red-50 border-red-200 text-red-800" : "bg-red-500/5 border-red-500/20 text-red-100/80"}`}>
                <AlertCircle className={`absolute -left-2 -top-2 rounded-full ${isLight ? "text-red-500 bg-white" : "text-red-500 bg-black"}`} size={20} />
                &quot;{selectedDispute.desc}&quot;
              </div>
            </div>
            
            <div className={`mt-auto space-y-4 pt-6 border-t ${isLight ? "border-stone-200" : "border-white/5"}`}>
              <h4 className={`text-sm font-medium ${isLight ? "text-stone-900" : "text-white"}`}>Resolution Actions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="outline" className={isLight ? "border-green-200 text-green-700 hover:bg-green-50" : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"}>Refund Customer</Button>
                <Button variant="outline" className={isLight ? "border-red-200 text-red-600 hover:bg-red-50" : "border-red-500/30 text-red-400 hover:bg-red-500/10"}>Penalize Provider</Button>
                <Button variant="outline" className={isLight ? "border-stone-200 text-stone-600 hover:bg-stone-50" : "border-white/20 text-white/70 hover:bg-white/10"}>Message Both</Button>
                <Button onClick={() => resolveDispute(selectedDispute.id)}>
                   <CheckCircle2 size={16} className="mr-1.5" /> Close Dispute
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center h-full ${isLight ? "text-stone-400" : "text-white/30"}`}>
            <FileText size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a dispute to view details</p>
            <p className="text-sm">Choose from the list on the left</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
