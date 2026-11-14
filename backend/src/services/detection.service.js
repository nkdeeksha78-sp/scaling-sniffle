/**
 * Detection Service: Detects sensitive PII, Financial Cards, Credentials, Tokens, and Keywords.
 * Performs all checks strictly in memory.
 */

// Luhn Algorithm check for credit card numbers to minimize false positives
export const isValidLuhn = (numStr) => {
  const clean = numStr.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const PATTERNS = {
  EMAIL: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    type: 'EMAIL',
    category: 'PII',
    placeholder: '[REDACTED_EMAIL]',
    policyKey: 'scanEmails',
  },
  PHONE: {
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    type: 'PHONE',
    category: 'PII',
    placeholder: '[REDACTED_PHONE]',
    policyKey: 'scanPhones',
    validate: (match) => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    },
  },
  CREDIT_CARD: {
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{13,19}\b/g,
    type: 'CREDIT_CARD',
    category: 'FINANCIAL',
    placeholder: '[REDACTED_CREDIT_CARD]',
    policyKey: 'scanCreditCards',
    validate: (match) => isValidLuhn(match),
  },
  OPENAI_KEY: {
    regex: /\b(?:sk-[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9_-]{20,})\b/g,
    type: 'API_KEY',
    category: 'SECRETS',
    placeholder: '[REDACTED_API_KEY]',
    policyKey: 'scanApiKeys',
  },
  AWS_KEY: {
    regex: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    type: 'API_KEY',
    category: 'SECRETS',
    placeholder: '[REDACTED_API_KEY]',
    policyKey: 'scanApiKeys',
  },
  GOOGLE_API_KEY: {
    regex: /\bAIza[0-9A-Za-z\\-_]{35}\b/g,
    type: 'API_KEY',
    category: 'SECRETS',
    placeholder: '[REDACTED_API_KEY]',
    policyKey: 'scanApiKeys',
  },
  GITHUB_TOKEN: {
    regex: /\b(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,}|gho_[a-zA-Z0-9]{36})\b/g,
    type: 'API_KEY',
    category: 'SECRETS',
    placeholder: '[REDACTED_API_KEY]',
    policyKey: 'scanApiKeys',
  },
  SLACK_TOKEN: {
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/g,
    type: 'API_KEY',
    category: 'SECRETS',
    placeholder: '[REDACTED_API_KEY]',
    policyKey: 'scanApiKeys',
  },
  PASSWORD_PAIR: {
    regex: /(?:password|passwd|pwd|secret_key|client_secret)\s*[:=]\s*["']?([^\s"';,]{6,})["']?/gi,
    type: 'PASSWORD',
    category: 'CREDENTIALS',
    placeholder: '[REDACTED_PASSWORD]',
    policyKey: 'scanPasswords',
    extractGroup: 1,
  },
  DB_URI: {
    regex: /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s:@]+:[^\s@]+@[^\s/]+\b/gi,
    type: 'PASSWORD',
    category: 'CREDENTIALS',
    placeholder: '[REDACTED_PASSWORD]',
    policyKey: 'scanPasswords',
  },
  JWT: {
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_.+/=-]{10,}\b/g,
    type: 'JWT',
    category: 'CREDENTIALS',
    placeholder: '[REDACTED_JWT]',
    policyKey: 'scanJwts',
  },
};

const DEFAULT_KEYWORDS = [
  'confidential',
  'proprietary',
  'trade secret',
  'internal use only',
  'strictly confidential',
  'restricted',
  'private key',
  'master password',
];

export const detectSensitiveData = (text, policy = {}) => {
  if (!text || typeof text !== 'string') {
    return {
      entities: [],
      breakdown: { emails: 0, phones: 0, creditCards: 0, apiKeys: 0, passwords: 0, jwts: 0, keywords: 0 },
      categories: [],
      totalCount: 0,
    };
  }

  const detected = [];
  const breakdown = {
    emails: 0,
    phones: 0,
    creditCards: 0,
    apiKeys: 0,
    passwords: 0,
    jwts: 0,
    keywords: 0,
  };

  for (const [key, rule] of Object.entries(PATTERNS)) {
    if (policy[rule.policyKey] === false) continue;

    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = rule.extractGroup ? match[rule.extractGroup] : match[0];
      const startIndex = rule.extractGroup ? match.index + match[0].indexOf(matchText) : match.index;
      const endIndex = startIndex + matchText.length;

      if (rule.validate && !rule.validate(matchText)) {
        continue;
      }

      detected.push({
        type: rule.type,
        category: rule.category,
        placeholder: rule.placeholder,
        start: startIndex,
        end: endIndex,
        length: matchText.length,
        matchedValue: matchText,
      });

      if (rule.type === 'EMAIL') breakdown.emails++;
      if (rule.type === 'PHONE') breakdown.phones++;
      if (rule.type === 'CREDIT_CARD') breakdown.creditCards++;
      if (rule.type === 'API_KEY') breakdown.apiKeys++;
      if (rule.type === 'PASSWORD') breakdown.passwords++;
      if (rule.type === 'JWT') breakdown.jwts++;
    }
  }

  if (policy.scanKeywords !== false) {
    const keywordList = Array.from(new Set([...DEFAULT_KEYWORDS, ...(policy.customKeywords || [])]));
    for (const kw of keywordList) {
      if (!kw || kw.trim().length < 3) continue;
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const kwRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
      let kwMatch;

      while ((kwMatch = kwRegex.exec(text)) !== null) {
        detected.push({
          type: 'CONFIDENTIAL_KEYWORD',
          category: 'GOVERNANCE',
          placeholder: '[REDACTED_CONFIDENTIAL]',
          start: kwMatch.index,
          end: kwMatch.index + kwMatch[0].length,
          length: kwMatch[0].length,
          matchedValue: kwMatch[0],
        });
        breakdown.keywords++;
      }
    }
  }

  detected.sort((a, b) => a.start - b.start || b.length - a.length);

  const nonOverlapping = [];
  let lastEnd = -1;

  for (const entity of detected) {
    if (entity.start >= lastEnd) {
      nonOverlapping.push(entity);
      lastEnd = entity.end;
    }
  }

  const categories = Array.from(new Set(nonOverlapping.map((e) => e.category)));

  return {
    entities: nonOverlapping,
    breakdown,
    categories,
    totalCount: nonOverlapping.length,
  };
};

export default { detectSensitiveData, isValidLuhn };
