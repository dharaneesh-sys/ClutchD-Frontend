import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSignupSchema, mechanicSignupSchema, garageSignupSchema } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";
import { UserCircle, Wrench, Building2, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CustomerFields } from "@/components/auth/CustomerFields";
import { MechanicFields } from "@/components/auth/MechanicFields";
import { GarageFields } from "@/components/auth/GarageFields";

import api from "@/lib/api";
import { useRouter } from "next/navigation";

export function SignUpCard() {
  const [selectedRole, setSelectedRole] = useState("customer");
  const selectedRoleRef = useRef(selectedRole);
  const { signup, loginWithGoogle, isLoading, error: authError } = useAuthStore();
  const router = useRouter();

  const ROLES = [
    { id: "customer", label: "Customer", icon: UserCircle, desc: "Need repairs" },
    { id: "mechanic", label: "Mechanic", icon: Wrench, desc: "Provide services" },
    { id: "garage", label: "Garage", icon: Building2, desc: "Business owner" },
  ];

  const schemas = {
    customer: customerSignupSchema,
    mechanic: mechanicSignupSchema,
    garage: garageSignupSchema,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemas[selectedRole]),
    defaultValues: { role: selectedRole }
  });

  const onSubmit = async (data) => {
    try {
      const user = await signup(data, selectedRole);
      if (user) {
        if (selectedRole === "customer") router.push("/dashboard/customer");
        else if (selectedRole === "mechanic") router.push("/dashboard/mechanic");
        else if (selectedRole === "garage") router.push("/dashboard/garage");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [googleReady, setGoogleReady] = useState(false);
  const googleContainerId = "google-signup-button";

  useEffect(() => {
    selectedRoleRef.current = selectedRole;
    setValue("role", selectedRole);
  }, [selectedRole, setValue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!googleClientId) return;

    const scriptId = "google-identity-services-signup";
    const existing = document.getElementById(scriptId);

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (resp) => {
          const credential = resp?.credential;
          if (!credential) return;

          const role = selectedRoleRef.current;
          let oauthState;
          try {
            const res = await api.get("/auth/oauth/state");
            oauthState = res.data.state;
          } catch {
            oauthState = crypto.randomUUID();
          }
          sessionStorage.setItem("oauth_state", oauthState);
          let user;
          try {
            user = await loginWithGoogle(credential, role, oauthState);
          } finally {
            sessionStorage.removeItem("oauth_state");
          }
          if (!user) return;
          
          if (user.role === "admin") router.push("/admin");
          else router.push(`/dashboard/${user.role}`);
        },
      });
      setGoogleReady(true);
    };

    if (existing) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.integrity = "sha384-IX4ObMWsEDYKqiZlpojF/mzYgFbk0t5RQaxRysGboK0JQerbAAMxt2O1gO/Y/JnB";
    script.crossOrigin = "anonymous";
    script.onload = initGoogle;
    document.body.appendChild(script);

  }, [googleClientId, loginWithGoogle, router]);

  return (
    <GlassCard variant="glass-lux-strong" className="w-full max-w-xl p-6 sm:p-8 pt-10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 tracking-tight text-text-primary">Create Account</h2>
        <p className="text-text-muted">Join the ultimate on-demand platform</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`
                flex flex-col items-center p-3 sm:p-4 rounded-xl border transition-all text-center group
                ${
                  isSelected
                    ? "bg-surface-soft border-border-subtle text-text-primary shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    : "bg-bg-card border-border-subtle text-text-muted hover:bg-surface-soft hover:text-text-primary"
                }
              `}
            >
              <Icon size={24} className={`mb-2 ${isSelected ? "text-icon-highlight" : "text-text-dim group-hover:text-text-primary"}`} />
              <span className="text-sm font-medium mb-1">{role.label}</span>
              <span className="text-[10px] opacity-70 leading-tight hidden sm:block">{role.desc}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="max-h-[300px] overflow-y-auto px-1 -mx-1 custom-scrollbar">
          {selectedRole === "customer" && <CustomerFields register={register} errors={errors} />}
          {selectedRole === "mechanic" && <MechanicFields register={register} errors={errors} watch={watch} setValue={setValue} />}
          {selectedRole === "garage" && <GarageFields register={register} errors={errors} watch={watch} setValue={setValue} />}
        </div>

        {authError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {authError}
          </div>
        )}

        <Button type="submit" className="w-full mt-4" size="lg" isLoading={isLoading}>
          <UserPlus size={18} className="mr-2" />
          Create Account
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-border-subtle"></div>
          </div>
           <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-soft text-primary-text">Or sign up with</span>
           </div>
        </div>

        <div className="w-full space-y-3">
          {googleClientId ? (
            <>
              <div className="w-full rounded-xl border p-3 border-border-subtle bg-bg-card">
                <div
                  id={googleContainerId}
                  ref={(el) => {
                    if (!el) return;
                    if (!googleReady) return;
                    if (el.dataset.rendered) return;
                    window.google.accounts.id.renderButton(el, {
                      theme: "outline",
                      size: "large",
                      type: "standard",
                      shape: "pill",
                      text: "signup_with",
                    });
                    el.dataset.rendered = "1";
                  }}
                />
              </div>
              <p className="text-xs text-center text-text-dim">
                 Google signup will use <span className="font-medium text-text-primary">{selectedRole}</span>.
              </p>
            </>
          ) : (
             <div className="w-full p-3 rounded-xl border text-sm text-center border-border-subtle bg-bg-card text-text-muted">
               Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to enable Google.
             </div>
          )}
        </div>
      </form>
    </GlassCard>
  );
}
