import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const totalScans = await AuditLog.countDocuments();

    const decisionAgg = await AuditLog.aggregate([
      {
        $group: {
          _id: '$decision',
          count: { $sum: 1 },
        },
      },
    ]);

    let allowedCount = 0;
    let blockedCount = 0;
    let reviewCount = 0;

    for (const item of decisionAgg) {
      if (item._id === 'ALLOWED') allowedCount = item.count;
      if (item._id === 'BLOCKED') blockedCount = item.count;
      if (item._id === 'REVIEW') reviewCount = item.count;
    }

    const statsAgg = await AuditLog.aggregate([
      {
        $group: {
          _id: null,
          avgRisk: { $avg: '$riskScore' },
          totalEntities: { $sum: '$detectedEntitiesCount' },
          totalInjections: { $sum: { $cond: ['$injectionDetected', 1, 0] } },
          totalEmails: { $sum: '$entityBreakdown.emails' },
          totalPhones: { $sum: '$entityBreakdown.phones' },
          totalCreditCards: { $sum: '$entityBreakdown.creditCards' },
          totalApiKeys: { $sum: '$entityBreakdown.apiKeys' },
          totalPasswords: { $sum: '$entityBreakdown.passwords' },
          totalJwts: { $sum: '$entityBreakdown.jwts' },
          totalKeywords: { $sum: '$entityBreakdown.keywords' },
        },
      },
    ]);

    const aggregateData = statsAgg[0] || {};
    const averageRiskScore = Math.round(aggregateData.avgRisk || 0);
    const protectionRate = totalScans > 0 ? Math.round(((blockedCount + reviewCount) / totalScans) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        totalScans,
        allowedCount,
        blockedCount,
        reviewCount,
        averageRiskScore,
        protectionRate,
        promptInjectionCount: aggregateData.totalInjections || 0,
        sensitiveDataTotal: aggregateData.totalEntities || 0,
        entityStats: {
          emails: aggregateData.totalEmails || 0,
          phones: aggregateData.totalPhones || 0,
          creditCards: aggregateData.totalCreditCards || 0,
          apiKeys: aggregateData.totalApiKeys || 0,
          passwords: aggregateData.totalPasswords || 0,
          jwts: aggregateData.totalJwts || 0,
          keywords: aggregateData.totalKeywords || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/charts', optionalAuth, async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 7, 1), 30);
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const dailyAgg = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            decision: '$decision',
          },
          count: { $sum: 1 },
          avgRisk: { $avg: '$riskScore' },
        },
      },
    ]);

    const dateMap = {};
    for (let i = daysNum - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const str = d.toISOString().split('T')[0];
      dateMap[str] = {
        date: str.slice(5),
        allowed: 0,
        blocked: 0,
        review: 0,
        total: 0,
        avgRisk: 0,
      };
    }

    for (const item of dailyAgg) {
      const d = item._id.date;
      if (dateMap[d]) {
        if (item._id.decision === 'ALLOWED') dateMap[d].allowed = item.count;
        if (item._id.decision === 'BLOCKED') dateMap[d].blocked = item.count;
        if (item._id.decision === 'REVIEW') dateMap[d].review = item.count;
        dateMap[d].total += item.count;
        dateMap[d].avgRisk = Math.round(item.avgRisk || 0);
      }
    }

    const dailyActivity = Object.values(dateMap);

    const riskAgg = await AuditLog.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    const riskLevelsMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const r of riskAgg) {
      if (riskLevelsMap[r._id] !== undefined) {
        riskLevelsMap[r._id] = r.count;
      }
    }

    const riskDistribution = [
      { name: 'Low (0-29)', value: riskLevelsMap.LOW, fill: '#22C55E' },
      { name: 'Medium (30-59)', value: riskLevelsMap.MEDIUM, fill: '#F59E0B' },
      { name: 'High (60-79)', value: riskLevelsMap.HIGH, fill: '#F97316' },
      { name: 'Critical (80-100)', value: riskLevelsMap.CRITICAL, fill: '#EF4444' },
    ];

    const categoryAgg = await AuditLog.aggregate([
      { $unwind: '$detectedCategories' },
      {
        $group: {
          _id: '$detectedCategories',
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryColorMap = {
      PII: '#38BDF8',
      FINANCIAL: '#EF4444',
      SECRETS: '#F43F5E',
      CREDENTIALS: '#FB923C',
      GOVERNANCE: '#A855F7',
      INJECTION: '#F59E0B',
    };

    const threatCategories = categoryAgg.map((c) => ({
      name: c._id,
      count: c.count,
      fill: categoryColorMap[c._id] || '#38BDF8',
    }));

    res.status(200).json({
      success: true,
      data: {
        dailyActivity,
        riskDistribution,
        threatCategories,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/recent-activity', optionalAuth, async (req, res, next) => {
  try {
    const recent = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('traceId promptHash maskedPrompt riskScore riskLevel decision injectionDetected createdAt userEmail')
      .lean();

    res.status(200).json({
      success: true,
      data: recent,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
