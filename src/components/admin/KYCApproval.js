import { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

const MOCK_APPLICATIONS = [
  {
    id: "APP-9281",
    name: "Raju Mechanic",
    type: "Independent Mechanic",
    submitted: "2 hours ago",
    status: "Pending",
    documents: ["Aadhaar", "Driving License", "Skill Certificate"]
  },
  {
    id: "APP-9275",
    name: "Speedy Garage",
    type: "Garage Enterprise",
    submitted: "5 hours ago",
    status: "Pending",
    documents: ["GST Registration", "Shop Establishment Act", "Owner ID"]
  },
  {
    id: "APP-9260",
    name: "Vikram Motors",
    type: "Garage Enterprise",
    submitted: "1 day ago",
    status: "Pending",
    documents: ["GST Registration", "Owner ID"]
  }
];

export function KYCApproval() {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const handleApprove = (id) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  const handleReject = (id) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {applications.length === 0 ? (
        <div className={`col-span-full py-12 text-center ${isLight ? "text-stone-400" : "text-white/50"}`}>
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p>No pending KYC applications.</p>
        </div>
      ) : (
        applications.map((app) => (
          <GlassCard key={app.id} className="p-5 sm:p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`text-lg font-bold ${isLight ? "text-stone-900" : "text-white"}`}>{app.name}</h3>
                <p className={`text-xs font-medium ${isLight ? "text-amber-700" : "text-emerald-400"}`}>{app.type}</p>
              </div>
              <Badge variant="warning">{app.status}</Badge>
            </div>
            
            <div className="mb-4">
              <p className={`text-xs mb-2 ${isLight ? "text-stone-400" : "text-white/40"}`}>Submitted {app.submitted}</p>
              <p className={`text-sm font-medium mb-1 ${isLight ? "text-stone-700" : "text-white/80"}`}>Attached Documents:</p>
              <ul className={`text-sm space-y-1 ${isLight ? "text-stone-500" : "text-white/60"}`}>
                {app.documents.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <FileText size={12} className={isLight ? "text-amber-500" : "text-emerald-500/70"} /> {doc}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={`mt-auto grid grid-cols-2 gap-3 pt-4 border-t ${isLight ? "border-stone-200" : "border-white/5"}`}>
              <Button 
                variant="outline" 
                className={isLight ? "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" : "text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"}
                onClick={() => handleReject(app.id)}
              >
                <XCircle size={16} className="mr-2" /> Reject
              </Button>
              <Button 
                onClick={() => handleApprove(app.id)}
              >
                <CheckCircle size={16} className="mr-2" /> Approve
              </Button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
