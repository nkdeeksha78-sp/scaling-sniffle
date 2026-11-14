import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      default: 'anonymous@trustguard.internal',
      index: true,
    },
    traceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    promptHash: {
      type: String,
      required: true,
      index: true,
      description: 'SHA-256 digest of prompt for audit non-repudiation',
    },
    promptLength: {
      type: Number,
      required: true,
    },
    maskedPrompt: {
      type: String,
      required: true,
      description: 'Sanitized prompt text containing [REDACTED_...] placeholders. Zero raw sensitive data.',
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      index: true,
    },
    detectedCategories: {
      type: [String],
      default: [],
    },
    detectedEntitiesCount: {
      type: Number,
      default: 0,
    },
    entityBreakdown: {
      emails: { type: Number, default: 0 },
      phones: { type: Number, default: 0 },
      creditCards: { type: Number, default: 0 },
      apiKeys: { type: Number, default: 0 },
      passwords: { type: Number, default: 0 },
      jwts: { type: Number, default: 0 },
      keywords: { type: Number, default: 0 },
    },
    injectionDetected: {
      type: Boolean,
      default: false,
      index: true,
    },
    decision: {
      type: String,
      enum: ['ALLOWED', 'BLOCKED', 'REVIEW'],
      required: true,
      index: true,
    },
    policyTriggered: {
      type: String,
      default: null,
    },
    aiAnalysisStatus: {
      type: String,
      enum: ['SUCCESS', 'SKIPPED_BLOCKED', 'FAILED', 'FALLBACK'],
      default: 'SUCCESS',
    },
    aiResponseSummary: {
      riskLevel: { type: String, default: null },
      threatType: { type: [String], default: [] },
      explanation: { type: String, default: null },
      safeRewrittenPrompt: { type: String, default: null },
      recommendedAction: { type: String, default: null },
      latencyMs: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1, decision: 1 });
auditLogSchema.index({ riskScore: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
