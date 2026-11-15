import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full resize-y rounded-lg border border-input bg-code-bg px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-foreground",
          "transition-colors duration-150 placeholder:text-muted-foreground/70",
          "focus:border-ring/60 focus:outline-none focus:ring-[3px] focus:ring-ring/15 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-55",
          className
        )}
        spellCheck={false}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
