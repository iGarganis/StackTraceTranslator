import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CONFIG = {
  high: {
    variant: "success" as const,
    icon: ShieldCheck,
    label: "High confidence",
    description: "The trace clearly identifies the error location",
  },
  medium: {
    variant: "warning" as const,
    icon: ShieldAlert,
    label: "Medium confidence",
    description: "Root cause requires assumptions about unseen code",
  },
  low: {
    variant: "destructive" as const,
    icon: ShieldX,
    label: "Low confidence",
    description: "Trace is ambiguous, short, or from a niche framework",
  },
};

interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const { variant, icon: Icon, label, description } = CONFIG[confidence];

  return (
    <Badge variant={variant} title={description}>
      <Icon />
      {label}
    </Badge>
  );
}
