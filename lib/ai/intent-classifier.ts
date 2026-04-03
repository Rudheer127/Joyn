/**
 * Intent classifier for Jo conversations
 * Classifies user messages into one of 8 intent classes with confidence scoring
 *
 * Classification process:
 * 1. Extract keywords and patterns from message
 * 2. Score against each intent class
 * 3. Return top-scoring intent with confidence
 * 4. Confidence < 0.6 means intent is too low to gate actions
 */

import type { IntentClass } from "@/lib/supabase/jo-types";

interface IntentClassification {
  intent: IntentClass;
  confidence: number; // 0.0 - 1.0
  triggers: string[]; // Which patterns triggered this classification
}

// Pattern definitions for each intent class
const INTENT_PATTERNS: Record<IntentClass, {
  keywords: RegExp[];
  phrases: RegExp[];
  priority: number;
}> = {
  'navigate_page': {
    keywords: [/\b(go|take|open|show|find|navigate|view|visit|bring|load)\b/i],
    phrases: [
      /\b(go to|take me to|show me|find me|navigate to|open|visit)\b.*\b(dashboard|matches|companions|messages|events|profile|sessions|catch.?ups)\b/i,
      /\b(home|back|dashboard|matches|companions|messages|events|profile|sessions)\b\s+(page|screen)/i,
    ],
    priority: 1
  },
  'browse_content': {
    keywords: [/\b(show|browse|list|see|view|display|look|check)\b/i],
    phrases: [
      /\b(show me|browse|look for|check)\b.*\b(matches|companions|events|messages|profiles)\b/i,
      /\b(what|any|more)\b.*(matches|companions|events|messages|activities)\b/i,
    ],
    priority: 2
  },
  'ask_question': {
    keywords: [/\b(what|how|why|when|where|which|who|can|could|would|help|explain|tell)\b/i],
    phrases: [
      /^(\?|what|how|why|when|where|which|who|can|could|would|help|explain)/i,
      /\b(help|explain|tell me|how do|what is|what are|how does)\b/i,
    ],
    priority: 3
  },
  'provide_info': {
    keywords: [/\b(my|i|i'm|i am|i'm|we|our|mine|me|myself)\b.*\b(interest|hobby|goal|age|name|live|from|do|work)\b/i],
    phrases: [
      /\b(my name is|i live in|i'm from|i'm interested in|my interests are|my goal is|i enjoy|my goals are)\b/i,
      /\b(i like|i love|i prefer|i want|i need|i have|i'm looking for)\b/i,
    ],
    priority: 4
  },
  'emotional_support': {
    keywords: [/\b(lonely|sad|depressed|anxious|worried|stressed|unhappy|down|struggling|hard|difficult|pain|hurt|feel|down|blue)\b/i],
    phrases: [
      /\b(i feel|i'm feeling|i've been|feeling)\b.*(lonely|sad|depressed|anxious|worried|stressed|unhappy|down|blue|upset|bad)/i,
      /\b(i'm|i am)\b.*(hard time|difficult|struggling|not doing well|having trouble|sad|lonely|down|upset|blue|bad)/i,
      /\b(it's hard|life's hard|having a hard time|difficult|struggling|not doing well|having trouble|can't cope|couldn't cope)\b/i,
      /^(i feel|i'm feeling|i've been|feeling).*(lonely|sad|bad|down|blue|upset|depressed|anxious|worried|stressed)/i,
    ],
    priority: 5
  },
  'clarification': {
    keywords: [/\b(clarify|explain|what do you mean|i don't understand|unclear|confused|again|repeat)\b/i],
    phrases: [
      /\b(what do you mean|i don't understand|that's unclear|can you clarify|can you explain|say that again)\b/i,
      /\b(sorry|pardon|huh|what|eh)\b.*\?/i,
    ],
    priority: 6
  },
  'action_required': {
    keywords: [/\b(do|make|send|create|schedule|book|add|update|change|delete|remove)\b/i],
    phrases: [
      /\b(can you|could you|can i|will you|would you)\b.*\b(do|make|send|create|schedule|book|add|update|change|set|match|message)\b/i,
      /\b(i need you to|please)\b.*(do|make|send|create|schedule|book|add|update|change|match)\b/i,
    ],
    priority: 7
  },
  'greeting': {
    keywords: [/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|thanks|thank you|thanks so much)\b/i],
    phrases: [
      /^(hi|hello|hey|greetings|good|thanks|thank you|yo|sup|what'?s up)\b/i,
      /\b(nice to meet|pleasure|good to see|thanks for|thanks so much)\b/i,
    ],
    priority: 8
  }
};

/**
 * Classify a user message into one of 8 intent classes
 */
export function classifyIntent(messageText: string): IntentClassification {
  if (!messageText || messageText.trim().length === 0) {
    return {
      intent: 'greeting',
      confidence: 0.1,
      triggers: ['empty_message']
    };
  }

  const normalizedText = messageText.trim();
  const scores: Record<IntentClass, { confidence: number; triggers: string[] }> = {} as any;

  // Score each intent class
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    const triggers: string[] = [];

    // Check keyword matches
    for (const keywordRegex of patterns.keywords) {
      if (keywordRegex.test(normalizedText)) {
        score += 0.2; // Each keyword match: +0.2
        triggers.push(`keyword: ${keywordRegex.source}`);
      }
    }

    // Check phrase matches
    for (const phraseRegex of patterns.phrases) {
      if (phraseRegex.test(normalizedText)) {
        score += 0.4; // Each phrase match: +0.4
        triggers.push(`phrase: ${phraseRegex.source}`);
      }
    }

    // Normalize score to 0-1 range
    score = Math.min(1.0, score);

    scores[intent as IntentClass] = { confidence: score, triggers };
  }

  // Find the highest-scoring intent
  let bestIntent: IntentClass = 'greeting';
  let bestScore = 0;

  for (const [intent, { confidence }] of Object.entries(scores)) {
    if (confidence > bestScore) {
      bestScore = confidence;
      bestIntent = intent as IntentClass;
    }
  }

  // If confidence is very low, default to greeting
  if (bestScore < 0.3) {
    return {
      intent: 'greeting',
      confidence: 0.2,
      triggers: ['low_confidence_fallback']
    };
  }

  return {
    intent: bestIntent,
    confidence: bestScore,
    triggers: scores[bestIntent]?.triggers || []
  };
}

/**
 * Extract navigation intent from user message
 * Returns route if navigation is intended
 */
export function extractNavigationIntent(messageText: string): string | null {
  const navigationPatterns: Record<string, RegExp> = {
    '/match': /\b(match|companion|companions|companion page|find companion)\b/i,
    '/messages': /\bmessages?\b|\binbox\b|\bconversation\b|\bchat\b/i,
    '/events': /\b(events?|activity|activities|meetup|gathering)\b/i,
    '/profile': /\b(profile|account|my profile)\b/i,
    '/sessions': /\b(catch.?up|sessions?|schedule|meeting)\b/i,
    '/dashboard': /\b(dashboard|home|home page)\b/i,
  };

  // Check if this looks like a navigation request at all
  const navIntent = /\b(go|take|open|show|find|navigate|view|visit|bring|load)\b/i;
  if (!navIntent.test(messageText)) {
    return null;
  }

  // Find which route is mentioned
  for (const [route, pattern] of Object.entries(navigationPatterns)) {
    if (pattern.test(messageText)) {
      return route;
    }
  }

  return null;
}

/**
 * Extract topic or category from user message
 */
export function extractTopic(messageText: string): string | null {
  const topics: Record<string, RegExp> = {
    'match': /\b(matches?|companions?)\b/i,
    'event': /\b(events?|activities?|meetup|gathering|thing to do)\b/i,
    'message': /\bmessages?\b|\binbox\b|\bconversation\b|\bchat\b|\bcontact\b|\breach out\b/i,
    'profile': /\b(profile|account|interests?|goals?|information|about|me)\b/i,
    'emotional': /\b(lonely|sad|depressed|anxious|worried|stressed|help|support|feeling)\b/i,
  };

  for (const [topic, pattern] of Object.entries(topics)) {
    if (pattern.test(messageText)) {
      return topic;
    }
  }

  return null;
}

/**
 * Determines if an intent should be gated (suppressed from triggering actions)
 * Based on confidence threshold (0.6) and intent class
 */
export function shouldGateIntent(
  intent: IntentClass,
  confidence: number
): boolean {
  // If confidence is below threshold, gate it
  if (confidence < 0.6) {
    return true;
  }

  // Some intents always require confirmation
  const requiresConfirmation = ['action_required', 'clarification'];
  return requiresConfirmation.includes(intent) && confidence < 0.7;
}
