"use client";

import type React from "react";

import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, className, icon, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border border-border shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${className}`}>
              {icon}
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
