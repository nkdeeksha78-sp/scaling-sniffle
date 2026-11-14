/**
 * Prompt Injection Detection Service:
 * Detects basic suspicious patterns and adversarial jailbreak attempts.
 * Treated strictly as detection signals, never executed.
 */

const SUSPICIOUS_PATTERNS = [
  {
    name: 'IGNORE_PREVIOUS_INSTRUCTIONS',
    regex: /(?:ignore|disregard|forget|skip)\s+(?:all\s+)?(?:previous|prior|above|former|initial)\s+(?:instructions|rules|prompts|guidelines|directives)/i,
    description: 'Explicit attempt to discard system rules and prior context.',
  },
  {
    name: 'DISREGARD_SYSTEM_INSTRUCTIONS',
    regex: /(?:disregard|ignore|bypass)\s+(?:system\s+)?(?:instructions|directives|constraints|guardrails)/i,
    description: 'Direct target on system-level constraints.',
  },
  {
    name: 'REVEAL_SYSTEM_PROMPT',
    regex: /(?:reveal|show|print|output|display|repeat|echo)\s+(?:the|your)?\s*(?:system\s+prompt|initial\s+prompt|pre-prompt|internal\s+instructions|system\s+message)/i,
    description: 'System prompt exfiltration attempt.',
  },
  {
    name: 'OVERRIDE_DEVELOPER_INSTRUCTIONS',
    regex: /(?:override|supersede)\s+(?:developer|system|base|root)\s+(?:instructions|controls|mode)/i,
    description: 'Attempt to override root developer directives.',
  },
  {
    name: 'BYPASS_SAFETY_RESTRICTIONS',
    regex: /(?:bypass|disable|turn\s+off|remove)\s+(?:safety|content|ethical|filter)\s+(?:restrictions|filters|protocols|rules)/i,
    description: 'Attempt to disable safety filters.',
  },
  {
    name: 'ACT_AS_UNRESTRICTED_AI',
    regex: /(?:act\s+as|you\s+are\s+now|pretend\s+to\s+be)\s+(?:an?\s+)?(?:unrestricted|unfiltered|jailbroken|DAN|evil|chaosGPT|developer\s+mode)\s*(?:ai|bot|assistant)?/i,
    description: 'Persona-hijack or jailbreak framing attempt.',
  },
  {
    name: 'REVEAL_HIDDEN_CONFIGURATION',
    regex: /(?:reveal|expose|dump|leak)\s+(?:hidden|internal|underlying|backend)\s+(?:configuration|variables|keys|metadata|settings)/i,
    description: 'Attempt to extract internal configuration.',
  },
  {
    name: 'DELIMITER_HIJACK',
    regex: /(?:<\|im_start\|>|<\|im_end\|>|\[SYSTEM\]|\[INST\]|<<SYS>>|```system)/i,
    description: 'Adversarial delimiter manipulation.',
  },
];

export const detectPromptInjection = (text, policy = {}) => {
  if (!text || typeof text !== 'string' || policy.detectPromptInjection === false) {
    return {
      detected: false,
      patterns: [],
      confidence: 0,
    };
  }

  const matchedPatterns = [];

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.regex.test(text)) {
      matchedPatterns.push(pattern.name);
    }
  }

  const detected = matchedPatterns.length > 0;
  const confidence = detected ? Math.min(0.7 + matchedPatterns.length * 0.15, 0.98) : 0;

  return {
    detected,
    patterns: matchedPatterns,
    confidence,
  };
};

export default { detectPromptInjection };
