const UserRole = require('../api/models/userModule/userRole.model');
const Permission = require('../api/models/permissionModule/permission.model');

async function ensureRoles() {
  // Define permissions for the system
  const permissions = [
    // Farm permissions
    { name: 'View All Farms', action: 'view', module: 'farms' },
    { name: 'View Own Farms', action: 'view', module: 'own_farms' },
    { name: 'Create Farm', action: 'create', module: 'farms' },
    { name: 'Update Farm', action: 'update', module: 'farms' },
    { name: 'Delete Farm', action: 'delete', module: 'farms' },
    // Field permissions
    { name: 'View All Fields', action: 'view', module: 'fields' },
    { name: 'View Own Fields', action: 'view', module: 'own_fields' },
    { name: 'Create Field', action: 'create', module: 'fields' },
    { name: 'Update Field', action: 'update', module: 'fields' },
    { name: 'Delete Field', action: 'delete', module: 'fields' },
  ];

  // Create or get permissions
  const permissionMap = {};
  for (const perm of permissions) {
    let existingPerm = await Permission.findOne({ action: perm.action, module: perm.module });
    if (!existingPerm) {
      existingPerm = await Permission.create(perm);
    }
    permissionMap[`${perm.action}_${perm.module}`] = existingPerm._id;
  }

  // Define roles with their permissions
  const roles = [
    {
      role: 'Admin',
      roleId: 'admin',
      permissions: [
        permissionMap['view_farms'],
        permissionMap['view_fields'],
        permissionMap['create_farms'],
        permissionMap['update_farms'],
        permissionMap['delete_farms'],
        permissionMap['create_fields'],
        permissionMap['update_fields'],
        permissionMap['delete_fields'],
      ].filter(Boolean), // Remove undefined values
    },
    {
      role: 'Owner',
      roleId: 'owner',
      permissions: [
        permissionMap['view_own_farms'],
        permissionMap['view_own_fields'],
        permissionMap['create_farms'],
        permissionMap['update_farms'],
        permissionMap['delete_farms'],
        permissionMap['create_fields'],
        permissionMap['update_fields'],
        permissionMap['delete_fields'],
      ].filter(Boolean), // Remove undefined values
    },
  ];

  // Create or update roles
  for (const r of roles) {
    const existing = await UserRole.findOne({ roleId: r.roleId });
    if (!existing) {
      await UserRole.create(r);
      console.log(`✅ Created role: ${r.role}`);
    } else {
      // Update permissions if role exists
      existing.permissions = r.permissions;
      await existing.save();
      console.log(`✅ Updated role: ${r.role}`);
    }
  }
}

module.exports = ensureRoles;