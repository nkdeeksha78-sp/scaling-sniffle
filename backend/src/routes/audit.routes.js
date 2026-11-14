import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { auditStore } from '../services/store.service.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      decision,
      riskLevel,
      search,
      user: targetUser,
      from,
      to,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (decision && decision !== 'ALL') {
      query.decision = decision;
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel.toUpperCase();
    }

    if (targetUser && targetUser.trim()) {
      query.userEmail = { $regex: targetUser.trim(), $options: 'i' };
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { traceId: { $regex: term, $options: 'i' } },
        { promptHash: { $regex: term, $options: 'i' } },
        { userEmail: { $regex: term, $options: 'i' } },
        { policyTriggered: { $regex: term, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const { logs, total } = await auditStore.find({
      query,
      limit: limitNum,
      page: pageNum,
      sort: { [sortBy]: sortOrder },
    });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export/csv', optionalAuth, async (req, res, next) => {
  try {
    const { logs } = await auditStore.find({ limit: 1000 });

    const headers = [
      'TraceID',
      'TimestampUTC',
      'UserEmail',
      'SHA256PromptHash',
      'RiskScore',
      'RiskLevel',
      'Decision',
      'DetectedCategories',
      'MaskedTokensCount',
      'InjectionDetected',
      'PolicyTriggered',
    ];

    const rows = logs.map((log) => [
      log.traceId,
      new Date(log.createdAt).toISOString(),
      log.userEmail,
      log.promptHash,
      log.riskScore,
      log.riskLevel,
      log.decision,
      `"${(log.detectedCategories || []).join(';')}"`,
      log.detectedEntitiesCount,
      log.injectionDetected ? 'TRUE' : 'FALSE',
      `"${(log.policyTriggered || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=trustguard-audit-${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    let log = null;

    if (id.startsWith('tg_')) {
      log = await AuditLog.findOne({ traceId: id }).populate('userId', 'name email role organization').lean();
    } else {
      log = await AuditLog.findById(id).populate('userId', 'name email role organization').lean();
    }

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
