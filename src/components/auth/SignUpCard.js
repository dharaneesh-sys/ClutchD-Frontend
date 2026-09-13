import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSignupSchema, mechanicSignupSchema, garageSignupSchema, sellerSignupSchema } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";
import { UserCircle, Wrench, Building2, UserPlus, Store } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CustomerFields } from "@/components/auth/CustomerFields";
import { MechanicFields } from "@/components/auth/MechanicFields";
import { GarageFields } from "@/components/auth/GarageFields";
import { SellerFields } from "@/components/auth/SellerFields";

import api from "@/lib/api";
import { uploadKycDocuments } from "@/lib/kycUpload";
import { useRouter } from "next/navigation";

export function SignUpCard() {
  const [selectedRole, setSelectedRole] = useState("customer");
  const selectedRoleRef = useRef(selectedRole);
  const googleButtonRef = useRef(null);
  const signup = useAuthStore((s) => s.signup);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithGoogleCapacitor = useAuthStore((s) => s.loginWithGoogleCapacitor);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);
  const router = useRouter();

  const ROLES = [
    { id: "customer", label: "Customer", icon: UserCircle, desc: "Need repairs" },
    { id: "mechanic", label: "Mechanic", icon: Wrench, desc: "Provide services" },
    { id: "garage", label: "Garage", icon: Building2, desc: "Business owner" },
    { id: "seller", label: "Seller", icon: Store, desc: "Sell parts & accessories" },
  ];

  // Fleet is a frontend persona — the account is customer-role on the
  // backend; company registration happens on the fleet dashboard.
  const backendRole = selectedRole;

  const schemas = {
    customer: customerSignupSchema,
    mechanic: mechanicSignupSchema,
    garage: garageSignupSchema,
    seller: sellerSignupSchema,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemas[selectedRole]),
    defaultValues: { role: selectedRole }
  });

  const onSubmit = async (data) => {
    try {
      // File inputs are outside the zod schema — read them from raw form state
      const raw = getValues();
      const user = await signup(data, backendRole);
      if (user) {
        // Best-effort KYC upload (mechanic/garage) — never blocks the signup
        if (selectedRole === "mechanic" || selectedRole === "garage") {
          uploadKycDocuments({ aadhaarPhoto: raw.aadhaarPhoto, licensePhoto: raw.licensePhoto }).catch(() => {});
        }
        if (selectedRole === "seller") router.push("/dashboard/seller");
        else if (selectedRole === "customer") router.push("/dashboard/customer");
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
    setValue("role", backendRole);
  }, [selectedRole, backendRole, setValue]);

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
    script.crossOrigin = "anonymous";
    script.onload = initGoogle;
    document.body.appendChild(script);

  }, [googleClientId, loginWithGoogle, router]);

  useEffect(() => {
    if (!googleReady) return;
    const el = googleButtonRef.current;
    if (!el) return;
    if (el.dataset.rendered) return;
    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "signup_with",
    });
    el.dataset.rendered = "1";
  }, [googleReady]);

  // Handle Google sign-in when running inside Capacitor native app
  const handleCapacitorGoogleSignIn = async () => {
    try {
      const user = await loginWithGoogleCapacitor(backendRole);
      if (user) {
        if (user.role === "admin") router.push("/admin");
        else if (selectedRole === "seller") router.push("/dashboard/seller");
        else router.push(`/dashboard/${user.role}`);
      }
    } catch (err) {
      console.error("Capacitor Google sign-in failed:", err);
    }
  };

  return (
    <GlassCard variant="glass-lux-strong" className="w-full max-w-xl p-6 sm:p-8 pt-10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 tracking-tight text-text-primary">Create Account</h2>
        <p className="text-text-muted">Join the ultimate on-demand platform</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
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
          {selectedRole === "seller" && <SellerFields register={register} errors={errors} />}
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
                {typeof window !== "undefined" && window.Capacitor?.isNativePlatform() ? (
                  <button
                    type="button"
                    onClick={handleCapacitorGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border-subtle bg-bg-card hover:bg-surface-soft transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    <span className="text-sm font-medium text-text-primary">Sign up with Google</span>
                  </button>
                ) : (
                  <div
                    id={googleContainerId}
                    ref={googleButtonRef}
                  />
                )}
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
