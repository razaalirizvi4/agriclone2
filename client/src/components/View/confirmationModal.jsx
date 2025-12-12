import React from "react";
import "./confirmationModal.css";

/**
 * Generic confirmation modal component.
 * - Accepts arbitrary title/description/content via props
 * - Exposes confirm/cancel callbacks
 * - Supports loading state on the confirm action
 */
const ConfirmationModal = ({
  isOpen,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  disableConfirm = false,
  children,
  confirmVariant = "primary",
  showClose = true,
  onClose,
  extraAction, // { label, onClick, loading, disabled, variant }
  showCancelButton = true,
}) => {
  if (!isOpen) return null;

  const handleClose = onClose || onCancel;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      className="confirmation-modal-backdrop"
      onClick={onCancel}
    >
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        {showClose && (
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="confirmation-modal-close"
          >
            ×
          </button>
        )}
        <div className="confirmation-modal-header">
          <h3
            id="confirmation-modal-title"
            className="confirmation-modal-title"
          >
            {title}
          </h3>
          {description && (
            <p className="confirmation-modal-description">{description}</p>
          )}
        </div>

        {children && <div className="confirmation-modal-body">{children}</div>}

        <div className="confirmation-modal-footer">
          {extraAction && (
            <button
              type="button"
              onClick={extraAction.onClick}
              disabled={extraAction.disabled || extraAction.loading}
              className={`confirmation-modal-extra ${
                extraAction.variant === "danger" ? "danger" : ""
              }`}
            >
              {extraAction.loading ? "Working..." : extraAction.label}
            </button>
          )}
          {showCancelButton && (
            <button
              type="button"
              onClick={onCancel}
              className="confirmation-modal-cancel"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={disableConfirm || loading}
            className={`confirmation-modal-confirm ${
              confirmVariant === "danger" ? "danger" : ""
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
