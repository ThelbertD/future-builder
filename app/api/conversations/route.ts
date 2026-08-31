import { NextResponse } from "next/server";

import { fetchConversations } from "@/lib/supabase/queries";

export async function GET() {
  const conversations = await fetchConversations();

  return NextResponse.json({
    data: conversations.map((conversation) => ({
      id: conversation.id,
      subject: conversation.subject,
      channel: conversation.channel,
      mode: conversation.mode,
      unreadCount: conversation.unreadCount,
      needsAttention: conversation.needsAttention,
      lastMessageAt: conversation.lastMessageAt,
      messageCount: conversation.messages.length,
    })),
    total: conversations.length,
  });
}
