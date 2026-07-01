"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lock,
  LogOut,
  Trash2,
  Bell,
  BellRing,
  MessageSquare,
  Mail,
  Moon,
  Sun,
  Monitor,
  Globe,
  Shield,
  Download,
  Eye,
  Check,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import api, { extractApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import { navigateToAuth } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Constants ──────────────────────────────────────────────────────────

const DEMO_SETTINGS = {
  push_notifications: true,
  sms_notifications: true,
  email_notifications: true,
  theme: "system",
  language: "en",
};

const THEME_OPTIONS = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "ta", label: "Tamil", flag: "🇮🇳" },
];

// ─── Loading Skeleton ────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="p-4 page-enter space-y-6">
      <div className="space-y-1 mb-2">
        <Skeleton variant="title" className="w-40" />
        <Skeleton className="w-56" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-lux rounded-2xl p-6 space-y-4">
          <Skeleton variant="title" className="w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Toggle Switch ───────────────────────────────────────────────────────

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
        enabled ? "bg-primary" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
          enabled ? "translate-x-[1.375rem]" : "translate-x-[0.25rem]"
        )}
      />
    </button>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, danger }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
          danger
            ? "bg-red-500/10 ring-1 ring-red-500/20"
            : "bg-white/10 ring-1 ring-white/10"
        )}
      >
        <Icon
          size={18}
          className={danger ? "text-red-400" : "text-text-dim"}
        />
      </div>
      <h2
        className={cn(
          "text-base font-semibold",
          danger ? "text-red-400" : "text-foreground"
        )}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── System Theme Listener ───────────────────────────────────────────────

/**
 * Resolve "system" theme preference to "light" or "dark" and keep it in sync.
 * Returns the resolved theme string.
 */
