import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-[shimmer_1.8s_ease-in-out_infinite] rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
