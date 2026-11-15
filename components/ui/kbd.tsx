import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 border-border bg-muted px-[5px] font-mono text-[10.5px] text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
