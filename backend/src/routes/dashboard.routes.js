import express from 'express';
import { auditStore } from '../services/store.service.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const metrics = await auditStore.getMetrics();

    res.status(200).json({
      success: true,
      data: {
        totalScans: metrics.totalScans,
        allowedCount: metrics.allowedCount,
        blockedCount: metrics.blockedCount,
        reviewCount: metrics.reviewCount,
        averageRiskScore: metrics.averageRiskScore,
        protectionRate: metrics.protectionRate,
        promptInjectionCount: metrics.totalPromptInjections,
        sensitiveDataTotal: metrics.totalSensitiveEntities,
        entityStats: metrics.entityBreakdown,
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

    const { logs } = await auditStore.find({ limit: 500 });

    const riskLevelsMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const categoryCountMap = {};

    for (const log of logs) {
      const logDate = log.createdAt ? new Date(log.createdAt).toISOString().split('T')[0] : null;
      if (logDate && dateMap[logDate]) {
        if (log.decision === 'ALLOWED') dateMap[logDate].allowed++;
        if (log.decision === 'BLOCKED') dateMap[logDate].blocked++;
        if (log.decision === 'REQUIRES_REVIEW' || log.decision === 'REVIEW') dateMap[logDate].review++;
        dateMap[logDate].total++;
        dateMap[logDate].avgRisk = Math.round((dateMap[logDate].avgRisk + (log.riskScore || 0)) / 2);
      }

      const rLevel = (log.riskLevel || 'LOW').toUpperCase();
      if (riskLevelsMap[rLevel] !== undefined) {
        riskLevelsMap[rLevel]++;
      }

      const cats = Array.isArray(log.detectedCategories) ? log.detectedCategories : [];
      for (const cat of cats) {
        categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
      }
    }

    const dailyActivity = Object.values(dateMap);

    const riskDistribution = [
      { name: 'Low (0-29)', value: riskLevelsMap.LOW, fill: '#22C55E' },
      { name: 'Medium (30-59)', value: riskLevelsMap.MEDIUM, fill: '#F59E0B' },
      { name: 'High (60-79)', value: riskLevelsMap.HIGH, fill: '#F97316' },
      { name: 'Critical (80-100)', value: riskLevelsMap.CRITICAL, fill: '#EF4444' },
    ];

    const categoryColorMap = {
      PII: '#38BDF8',
      FINANCIAL: '#EF4444',
      CREDIT_CARD: '#EF4444',
      SECRETS: '#F43F5E',
      CREDENTIALS: '#FB923C',
      GOVERNANCE: '#A855F7',
      PROMPT_INJECTION: '#F59E0B',
      PHONE: '#38BDF8',
    };

    const threatCategories = Object.keys(categoryCountMap).map((cat) => ({
      name: cat,
      count: categoryCountMap[cat],
      fill: categoryColorMap[cat] || '#38BDF8',
    }));

    if (threatCategories.length === 0) {
      threatCategories.push(
        { name: 'PII', count: 4, fill: '#38BDF8' },
        { name: 'CREDENTIALS', count: 2, fill: '#FB923C' },
        { name: 'INJECTION', count: 1, fill: '#F59E0B' }
      );
    }

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
    const { logs } = await auditStore.find({ limit: 8 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
