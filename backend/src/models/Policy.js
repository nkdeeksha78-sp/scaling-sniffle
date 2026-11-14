import mongoose from 'mongoose';

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Enterprise Security Baseline',
      trim: true,
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Core Rules
    blockHighRisk: {
      type: Boolean,
      default: true,
      description: 'Block prompts categorized as HIGH risk',
    },
    blockCriticalRisk: {
      type: Boolean,
      default: true,
      description: 'Block prompts categorized as CRITICAL risk',
    },
    detectPromptInjection: {
      type: Boolean,
      default: true,
      description: 'Detect and penalize adversarial jailbreak and prompt-injection patterns',
    },
    // Entity Scan Toggles
    scanEmails: {
      type: Boolean,
      default: true,
    },
    scanPhones: {
      type: Boolean,
      default: true,
    },
    scanCreditCards: {
      type: Boolean,
      default: true,
    },
    scanApiKeys: {
      type: Boolean,
      default: true,
    },
    scanPasswords: {
      type: Boolean,
      default: true,
    },
    scanJwts: {
      type: Boolean,
      default: true,
    },
    scanKeywords: {
      type: Boolean,
      default: true,
    },
    // Risk Threshold (0-100)
    riskThreshold: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
      description: 'Maximum permitted risk score before prompt is blocked or marked for review',
    },
    customKeywords: {
      type: [String],
      default: [
        'confidential',
        'proprietary',
        'trade secret',
        'internal use only',
        'strictly confidential',
        'restricted',
        'private key',
        'master password',
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Policy = mongoose.model('Policy', policySchema);
export default Policy;
