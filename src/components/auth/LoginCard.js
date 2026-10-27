import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";
import { setFleetPersona } from "@/lib/persona";
import { Check, Mail, Lock, LogIn, UserCircle, Wrench, Building2, Truck, Store } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

import { useRouter } from "next/navigation";

export function LoginCard({ onNeedSignUp }) {
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithGoogleCapacitor = useAuthStore((s) => s.loginWithGoogleCapacitor);
  const authError = useAuthStore((s) => s.error);
  const signupNeeded = useAuthStore((s) => s._signupNeeded);
  // Remembers the email last submitted so "Create an account" can prefill it.
  const lastLoginEmail = useRef("");
  const router = useRouter();
  const setRememberMe = useAuthStore((s) => s.setRememberMe);
  const [rememberMe, setRememberMeChecked] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [selectedRole, setSelectedRole] = useState("customer");
  const selectedRoleRef = useRef(selectedRole);
  const googleButtonRef = useRef(null);

  const ROLES = [
    { id: "customer", label: "Customer", icon: UserCircle, desc: "Find mechanics & garages" },
    { id: "mechanic", label: "Mechanic", icon: Wrench, desc: "Get on-demand jobs" },
    { id: "garage", label: "Garage", icon: Building2, desc: "Manage services locally" },
    { id: "seller", label: "Seller", icon: Store, desc: "Sell parts & accessories" },
    { id: "fleet", label: "Fleet", icon: Truck, desc: "Manage business fleets" },
  ];

  // Fleet is a frontend persona: accounts are customer-role on the backend,
  // so OAuth/registration hints must use a backend-known role.
  const backendRole = selectedRole === "fleet" ? "customer" : selectedRole;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      lastLoginEmail.current = data.email;
      setRememberMe(rememberMe);
      const user = await login(data.email, data.password, selectedRole, { rememberMe });
      if (user) {
        // Record the Fleet persona intent (chip = Fleet → fleet dashboard on
        // cold starts too). Any other chip clears it.
        setFleetPersona(selectedRole === "fleet");
        // Defer navigation to break React 19's flushSync cascade
        // Without this, router.push() can start a transition render while
        // effects from the authStore set() calls are still flushing,
        // causing nestedUpdateCount to accumulate beyond the 50 limit.
        setTimeout(() => {
          if (user.role === "admin") router.push("/admin");
          else if (selectedRole === "fleet") router.push("/dashboard/fleet");
          else router.push(`/dashboard/${user.role}`);
        }, 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /** Unknown email (backend 404): send the user to sign-up with the email
   *  prefilled instead of leaving them on a dead-end error. */
  const goToSignup = useCallback(
    (email) => {
      try {
        if (email) sessionStorage.setItem("clutchd-signup-email", email);
      } catch {}
      if (typeof onNeedSignUp === "function") {
        // Same-page view switch (auth page owns the login/signup toggle).
        onNeedSignUp(false);
      } else {
        router.push("/auth?mode=signup");
      }
    },
    [router, onNeedSignUp]
  );

  const navigateAfterGoogleLogin = useCallback((user) => {
    // Persona flag follows the chip the user picked, not the account's
    // server role — fleet chip keeps opening the fleet dashboard.
    setFleetPersona(selectedRoleRef.current === "fleet");
    setTimeout(() => {
      if (user.role === "admin") router.push("/admin");
      else if (selectedRoleRef.current === "fleet") router.push("/dashboard/fleet");
      else router.push(`/dashboard/${user.role}`);
    }, 0);
  }, [router]);

  const handleGoogleCallback = useCallback(async (resp) => {
    const credential = resp?.credential;
    if (!credential) return;
    const role = selectedRoleRef.current === "fleet" ? "customer" : selectedRoleRef.current;
    let oauthState;
    try {
      const res = await api.get("/auth/oauth/state");
      oauthState = res.data.state;
    } catch {
      oauthState = crypto.randomUUID();
    }
    sessionStorage.setItem("oauth_state", oauthState);
    setRememberMe(rememberMe);
    let user;
    try {
      user = await loginWithGoogle(credential, role, oauthState);
    } finally {
      sessionStorage.removeItem("oauth_state");
    }
    if (!user) return;

    navigateAfterGoogleLogin(user);
  }, [loginWithGoogle, navigateAfterGoogleLogin, rememberMe, setRememberMe]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [googleReady, setGoogleReady] = useState(false);
  const googleContainerId = "google-signin-button";
  const handleGoogleCallbackRef = useRef(handleGoogleCallback);
  handleGoogleCallbackRef.current = handleGoogleCallback;

  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  // Show session-expired notice after restoreSession redirects with ?expired=1.
  // window.location is read in an effect (not useSearchParams) so the
  // statically-exported Capacitor build needs no Suspense boundary.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const expired = new URLSearchParams(window.location.search).get("expired");
      if (expired === "1") {
        setSessionExpired(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    } catch (e) {
      console.warn("[LoginCard] expired-param read failed:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!googleClientId) return;

    const scriptId = "google-identity-services";
    const existing = document.getElementById(scriptId);

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (resp) => {
          // Use ref to always call the latest handleGoogleCallback
          handleGoogleCallbackRef.current(resp);
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

    return () => {};
  }, [googleClientId]);

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
      text: "continue_with",
    });
    el.dataset.rendered = "1";
  }, [googleReady]);

  // Handle Google sign-in when running inside Capacitor native app
  const handleCapacitorGoogleSignIn = async () => {
    try {
      setRememberMe(rememberMe);
      const user = await loginWithGoogleCapacitor(backendRole);
      if (user) navigateAfterGoogleLogin(user);
    } catch (err) {
      console.error("Capacitor Google sign-in failed:", err);
    }
  };

  const [view, setView] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetNotice, setResetNotice] = useState("");
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
      const { data } = await api.post("/auth/forgot-password/request", { email: resetEmail });
      // When the server has no email channel it returns the code in the
      // message with a clear warning — surface it instead of dead-ending.
      const msg = typeof data?.message === "string" ? data.message : "";
      if (msg.includes("Dev-mode reset code")) {
        const match = msg.match(/([A-Za-z0-9_-]{8})\s*$/);
        setResetNotice(match ? `Server has no email configured — use code: ${match[1]}` : msg);
      } else {
        setResetNotice(msg ? `Reset code sent to ${resetEmail}.` : "");
      }
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
      setResetNotice("");
    } catch (err) {
      setResetError(err.response?.data?.detail || err.message || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  if (view === "forgot_email") {
    return (
      <GlassCard className="w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-1 tracking-tight text-[var(--foreground)]">Reset Password</h2>
          <p className="text-[var(--text-muted)]">Enter your email to receive a recovery code.</p>
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
             <div role="alert" className="p-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] text-[var(--danger-ink)] text-sm">
               {resetError}
             </div>
          )}
          <Button type="submit" className="w-full mt-2" size="lg" isLoading={resetLoading}>
             Send Reset Code
          </Button>
          <button 
             type="button" 
             onClick={() => setView("login")} 
              className="w-full min-h-[44px] text-sm mt-2 text-center font-medium hover:underline text-[var(--primary-dark)]"
          >
             Back to Login
           </button>
         </form>
       </GlassCard>
     );
   }

   if (view === "forgot_code") {
    return (
      <GlassCard className="w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-1 tracking-tight text-[var(--foreground)]">Enter Code</h2>
          <p className="text-[var(--text-muted)]">Enter the reset code you received.</p>
        </div>
        <form onSubmit={handleForgotReset} className="space-y-4">
          {resetNotice && (
            <div role="status" className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--primary-dark)] text-sm">
              {resetNotice}
            </div>
          )}
          <Input 
            label="Reset Code" 
            type="text" 
            value={resetCode} 
            onChange={(e) => setResetCode(e.target.value)} 
            placeholder="e.g. xK39fT2a" 
            maxLength={16}
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
             <div role="alert" className="p-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] text-[var(--danger-ink)] text-sm">
               {resetError}
             </div>
          )}
          <Button type="submit" className="w-full mt-2" size="lg" isLoading={resetLoading}>
             Reset Password
          </Button>
          <button 
             type="button" 
             onClick={() => setView("login")} 
              className="w-full min-h-[44px] text-sm mt-2 text-center font-medium hover:underline text-[var(--primary-dark)]"
          >
             Back to Login
           </button>
         </form>
       </GlassCard>
     );
   }

   return (
    <GlassCard className="w-full max-w-md p-5 sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold mb-1 tracking-tight text-[var(--foreground)]">Welcome back</h2>
        <p className="text-[var(--text-muted)]">Sign in to your ClutchD account</p>
      </div>

      <p id="login-role-label" className="mb-2 text-sm font-medium text-[var(--foreground)]">I am a</p>
      <div
        role="group"
        aria-labelledby="login-role-label"
        className="-mx-1 mb-6 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0"
      >
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              aria-pressed={isSelected}
              className={`
                relative flex min-h-[72px] min-w-[84px] shrink-0 snap-start flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--surface-soft)] text-[var(--primary-dark)]"
                    : "border-[var(--border)] bg-[var(--surface-card)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                }
              `}
            >
              {isSelected && (
                <Check size={14} aria-hidden="true" className="absolute right-1.5 top-1.5 text-[var(--primary-dark)]" />
              )}
              <Icon size={22} aria-hidden="true" className="mb-1.5" />
              <span className="text-sm font-medium mb-1">{role.label}</span>
              <span className="text-[10px] leading-tight hidden sm:block text-[var(--text-muted)]">{role.desc}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
          <div className="flex items-center justify-between">
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeChecked(e.target.checked)}
                className="h-5 w-5 rounded accent-[var(--primary)]"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setView("forgot_email")}
              className="min-h-[44px] px-1 text-sm font-medium transition-colors text-[var(--primary-dark)] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>
        {sessionExpired && (
          <div role="status" className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--primary-dark)] text-sm">
            Your session expired. Please sign in again.
          </div>
        )}
        {authError && (
          <div role="alert" className="p-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] text-[var(--danger-ink)] text-sm">
            {authError}
            {signupNeeded && (
              <button
                type="button"
                onClick={() => goToSignup(lastLoginEmail.current)}
                className="mt-2 w-full min-h-[44px] rounded-xl bg-[var(--primary)] text-[var(--on-primary)] text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors"
              >
                Create an account
              </button>
            )}
          </div>
        )}
        <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
          <LogIn size={18} aria-hidden="true" />
          Sign In
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]"></div>
          </div>
           <div className="relative flex justify-center text-sm">
             <span className="px-2 bg-[var(--surface-card)] text-[var(--text-muted)]">Or continue with</span>
           </div>
        </div>

        <div className="w-full space-y-3">
          {googleClientId ? (
            <>
              <div className="w-full rounded-xl border p-2 border-[var(--border)] bg-[var(--surface-card)]">
                {typeof window !== "undefined" && window.Capacitor?.isNativePlatform() ? (
                  <button
                    type="button"
                    onClick={handleCapacitorGoogleSignIn}
                    className="w-full min-h-[48px] flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-soft)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    <span className="text-sm font-medium text-[var(--foreground)]">Sign in with Google</span>
                  </button>
                ) : (
                  <div
                    id={googleContainerId}
                    ref={googleButtonRef}
                  />
                )}
              </div>
              <p className="text-xs text-center text-[var(--text-muted)]">
                {selectedRole === "fleet" ? (
                  <>
                    Google login will open <span className="font-medium text-[var(--foreground)]">Fleet</span>.{" "}
                  </>
                ) : (
                  <>
                    New Google accounts sign up as{" "}
                    <span className="font-medium text-[var(--foreground)]">{selectedRole}</span>.{" "}
                  </>
                )}
                Existing accounts always open in their original role.
              </p>
            </>
          ) : (
            <div className="w-full p-3 rounded-xl border text-sm text-center border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
              Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to enable Google login.
            </div>
          )}
        </div>
      </form>
    </GlassCard>
  );
}
