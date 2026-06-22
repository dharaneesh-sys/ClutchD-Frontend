import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";
import { Mail, Lock, LogIn, UserCircle, Wrench, Building2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

import { useRouter } from "next/navigation";

export function LoginCard() {
  const { login, loginWithGoogle, isLoading, error: authError } = useAuthStore();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("customer");
  const selectedRoleRef = useRef(selectedRole);

  const ROLES = [
    { id: "customer", label: "Customer", icon: UserCircle, desc: "Find mechanics & garages" },
    { id: "mechanic", label: "Mechanic", icon: Wrench, desc: "Get on-demand jobs" },
    { id: "garage", label: "Garage", icon: Building2, desc: "Manage services locally" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password, selectedRole);
      if (user) {
        if (user.role === "admin") router.push("/admin");
        else router.push(`/dashboard/${user.role}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [googleReady, setGoogleReady] = useState(false);
  const googleContainerId = "google-signin-button";

  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!googleClientId) return;

    const scriptId = "google-identity-services";
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

    return () => {};
  }, [googleClientId, loginWithGoogle, router, selectedRole]);

  const [view, setView] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError("Email is required");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      await api.post("/auth/forgot-password/request", { email: resetEmail });
      setView("forgot_code");
    } catch (err) {
      setResetError(err.response?.data?.detail || err.message || "Request failed");
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      setResetError("Code and new password are required");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      await api.post("/auth/forgot-password/reset", { 
        email: resetEmail, 
        code: resetCode, 
        newPassword: newPassword 
      });
      setView("login");
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
    } catch (err) {
      setResetError(err.response?.data?.detail || err.message || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  if (view === "forgot_email") {
    return (
      <GlassCard variant="glass-lux-strong" className="w-full max-w-md p-8 pt-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2 tracking-tight text-text-primary">Reset Password</h2>
          <p className="text-text-muted">Enter your email to receive a recovery code.</p>
        </div>
        <form onSubmit={handleForgotRequest} className="space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            icon={Mail} 
            value={resetEmail} 
            onChange={(e) => setResetEmail(e.target.value)} 
            placeholder="name@example.com" 
          />
          {resetError && (
             <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
               {resetError}
             </div>
          )}
          <Button type="submit" className="w-full mt-2" size="lg" isLoading={resetLoading}>
             Send Reset Code
          </Button>
          <button 
             type="button" 
             onClick={() => setView("login")} 
              className={`w-full text-sm mt-4 text-center hover:underline text-text-muted`}
          >
             Back to Login
           </button>
         </form>
       </GlassCard>
     );
   }

   if (view === "forgot_code") {
    return (
      <GlassCard variant="glass-lux-strong" className="w-full max-w-md p-8 pt-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2 tracking-tight text-text-primary">Enter Code</h2>
          <p className="text-text-muted">Check your terminal logs for the 6-digit code.</p>
        </div>
        <form onSubmit={handleForgotReset} className="space-y-4">
          <Input 
            label="6-Digit Reset Code" 
            type="text" 
            value={resetCode} 
            onChange={(e) => setResetCode(e.target.value)} 
            placeholder="000000" 
            maxLength={6}
          />
          <Input 
            label="New Password" 
            type="password" 
            icon={Lock} 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="••••••••" 
          />
          {resetError && (
             <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
               {resetError}
             </div>
          )}
          <Button type="submit" className="w-full mt-2" size="lg" isLoading={resetLoading}>
             Reset Password
          </Button>
          <button 
             type="button" 
             onClick={() => setView("login")} 
              className={`w-full text-sm mt-4 text-center hover:underline text-text-muted`}
          >
             Back to Login
           </button>
         </form>
       </GlassCard>
     );
   }

   return (
    <GlassCard variant="glass-lux-strong" className="w-full max-w-md p-8 pt-10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 tracking-tight text-text-primary">Welcome Back</h2>
        <p className="text-text-muted">Sign in to your ClutchD account</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`
                flex flex-col items-center p-3 rounded-xl border transition-all text-center group
                ${
                  isSelected
                    ? "bg-surface-soft border-border-subtle text-text-primary shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    : "bg-bg-card border-border-subtle text-text-muted hover:bg-surface-soft hover:text-text-primary"
                }
              `}
            >
              <Icon
                size={24}
                className={`mb-2 ${isSelected ? "text-icon-highlight" : "text-text-dim group-hover:text-text-primary"}`}
              />
              <span className="text-sm font-medium mb-1">{role.label}</span>
              <span className="text-[10px] opacity-70 leading-tight hidden sm:block">{role.desc}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="name@example.com"
          {...register("email")}
          error={errors.email?.message}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setView("forgot_email")}
              className="text-sm font-medium transition-colors text-icon-highlight"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {authError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {authError}
          </div>
        )}

        <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
          <LogIn size={18} className="mr-2" />
          Sign In
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle"></div>
          </div>
           <div className="relative flex justify-center text-sm">
             <span className="px-2 bg-primary-soft text-primary-text">Or continue with</span>
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
                      text: "continue_with",
                    });
                    el.dataset.rendered = "1";
                  }}
                />
              </div>
              <p className="text-xs text-center text-text-dim">
                Google login will continue as <span className="font-medium text-text-primary">{selectedRole}</span>.
              </p>
            </>
          ) : (
            <div className="w-full p-3 rounded-xl border text-sm text-center border-border-subtle bg-bg-card text-text-muted">
              Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to enable Google login.
            </div>
          )}
        </div>
      </form>
    </GlassCard>
  );
}
