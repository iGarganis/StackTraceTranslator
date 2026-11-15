import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-3 px-6 pb-12 pt-7 text-xs text-muted-foreground">
      <Button variant="ghost" size="icon" className="h-8 w-8 [&_svg]:size-[15px]" asChild>
        <a href={SITE.repoUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <Github strokeWidth={1.85} />
        </a>
      </Button>
      <span className="font-mono">{SITE.version}</span>
    </footer>
  );
}
