import { ConversationsSkeleton } from "@/components/common/loading-skeleton";

export default function ConversationsLoading() {
  return (
    <div className="h-[calc(100svh-108px)] p-3 lg:h-[calc(100svh-52px)]">
      <ConversationsSkeleton />
    </div>
  );
}
