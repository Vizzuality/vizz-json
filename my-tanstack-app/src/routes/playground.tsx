import { createFileRoute } from "@tanstack/react-router";
import { PlaygroundLayout } from "#/components/playground/playground-layout";

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
});

function PlaygroundPage() {
  return (
    <PlaygroundLayout
      topBar={<div className="h-12 border-b bg-background px-4 flex items-center text-sm text-muted-foreground">Playground — loading...</div>}
      editor={<div className="h-full bg-[#1e1e1e] p-4 text-muted-foreground">Editor placeholder</div>}
      map={<div className="h-full bg-slate-900 flex items-center justify-center text-muted-foreground">Map placeholder</div>}
      params={<div className="h-full bg-background p-4 text-muted-foreground">Params placeholder</div>}
    />
  );
}
