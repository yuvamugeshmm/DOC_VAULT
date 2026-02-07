const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, details = {}, req = null) => {
  try {
    await AuditLog.create({
      userId,
      action,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent')
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

module.exports = { logAction };
