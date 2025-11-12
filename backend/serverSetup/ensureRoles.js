const UserRole = require('../api/models/userModule/userRole.model');

async function ensureRoles() {
  const desired = [
    { role: 'Admin', roleId: 'admin' },
    { role: 'Owner', roleId: 'owner' }
  ];

  for (const r of desired) {
    const existing = await UserRole.findOne({ roleId: r.roleId });
    if (!existing) {
      await UserRole.create({ ...r, permissions: [] });
    }
  }
}

module.exports = ensureRoles;