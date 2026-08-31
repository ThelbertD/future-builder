"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "dark"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-border bg-popover text-popover-foreground shadow-xl text-[13px] gap-2",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-md text-[12px]",
          cancelButton: "bg-muted text-muted-foreground rounded-md text-[12px]",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
