const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ companyId: req.companyId }).sort({ createdAt: -1 }).limit(20);
    const unreadCount = await Notification.countDocuments({ companyId: req.companyId, isRead: false });
    res.status(200).json({ success: true, unreadCount, notifications });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ companyId: req.companyId }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    let logs = await AuditLog.find({
      companyId: req.companyId,
      userRole: { $ne: 'Super Admin' },
      userName: { $ne: 'Super Admin' },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // If empty, auto-seed initial workspace audit event
    if (logs.length === 0) {
      const initLog = await AuditLog.create({
        companyId: req.companyId,
        userId: req.user.id,
        userName: req.user.name || 'Company Admin',
        userRole: req.user.role || 'Company Admin',
        action: 'WORKSPACE_INITIALIZED',
        entityType: 'SecurityAudit',
        entityId: req.companyId.toString(),
        details: 'Audit logging engine initialized and security tracking active',
      });
      logs = [initLog];
    }

    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  getAuditLogs,
};
