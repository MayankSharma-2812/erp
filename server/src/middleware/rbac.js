const permissions = require('../config/permissions');

const authorize = (resource, action) => {
  return (req, res, next) => {
    try {
      const { role } = req.user;
      
      const rolePermissions = permissions[role];
      if (!rolePermissions) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: insufficient permissions',
        });
      }

      const resourceActions = rolePermissions[resource];
      if (!resourceActions || !resourceActions.includes(action)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: insufficient permissions',
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient permissions',
      });
    }
  };
};

module.exports = authorize;
