-- Jo Strict State Machine and Intent Classification
-- Implements 8-state model, intent classes, and unified orchestration

-- Alter jo_conversation_state to support 8-state model and intent classification
ALTER TABLE jo_conversation_state DROP CONSTRAINT IF EXISTS jo_conversation_state_state_phase_check;

ALTER TABLE jo_conversation_state
  ADD COLUMN IF NOT EXISTS intent_class TEXT,
  ADD COLUMN IF NOT EXISTS intent_confidence DECIMAL(3,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS last_action_hidden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS state_transition_valid BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS action_gated_count INTEGER DEFAULT 0;

-- Add constraint for 8-state model
ALTER TABLE jo_conversation_state
  ADD CONSTRAINT jo_conversation_state_state_phase_check
  CHECK (state_phase IN (
    'greeting',           -- Initial state, awaiting first user intent
    'awaiting_choice',    -- Waiting for user to select from options
    'answering_question', -- Processing a specific user question
    'navigating',         -- Handling navigation request
    'clarifying',         -- Seeking clarification on user intent
    'continuing_task',    -- Continuing a multi-turn task
    'idle',               -- No active conversation
    'reset'               -- Conversation reset state
  ));

-- Add constraint for intent classification (8 classes)
ALTER TABLE jo_conversation_state
  ADD CONSTRAINT jo_conversation_state_intent_class_check
  CHECK (intent_class IS NULL OR intent_class IN (
    'navigate_page',      -- User wants to go to a page
    'browse_content',     -- User wants to browse (matches, events, messages)
    'ask_question',       -- User asking for information/help
    'provide_info',       -- User sharing profile info
    'emotional_support',  -- User seeking emotional support
    'clarification',      -- User or Jo seeking clarification
    'action_required',    -- User needs Jo to perform an action
    'greeting'            -- Initial greeting or follow-up greeting
  ));

-- Create intent classification lookup table for reference
CREATE TABLE IF NOT EXISTS jo_intent_classes (
  class_id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 8),
  state_transition TEXT NOT NULL,
  requires_confirmation BOOLEAN DEFAULT false
);

INSERT INTO jo_intent_classes (class_id, class_name, description, priority, state_transition, requires_confirmation)
VALUES
  ('navigate_page', 'Navigate Page', 'User wants to navigate to a page', 1, 'navigating', false),
  ('browse_content', 'Browse Content', 'User wants to browse content', 2, 'answering_question', false),
  ('ask_question', 'Ask Question', 'User asking for information', 3, 'answering_question', false),
  ('provide_info', 'Provide Information', 'User sharing personal information', 4, 'continuing_task', false),
  ('emotional_support', 'Emotional Support', 'User seeking emotional support', 5, 'answering_question', false),
  ('clarification', 'Clarification', 'Clarification needed', 6, 'clarifying', true),
  ('action_required', 'Action Required', 'User needs Jo to perform an action', 7, 'awaiting_choice', true),
  ('greeting', 'Greeting', 'Initial or follow-up greeting', 8, 'awaiting_choice', false)
ON CONFLICT (class_id) DO NOTHING;

-- Add index for intent class queries
CREATE INDEX IF NOT EXISTS idx_jo_conversation_state_intent_class
  ON jo_conversation_state(intent_class);

CREATE INDEX IF NOT EXISTS idx_jo_conversation_state_intent_confidence
  ON jo_conversation_state(intent_confidence DESC);

-- Create action history table to track gated actions for regression testing
CREATE TABLE IF NOT EXISTS jo_action_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES jo_conversations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  proposed_route TEXT,
  intent_confidence DECIMAL(3,2),
  was_gated BOOLEAN DEFAULT false,
  reason_gated TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jo_action_history_conversation_id
  ON jo_action_history(conversation_id);

-- RLS for action history
ALTER TABLE jo_action_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own action history" ON jo_action_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM jo_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- Seed default intent classes if not already present
CREATE TABLE IF NOT EXISTS jo_intent_classes;
