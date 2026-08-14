const AuditLog = require('../models/AuditLog');

/**
 * Log security and operational audit actions to MongoDB.
 * Supports flexible invocation:
 *   logAuditAction(req, 'PLAN_UPGRADE', 'Subscription', 'Upgraded to Professional')
 *   OR
 *   logAuditAction({ companyId, userId, userName, userRole, action, entityType, entityId, details, ipAddress })
 */
const logAuditAction = async (reqOrData, actionArg, entityTypeArg, detailsArg, extraArg = {}) => {
  try {
    let companyId, userId, userName, userRole, action, entityType, entityId, details, ipAddress;

    const isExpressReq = reqOrData && typeof reqOrData === 'object' && (reqOrData.method || reqOrData.baseUrl || typeof reqOrData.get === 'function');

    if (isExpressReq) {
      const req = reqOrData;
      companyId = req.companyId || req.user?.companyId || req.user?._id;
      userId = req.user?._id;
      userName = req.user?.name || 'System User';
      userRole = req.user?.role || 'Company Admin';
      action = actionArg;
      entityType = entityTypeArg || 'Workspace';
      entityId = extraArg.entityId || '';
      details = detailsArg || '';
      ipAddress = req.ip || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    } else if (reqOrData && typeof reqOrData === 'object') {
      ({ companyId, userId, userName, userRole, action, entityType, entityId, details, ipAddress } = reqOrData);
    }

    if (!companyId) return;

    await AuditLog.create({
      companyId,
      userId: userId || companyId,
      userName: userName || 'System User',
      userRole: userRole || 'Company Admin',
      action: action || 'WORKSPACE_EVENT',
      entityType: entityType || 'Workspace',
      entityId: entityId ? String(entityId) : '',
      details: details || '',
      ipAddress: ipAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('[Audit Logger Error]', err.message);
  }
};

module.exports = logAuditAction;
