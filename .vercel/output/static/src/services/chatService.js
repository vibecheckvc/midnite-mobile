import { supabase } from "../lib/supabase";

/**
 * Chat service for Supabase
 * Handles chat creation, messaging, and realtime updates.
 * Compatible with your schema referencing auth.users.
 */
export const chatService = {
  // ------------------ FETCH CHATS ------------------
  async getChatsForUser(userId) {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select(
          `
          id,
          name,
          is_group,
          last_message,
          last_message_at,
          chat_members!inner(user_id)
        `
        )
        .eq("chat_members.user_id", userId)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      return {
        data:
          data?.map((c) => ({
            id: c.id,
            name: c.name,
            is_group: c.is_group,
            last_message: c.last_message,
            last_message_at: c.last_message_at,
          })) ?? [],
        error: null,
      };
    } catch (error) {
      console.error("[chatService.getChatsForUser]", error);
      return { data: [], error };
    }
  },

  // ------------------ FETCH MESSAGES ------------------
  async getMessages(chatId, { limit = 50 } = {}) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, chat_id, sender_id, content, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (error) {
      console.error("[chatService.getMessages]", error);
      return { data: [], error };
    }
  },

  // ------------------ SEND MESSAGE ------------------
  async sendMessage({ chatId, senderId, content }) {
    try {
      if (!content?.trim()) {
        return { data: null, error: new Error("Empty message") };
      }

      // Insert message
      const { data: msg, error: msgErr } = await supabase
        .from("messages")
        .insert([
          {
            chat_id: chatId,
            sender_id: senderId,
            content: content.trim(),
          },
        ])
        .select()
        .single();

      if (msgErr) throw msgErr;

      // Update chat metadata (not fatal if it fails)
      const { error: updErr } = await supabase
        .from("chats")
        .update({
          last_message: content.trim().slice(0, 300),
          last_message_at: new Date().toISOString(),
        })
        .eq("id", chatId);

      if (updErr)
        console.warn("[chatService.sendMessage] Metadata update failed", updErr);

      return { data: msg, error: null };
    } catch (error) {
      console.error("[chatService.sendMessage]", error);
      return { data: null, error };
    }
  },

  // ------------------ CREATE OR REUSE DIRECT CHAT ------------------
  async createDirectChat({ currentUserId, otherUserId }) {
    try {
      // 1️⃣ Find chats current user is in
      const { data: myMemberships, error: memErr } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", currentUserId);

      if (memErr) throw memErr;
      const myChatIds = (myMemberships ?? []).map((m) => m.chat_id);
      let existingChatId = null;

      // 2️⃣ Check if the other user shares any of those chats
      if (myChatIds.length) {
        const { data: shared, error: sharedErr } = await supabase
          .from("chat_members")
          .select("chat_id")
          .eq("user_id", otherUserId)
          .in("chat_id", myChatIds)
          .limit(1);

        if (sharedErr) throw sharedErr;
        existingChatId = shared?.[0]?.chat_id || null;
      }

      // 3️⃣ If found, reuse existing chat
      if (existingChatId) {
        return { data: { id: existingChatId }, error: null };
      }

      // 4️⃣ Otherwise, create new chat
      const { data: chat, error: chatErr } = await supabase
        .from("chats")
        .insert([{ is_group: false }])
        .select("id")
        .single();

      if (chatErr) throw chatErr;

      // 5️⃣ Insert the current user membership first (RLS-allowed)
      const { error: meErr } = await supabase
        .from("chat_members")
        .insert([{ chat_id: chat.id, user_id: currentUserId }]);
      if (meErr) throw meErr;

      // 6️⃣ Insert the other member next (now allowed)
      const { error: otherErr } = await supabase
        .from("chat_members")
        .insert([{ chat_id: chat.id, user_id: otherUserId }]);
      if (otherErr) throw otherErr;

      return { data: { id: chat.id }, error: null };
    } catch (error) {
      console.error("[chatService.createDirectChat]", error);
      return { data: null, error };
    }
  },

  // ------------------ REALTIME MESSAGES ------------------
  subscribeToMessages(chatId, onMessage) {
    if (!chatId) {
      console.warn("[chatService.subscribeToMessages] Missing chatId");
      return () => {};
    }

    const channel = supabase
      .channel(`messages_chat_${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (payload?.new) {
            onMessage(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[chatService] Realtime subscribed:", chatId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log("[chatService] Unsubscribed from chat:", chatId);
    };
  },
};
