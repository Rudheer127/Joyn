import { createClient } from "@/lib/supabase/server";

// Type definitions for Jo tables
type JoConversation = {
  id: string;
  user_id: string;
  status: string;
  current_page?: string;
  started_at?: string;
  updated_at?: string;
  last_message_at?: string;
  workflow_step?: string;
  workflow_context?: any;
  created_at?: string;
};

type JoMessage = {
  id: string;
  conversation_id: string;
  sender: string;
  message_text: string;
  message_type?: string;
  metadata?: any;
  created_at?: string;
};

type JoConversationState = {
  conversation_id: string;
  state_phase?: string;
  last_intent?: string | null;
  last_topic?: string | null;
  workflow_step?: string;
  suggested_options?: any[];
  context?: any;
  updated_at?: string;
};

/**
 * Get or create the active conversation for a user
 */
export async function getOrCreateConversation(
  userId: string,
  pageContext?: string
): Promise<JoConversation> {
  const supabase = await createClient();

  // Try to get active conversation
  const { data: existing, error: fetchError } = await supabase
    .from("jo_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (existing && !fetchError) {
    // Update current page if provided
    if (pageContext) {
      await supabase
        .from("jo_conversations")
        .update({ current_page: pageContext, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return existing;
  }

  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from("jo_conversations")
    .insert({
      user_id: userId,
      current_page: pageContext || "/dashboard",
      status: "active",
    })
    .select()
    .single();

  if (createError) throw createError;

  // Initialize conversation state
  await supabase.from("jo_conversation_state").insert({
    conversation_id: newConversation.id,
    state_phase: "greeting",
    suggested_options: [],
    context: {},
  });

  return newConversation;
}

/**
 * Add a message to conversation
 */
export async function addMessage(
  conversationId: string,
  sender: "user" | "assistant",
  messageText: string,
  metadata?: Record<string, any>
): Promise<JoMessage> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jo_messages")
    .insert({
      conversation_id: conversationId,
      sender,
      message_text: messageText,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  // Update conversation last_message_at
  await supabase
    .from("jo_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

/**
 * Get all messages in a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<JoMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jo_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get conversation state
 */
export async function getConversationState(
  conversationId: string
): Promise<JoConversationState | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jo_conversation_state")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Update conversation state
 */
export async function updateConversationState(
  conversationId: string,
  updates: Partial<JoConversationState>
): Promise<JoConversationState> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jo_conversation_state")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Clear conversation (delete messages, reset state)
 */
export async function clearConversation(conversationId: string): Promise<void> {
  const supabase = await createClient();

  // Delete all messages
  await supabase.from("jo_messages").delete().eq("conversation_id", conversationId);

  // Reset state to greeting
  await updateConversationState(conversationId, {
    state_phase: "greeting",
    last_intent: null,
    last_topic: null,
    suggested_options: [],
  });
}

/**
 * Archive conversation and start new one
 */
export async function startNewConversation(
  userId: string,
  pageContext?: string
): Promise<JoConversation> {
  const supabase = await createClient();

  // Archive current conversation
  await supabase
    .from("jo_conversations")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("status", "active");

  // Create new one
  return getOrCreateConversation(userId, pageContext);
}

/**
 * Get contextual suggested options
 */
export async function getContextualOptions(
  contextTags: string[]
): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jo_suggested_options")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: true })
    .limit(6);

  if (error) throw error;

  // Filter by context match
  if (contextTags.length > 0) {
    return (data || []).filter((option: any) => {
      const matches = option.context_match || [];
      return matches.some((tag: string) => contextTags.includes(tag));
    });
  }

  return data || [];
}

/**
 * Store long-term memory for user
 */
export async function storeMemory(
  userId: string,
  memoryType: "profile" | "preference" | "topic" | "workflow" | "clarification",
  memoryKey: string,
  memoryValue: any,
  expiresAt?: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("jo_memory").upsert(
    {
      user_id: userId,
      memory_type: memoryType,
      memory_key: memoryKey,
      memory_value: memoryValue,
      expires_at: expiresAt || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,memory_type,memory_key",
    }
  );
}

/**
 * Retrieve memory for user
 */
export async function getMemory(
  userId: string,
  memoryType: string,
  memoryKey: string
): Promise<any | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jo_memory")
    .select("memory_value")
    .eq("user_id", userId)
    .eq("memory_type", memoryType)
    .eq("memory_key", memoryKey)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data?.memory_value || null;
}
