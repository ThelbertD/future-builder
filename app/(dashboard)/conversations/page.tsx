import type { Metadata } from "next";

import { ConversationsWorkspace } from "@/components/conversations/conversations-workspace";
import { CONVERSATIONS, LEADS_WITH_RELATIONS } from "@/lib/mock";

export const metadata: Metadata = { title: "Conversations" };

interface PageProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function ConversationsPage({ searchParams }: PageProps) {
  const { c } = await searchParams;

  return (
    <div className="h-[calc(100svh-108px)] lg:h-[calc(100svh-52px)]">
      <ConversationsWorkspace
        conversations={CONVERSATIONS}
        leads={LEADS_WITH_RELATIONS}
        initialConversationId={c}
      />
    </div>
  );
}
