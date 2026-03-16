"use client";

import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  title: string;
  description: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  title,
  description,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <p className="text-sm font-medium text-foreground mb-6">
        This will permanently delete{" "}
        <span className="text-destructive">&quot;{itemName}&quot;</span>
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
