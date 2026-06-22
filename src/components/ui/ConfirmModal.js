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
        <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-surface-soft">
          <AlertTriangle
            size={28}
            className={
              variant === "danger"
                ? "text-red-500"
                : "text-amber-500"
            }
          />
        </div>
        <p
          className="text-sm mb-6 text-text-muted"
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
                ? "!bg-red-500 hover:!bg-red-600 !text-white"
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
