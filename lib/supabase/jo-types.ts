/**
 * Strict type definitions for Jo conversation state
 * Enforces invariants and state machine contracts
 */

// 8-state model
export const JO_STATES = [
  'greeting',           // Initial state, awaiting first user intent
  'awaiting_choice',    // Waiting for user to select from options
  'answering_question', // Processing a specific user question
  'navigating',         // Handling navigation request
  'clarifying',         // Seeking clarification on user intent
  'continuing_task',    // Continuing a multi-turn task
  'idle',               // No active conversation
  'reset'               // Conversation reset state
] as const;

export type JoState = typeof JO_STATES[number];

// 8 intent classes with priority ordering
export const INTENT_CLASSES = [
  'navigate_page',      // 1: highest priority - explicit navigation request
  'browse_content',     // 2: browsing request (matches, events, messages)
  'ask_question',       // 3: information request
  'provide_info',       // 4: user sharing personal info
  'emotional_support',  // 5: seeking emotional support
  'clarification',      // 6: clarification request
  'action_required',    // 7: action needed from Jo
  'greeting'            // 8: greeting or acknowledgment
] as const;

export type IntentClass = typeof INTENT_CLASSES[number];

// State transition rules: which states can transition to which
const STATE_TRANSITIONS: Record<JoState, JoState[]> = {
  'greeting': ['awaiting_choice', 'answering_question', 'clarifying'],
  'awaiting_choice': ['answering_question', 'navigating', 'clarifying'],
  'answering_question': ['awaiting_choice', 'continuing_task', 'clarifying'],
  'navigating': ['idle', 'greeting'],
  'clarifying': ['awaiting_choice', 'answering_question'],
  'continuing_task': ['awaiting_choice', 'answering_question', 'clarifying'],
  'idle': ['greeting', 'reset'],
  'reset': ['greeting']
};

// Typed conversation state with strict requirements
export interface TypedConversationState {
  // Core state
  conversation_id: string;
  state_phase: JoState;

  // Intent classification
  intent_class: IntentClass | null;
  intent_confidence: number; // 0.0 - 1.0, must be >= 0.6 to gate actions

  // History tracking
  last_intent: string | null;
  last_topic: string | null;

  // Action gating
  last_action_hidden: boolean; // Was the last action hidden from user?
  action_gated_count: number;  // Number of actions suppressed by intent gating

  // State validation
  state_transition_valid: boolean; // Is the last transition valid per rules?

  // Metadata
  suggested_options: any[];
  context: Record<string, any>;
  updated_at: string;
}

/**
 * Validates state transition according to strict rules
 * @throws Error if transition is invalid
 */
export function validateStateTransition(
  currentState: JoState,
  nextState: JoState
): boolean {
  if (currentState === nextState) return true; // Self-transition is always valid

  const allowedTransitions = STATE_TRANSITIONS[currentState];
  return allowedTransitions.includes(nextState);
}

/**
 * Returns the priority order of intent classes
 * Lower index = higher priority
 */
export function getIntentPriority(intent: IntentClass): number {
  return INTENT_CLASSES.indexOf(intent);
}

/**
 * Checks if an intent has sufficient confidence for action gating
 * Actions require intent_confidence >= 0.6 to not be suppressed
 */
export function isIntentConfident(confidence: number): boolean {
  return confidence >= 0.6;
}

/**
 * Determines state transition based on intent class
 * Each intent class has a natural state transition
 */
export const INTENT_TO_STATE: Record<IntentClass, JoState> = {
  'navigate_page': 'navigating',
  'browse_content': 'answering_question',
  'ask_question': 'answering_question',
  'provide_info': 'continuing_task',
  'emotional_support': 'answering_question',
  'clarification': 'clarifying',
  'action_required': 'awaiting_choice',
  'greeting': 'awaiting_choice'
};

/**
 * Validates intent classification
 */
export function isValidIntentClass(intent: unknown): intent is IntentClass {
  return INTENT_CLASSES.includes(intent as IntentClass);
}

/**
 * Creates a default conversation state for a new conversation
 */
export function createDefaultConversationState(
  conversationId: string
): TypedConversationState {
  return {
    conversation_id: conversationId,
    state_phase: 'greeting',
    intent_class: null,
    intent_confidence: 0,
    last_intent: null,
    last_topic: null,
    last_action_hidden: false,
    action_gated_count: 0,
    state_transition_valid: true,
    suggested_options: [],
    context: {},
    updated_at: new Date().toISOString()
  };
}
