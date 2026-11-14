/**
 * Data Masking Engine:
 * Sanitizes detected sensitive values into standard [REDACTED_...] placeholders.
 * Strictly guarantees fail-closed behavior if sanitization cannot be verified.
 */

export const sanitizePrompt = (originalText, detectedEntities = []) => {
  if (!originalText || typeof originalText !== 'string') {
    return {
      sanitizedText: '',
      maskedCount: 0,
      verified: true,
    };
  }

  if (!detectedEntities || detectedEntities.length === 0) {
    return {
      sanitizedText: originalText,
      maskedCount: 0,
      verified: true,
    };
  }

  const sorted = [...detectedEntities].sort((a, b) => b.start - a.start);
  let sanitized = originalText;

  try {
    for (const entity of sorted) {
      if (
        typeof entity.start !== 'number' ||
        typeof entity.end !== 'number' ||
        entity.start < 0 ||
        entity.end > sanitized.length
      ) {
        throw new Error('Invalid detection boundaries during token replacement');
      }

      const before = sanitized.slice(0, entity.start);
      const after = sanitized.slice(entity.end);
      const placeholder = entity.placeholder || '[REDACTED_VALUE]';

      sanitized = before + placeholder + after;
    }

    // Safety verification check: ensures sensitive values are not present in sanitized text
    for (const entity of detectedEntities) {
      if (entity.matchedValue && entity.matchedValue.length > 4) {
        if (sanitized.includes(entity.matchedValue)) {
          throw new Error('Verification failure: unredacted token fragment identified');
        }
      }
    }

    return {
      sanitizedText: sanitized,
      maskedCount: detectedEntities.length,
      verified: true,
    };
  } catch (err) {
    return {
      sanitizedText: '[CRITICAL_SANITIZATION_FAILURE_PROMPT_SUPPRESSED]',
      maskedCount: detectedEntities.length,
      verified: false,
      error: err.message,
    };
  }
};

export default { sanitizePrompt };