function useResolvedTheme(preference) {
  const [resolved, setResolved] = useState("dark");

  useEffect(() => {
    if (preference !== "system") {
      setResolved(preference);
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setResolved(mq.matches ? "dark" : "light");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [preference]);

  return resolved;
}

// ─── Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const { setTheme: applyTheme } = useThemeStore();
  const toast = useToastStore();

  // ── State ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Settings state
  const [pushEnabled, setPushEnabled] = useState(DEMO_SETTINGS.push_notifications);
  const [smsEnabled, setSmsEnabled] = useState(DEMO_SETTINGS.sms_notifications);
  const [emailEnabled, setEmailEnabled] = useState(DEMO_SETTINGS.email_notifications);
  const [themePref, setThemePref] = useState(DEMO_SETTINGS.theme);
  const [language, setLanguage] = useState(DEMO_SETTINGS.language);

  // Password change modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState({});
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // Confirm modals
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Resolve system theme to actual value
  const resolvedTheme = useResolvedTheme(themePref);

  // ── Fetch settings on mount ──────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/settings");
      const data = res.data;

      const push = data.push_notifications ?? DEMO_SETTINGS.push_notifications;
      const sms = data.sms_notifications ?? DEMO_SETTINGS.sms_notifications;
      const email = data.email_notifications ?? DEMO_SETTINGS.email_notifications;
      const theme = data.theme || DEMO_SETTINGS.theme;
      const lang = data.language || DEMO_SETTINGS.language;

      setPushEnabled(push);
      setSmsEnabled(sms);
      setEmailEnabled(email);
      setThemePref(theme);
      setLanguage(lang);
    } catch (err) {
      // Use demo defaults on failure — no error state for first load,
      // user can still interact with local state
      setError(extractApiError(err, "Could not load settings. Using defaults."));
      setPushEnabled(DEMO_SETTINGS.push_notifications);
      setSmsEnabled(DEMO_SETTINGS.sms_notifications);
      setEmailEnabled(DEMO_SETTINGS.email_notifications);
      setThemePref(DEMO_SETTINGS.theme);
      setLanguage(DEMO_SETTINGS.language);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Sync resolved system theme to ThemeProvider ──────────────────────
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  // ── Save settings to API ─────────────────────────────────────────────
  const saveSettings = useCallback(
    async (updatedFields) => {
      setSaving(true);
      try {
        await api.put("/settings", updatedFields);
        toast.success("Settings saved");
      } catch (err) {
        toast.error(extractApiError(err, "Failed to save settings"));
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleToggleNotification = useCallback(
    (key, currentValue, setter) => {
      const next = !currentValue;
      setter(next);
      saveSettings({ [key]: next });
    },
    [saveSettings]
  );

  const handleThemeChange = useCallback(
    (value) => {
      setThemePref(value);
      saveSettings({ theme: value });
    },
    [saveSettings]
  );

  const handleLanguageChange = useCallback(
    (value) => {
      setLanguage(value);
      saveSettings({ language: value });

      // Attempt to switch i18n locale using next-intl cookie pattern
      try {
        if (typeof window !== "undefined") {
          document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=${
            365 * 24 * 60 * 60
          }; SameSite=Lax`;
        }
      } catch {
        // cookie write failed — non-critical
      }
    },
    [saveSettings]
  );

  const handleLogout = useCallback(async () => {
    setLogoutConfirmOpen(false);
    await logout();
    navigateToAuth();
  }, [logout]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleteSubmitting(true);
    try {
      await api.delete("/settings/delete-account");
      toast.success("Account deleted");
      await logout();
      navigateToAuth();
    } catch (err) {
      toast.error(extractApiError(err, "Failed to delete account"));
    } finally {
      setDeleteSubmitting(false);
      setDeleteConfirmOpen(false);
    }
  }, [logout, toast]);

  const handleChangePassword = useCallback(async () => {
    // Validate
    const errors = {};
    if (!pwCurrent.trim()) errors.current = "Current password is required";
    if (!pwNew || pwNew.length < 6)
      errors.new = "New password must be at least 6 characters";
    if (pwNew !== pwConfirm) errors.confirm = "Passwords do not match";

    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwSubmitting(true);
    try {
      await api.put("/settings/change-password", {
        current_password: pwCurrent,
        new_password: pwNew,
      });
      toast.success("Password changed successfully");
      setPwModalOpen(false);
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setPwErrors({});
    } catch (err) {
      toast.error(extractApiError(err, "Failed to change password"));
    } finally {
      setPwSubmitting(false);
    }
  }, [pwCurrent, pwNew, pwConfirm, toast]);

  const handleDataDownload = useCallback(() => {
    toast.success("Data download request submitted");
  }, [toast]);

  // ── Render ───────────────────────────────────────────────────────────
  if (loading) return <SettingsSkeleton />;

  return (
    <div className="p-4 page-enter space-y-6">
      {/* Page Header */}
      <div className="space-y-1 mb-1">
        <h1 className="type-headline-3 text-foreground">Settings</h1>
        <p className="type-body-2 text-text-muted">
          Manage your account preferences
        </p>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 glass-lux rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-amber-400"
          />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <button
            onClick={fetchSettings}
            className="text-xs font-medium text-primary-light hover:text-primary shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Saving Indicator ──────────────────────────────────────────── */}
      {saving && (
        <div className="flex items-center gap-2 text-xs text-text-muted animate-fade-in-up">
          <Loader2 size={14} className="animate-spin" />
          Saving...
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ACCOUNT SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="glass-lux rounded-2xl p-6 space-y-4">
        <SectionHeader icon={Lock} title="Account" danger />

        {/* Change Password */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <Lock size={16} className="text-text-dim" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Change Password
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Update your account password
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPwModalOpen(true)}
          >
            Update
          </Button>
        </div>

        <div className="h-px bg-white/5" />

        {/* Logout */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut size={16} className="text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Log Out</p>
              <p className="text-xs text-text-muted mt-0.5">
                Sign out of your account
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="!text-red-400 hover:!bg-red-500/10"
            onClick={() => setLogoutConfirmOpen(true)}
          >
            Logout
          </Button>
        </div>

        <div className="h-px bg-white/5" />

        {/* Delete Account */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <Trash2 size={16} className="text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Delete Account
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Permanently remove your account and data
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Delete
          </Button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          NOTIFICATIONS SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="glass-lux rounded-2xl p-6 space-y-4">
        <SectionHeader icon={Bell} title="Notifications" />

        <div className="space-y-1">
          {/* Push Notifications */}
          <div className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <BellRing size={16} className="text-text-dim" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Push Notifications
                </p>
                <p className="text-xs text-text-muted">
                  Receive push alerts on your device
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={pushEnabled}
              onChange={() =>
                handleToggleNotification(
                  "push_notifications",
                  pushEnabled,
                  setPushEnabled
                )
              }
            />
          </div>

          <div className="h-px bg-white/5" />

          {/* SMS Notifications */}
          <div className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-text-dim" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  SMS Notifications
                </p>
                <p className="text-xs text-text-muted">
                  Get text messages for updates
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={smsEnabled}
              onChange={() =>
                handleToggleNotification(
                  "sms_notifications",
                  smsEnabled,
                  setSmsEnabled
                )
              }
            />
          </div>

          <div className="h-px bg-white/5" />

          {/* Email Notifications */}
          <div className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Mail size={16} className="text-text-dim" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Email Notifications
                </p>
                <p className="text-xs text-text-muted">
                  Receive updates via email
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={emailEnabled}
              onChange={() =>
                handleToggleNotification(
                  "email_notifications",
                  emailEnabled,
                  setEmailEnabled
                )
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          APPEARANCE SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="glass-lux rounded-2xl p-6 space-y-4">
        <SectionHeader icon={Sun} title="Appearance" />

        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200",
                "border text-center",
                themePref === value
                  ? "border-primary/30 bg-primary/10 ring-1 ring-primary/20"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
              )}
            >
              <Icon
                size={22}
                className={
                  themePref === value
                    ? "text-primary-light"
                    : "text-text-dim"
                }
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  themePref === value
                    ? "text-primary-light"
                    : "text-text-muted"
                )}
              >
                {label}
              </span>
              {themePref === value && (
                <Check size={14} className="text-primary-light absolute top-2 right-2" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          LANGUAGE SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="glass-lux rounded-2xl p-6 space-y-4">
        <SectionHeader icon={Globe} title="Language" />

        <div className="grid grid-cols-2 gap-3">
          {LANGUAGE_OPTIONS.map(({ value, label, flag }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleLanguageChange(value)}
              className={cn(
                "flex items-center gap-3 rounded-xl p-4 transition-all duration-200",
                "border",
                language === value
                  ? "border-primary/30 bg-primary/10 ring-1 ring-primary/20"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
              )}
            >
              <span className="text-lg">{flag}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  language === value ? "text-primary-light" : "text-foreground"
                )}
              >
                {label}
              </span>
              {language === value && (
                <Check size={16} className="text-primary-light ml-auto" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRIVACY SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="glass-lux rounded-2xl p-6 space-y-4">
        <SectionHeader icon={Shield} title="Privacy" />

        {/* Manage Permissions */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary-light" />
            <p className="text-sm font-medium text-foreground">
              App Permissions
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Smartphone, label: "Location" },
              { icon: Eye, label: "Camera" },
              { icon: Bell, label: "Notifications" },
            ].map(({ icon: PermIcon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-white/[0.03] py-3"
              >
                <PermIcon size={16} className="text-text-dim" />
                <span className="text-[0.625rem] text-text-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            This app uses location services to find nearby mechanics, camera
            for profile photos, and notifications for service updates. You can
            manage these in your device settings.
          </p>
        </div>

        <div className="h-px bg-white/5" />

        {/* Data Download */}
        <button
          type="button"
          onClick={handleDataDownload}
          className="flex items-center justify-between w-full py-3 px-1 rounded-xl hover:bg-white/[0.02] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <Download size={16} className="text-text-dim" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Download My Data
              </p>
              <p className="text-xs text-text-muted">
                Request a copy of your account data
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-dim shrink-0" />
        </button>

        <div className="h-px bg-white/5" />

        {/* Account Visibility */}
        <div className="flex items-center justify-between py-3 px-1 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <Eye size={16} className="text-text-dim" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Account Visibility
              </p>
              <p className="text-xs text-text-muted">
                Your profile is visible to service providers
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-500/15 text-emerald-300 text-[0.625rem] font-semibold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        </div>
      </section>

      {/* Extra bottom spacing since layout adds pb-20 from BottomNav */}
      <div className="h-4" />

      {/* ══════════════════════════════════════════════════════════════════
          CHANGE PASSWORD MODAL
          ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={pwModalOpen}
        onClose={() => {
          if (!pwSubmitting) {
            setPwModalOpen(false);
            setPwErrors({});
          }
        }}
        title="Change Password"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleChangePassword();
          }}
          className="space-y-4"
        >
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
            error={pwErrors.current}
            disabled={pwSubmitting}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 6 characters"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            error={pwErrors.new}
            disabled={pwSubmitting}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            error={pwErrors.confirm}
            disabled={pwSubmitting}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setPwModalOpen(false);
                setPwErrors({});
              }}
              disabled={pwSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={pwSubmitting}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          LOGOUT CONFIRM MODAL
          ══════════════════════════════════════════════════════════════════ */}
      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Log Out"
        message="Are you sure you want to log out? You'll need to sign in again to access your account."
        confirmLabel="Log Out"
        variant="danger"
      />

      {/* ══════════════════════════════════════════════════════════════════
          DELETE ACCOUNT CONFIRM MODAL
          ══════════════════════════════════════════════════════════════════ */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your data, orders, and account history will be removed."
        confirmLabel="Delete My Account"
        variant="danger"
        isLoading={deleteSubmitting}
      />
    </div>
  );
}
