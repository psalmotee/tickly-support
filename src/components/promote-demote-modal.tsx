"use client";

import { ArrowUp, ArrowDown } from "lucide-react";

interface PromoteDemoteModalProps {
  title: string;
  description: string;
  itemName: string;
  action: "promote" | "demote";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PromoteDemoteModal({
  description,
  itemName,
  action,
  onConfirm,
  onCancel,
  isLoading = false,
}: PromoteDemoteModalProps) {
  const isPrimary = action === "promote";
  const buttonColor = isPrimary
    ? "bg-primary hover:bg-primary/90"
    : "bg-amber-600 hover:bg-amber-600/90";
  const actionText = isPrimary ? "Promote" : "Demote";

  return (
    <div>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <p className="text-sm font-medium text-foreground mb-6">
        This will {actionText.toLowerCase()}{" "}
        <span className={isPrimary ? "text-primary" : "text-amber-700"}>
          {itemName}
        </span>
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
          className={`flex-1 rounded-lg ${buttonColor} px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {isLoading ? `${actionText}ing...` : actionText}
        </button>
      </div>
    </div>
  );
}
