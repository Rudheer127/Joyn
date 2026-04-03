-- Jo Conversations Schema
-- Tables for unified conversation state across widget + main chat

CREATE TABLE IF NOT EXISTS jo_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'paused')),
  current_page TEXT DEFAULT '/dashboard',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  workflow_step TEXT,
  workflow_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jo_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES jo_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'action', 'suggestion')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jo_conversation_state (
  conversation_id UUID NOT NULL REFERENCES jo_conversations(id) ON DELETE CASCADE PRIMARY KEY,
  state_phase TEXT NOT NULL DEFAULT 'greeting' CHECK (state_phase IN ('greeting', 'clarifying', 'active', 'awaiting_action')),
  last_intent TEXT,
  last_topic TEXT,
  workflow_step TEXT,
  suggested_options JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jo_suggested_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('question', 'navigation', 'workflow', 'clarification', 'general')),
  action_payload JSONB NOT NULL,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 6),
  context_match TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jo_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('profile', 'preference', 'topic', 'workflow', 'clarification')),
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security

ALTER TABLE jo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE jo_conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE jo_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON jo_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON jo_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON jo_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversation messages" ON jo_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM jo_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert messages" ON jo_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM jo_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view own conversation state" ON jo_conversation_state
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM jo_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update own conversation state" ON jo_conversation_state
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM jo_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view own memory" ON jo_memory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own memory" ON jo_memory
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE jo_suggested_options DISABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_jo_conversations_user_id ON jo_conversations(user_id);
CREATE INDEX idx_jo_conversations_updated_at ON jo_conversations(updated_at DESC);
CREATE INDEX idx_jo_messages_conversation_id ON jo_messages(conversation_id);
CREATE INDEX idx_jo_messages_created_at ON jo_messages(created_at DESC);
CREATE INDEX idx_jo_conversation_state_conversation_id ON jo_conversation_state(conversation_id);
CREATE INDEX idx_jo_memory_user_id ON jo_memory(user_id);
CREATE INDEX idx_jo_suggested_options_active ON jo_suggested_options(active);

-- Seed default suggested options
INSERT INTO jo_suggested_options (label, action_type, action_payload, priority, context_match, active)
VALUES
  ('What can Jo do?', 'question', '{"question": "What can you help with?"}', 1, ARRAY['greeting'], true),
  ('Help me navigate', 'clarification', '{"intent": "navigate"}', 2, ARRAY['greeting', 'clarifying'], true),
  ('Show popular actions', 'navigation', '{"route": "/dashboard"}', 3, ARRAY['greeting', 'active'], true),
  ('Ask a question', 'workflow', '{"step": "ask_question"}', 4, ARRAY['greeting', 'active'], true),
  ('Get started', 'workflow', '{"step": "onboarding"}', 5, ARRAY['greeting'], true),
  ('Start a new task', 'workflow', '{"step": "task_selection"}', 6, ARRAY['greeting', 'active'], true)
ON CONFLICT DO NOTHING;
