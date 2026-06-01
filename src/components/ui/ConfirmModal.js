import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Delete",
  isLoading = false,
  variant = "danger",
}) {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <div
          className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
            variant === "danger"
              ? isLight
                ? "bg-red-50"
                : "bg-red-500/10"
              : isLight
                ? "bg-amber-50"
                : "bg-amber-500/10"
          }`}
        >
          <AlertTriangle
            size={28}
            className={
              variant === "danger"
                ? isLight
                  ? "text-red-500"
                  : "text-red-400"
                : isLight
                  ? "text-amber-500"
                  : "text-amber-400"
            }
          />
        </div>
        <p
          className={`text-sm mb-6 ${
            isLight ? "text-slate-600" : "text-white/70"
          }`}
        >
          {message}
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={`flex-1 ${
              variant === "danger"
                ? isLight
                  ? "!bg-red-500 hover:!bg-red-600 !text-white"
                  : "!bg-red-500/80 hover:!bg-red-500 !text-white"
                : ""
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
