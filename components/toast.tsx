"use client";

import { X, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Toast } from "@/hooks/use-toast";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <ol
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[60] flex w-[min(360px,calc(100vw-48px))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const isError = t.type === "error";
        const Icon = isError ? XCircle : CheckCircle2;
        return (
          <li
            key={t.id}
            role={isError ? "alert" : "status"}
            className={cn(
              "flex animate-slide-in items-start gap-2.5 rounded-[10px] border bg-popover py-3 pl-3.5 pr-2.5",
              "shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]",
              isError ? "border-destructive/35" : "border-border"
            )}
          >
            <Icon className={cn("mt-px h-4 w-4 flex-none", isError ? "text-destructive" : "text-success")} />
            <p className="flex-1 text-[13.5px] font-medium">{t.message}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
            >
              <X />
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
