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

  const confirmColors =
    confirmVariant === "danger"
      ? {
          backgroundColor: "#dc2626",
          hoverColor: "#b91c1c",
          shadow: "rgba(220, 38, 38, 0.35)",
        }
      : {
          backgroundColor: "#16a34a",
          hoverColor: "#15803d",
          shadow: "rgba(22, 163, 74, 0.35)",
        };

  const extraColors =
    extraAction?.variant === "danger"
      ? { backgroundColor: "#fee2e2", color: "#b91c1c", border: "#fecaca" }
      : { backgroundColor: "#eef2ff", color: "#4338ca", border: "#e0e7ff" };

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
              className="confirmation-modal-extra"
              style={{
                border: `1px solid ${extraColors.border}`,
                backgroundColor: extraColors.backgroundColor,
                color: extraColors.color,
                cursor:
                  extraAction.disabled || extraAction.loading
                    ? "not-allowed"
                    : "pointer",
              }}
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
            className="confirmation-modal-confirm"
            style={{
              backgroundColor:
                disableConfirm || loading
                  ? "#9ca3af"
                  : confirmColors.backgroundColor,
              cursor: disableConfirm || loading ? "not-allowed" : "pointer",
              boxShadow: `0 6px 16px ${confirmColors.shadow}`,
            }}
            onMouseEnter={(e) => {
              if (!disableConfirm && !loading)
                e.currentTarget.style.backgroundColor =
                  confirmColors.hoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                disableConfirm || loading
                  ? "#9ca3af"
                  : confirmColors.backgroundColor;
            }}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
