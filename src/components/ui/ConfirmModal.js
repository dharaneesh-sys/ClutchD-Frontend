import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} role="alertdialog">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-[var(--surface-soft)]">
          <AlertTriangle
            size={28}
            className={
              variant === "danger" ? "text-[var(--danger)]" : "text-[var(--primary-dark)]"
            }
          />
        </div>
        <p
          className="text-sm mb-6 text-[var(--text-muted)]"
        >
          {message}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            variant={variant === "danger" ? "danger" : "primary"}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
