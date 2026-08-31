import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";

import { ConversationsWorkspace } from "@/components/conversations/conversations-workspace";
import { EmptyState } from "@/components/common/empty-state";
import { fetchConversations, fetchLeads } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Conversations" };

interface PageProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function ConversationsPage({ searchParams }: PageProps) {
  const [{ c }, conversations, leads] = await Promise.all([searchParams, fetchConversations(), fetchLeads()]);

  return (
    <div className="h-[calc(100svh-108px)] lg:h-[calc(100svh-52px)]">
      {conversations.length === 0 ? (
        <div className="p-4 lg:p-6">
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Threads appear here as soon as outreach goes out and a prospect replies. Every message is logged against its opportunity."
          />
        </div>
      ) : (
        <ConversationsWorkspace conversations={conversations} leads={leads} initialConversationId={c} />
      )}
    </div>
  );
}
