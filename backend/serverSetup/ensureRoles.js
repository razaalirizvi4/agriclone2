const UserRole = require('../api/models/userModule/userRole.model');
const Permission = require('../api/models/permissionModule/permission.model');

async function ensureRoles() {
  console.log('Checking and ensuring roles and permissions...');

  // 1. Define all available permissions in the system
  const permissionsList = [
    // --- FARMS ---
    // Global
    { name: 'View All Farms', action: 'view', module: 'farms' },
    { name: 'Create Farm', action: 'create', module: 'farms' },
    { name: 'Update All Farms', action: 'update', module: 'farms' },
    { name: 'Delete All Farms', action: 'delete', module: 'farms' },
    // Scoped: Own
    { name: 'View Own Farms', action: 'view', module: 'own_farms' },
    { name: 'Update Own Farms', action: 'update', module: 'own_farms' },
    { name: 'Delete Own Farms', action: 'delete', module: 'own_farms' },
    // Scoped: Assigned
    { name: 'View Assigned Farms', action: 'view', module: 'assigned_farms' },

    // --- FIELDS ---
    // Global
    { name: 'View All Fields', action: 'view', module: 'fields' },
    { name: 'Create Field', action: 'create', module: 'fields' },
    { name: 'Update All Fields', action: 'update', module: 'fields' },
    { name: 'Delete All Fields', action: 'delete', module: 'fields' },
    // Scoped: Own
    { name: 'View Own Fields', action: 'view', module: 'own_fields' },
    { name: 'Create Own Fields', action: 'create', module: 'own_fields' },
    { name: 'Update Own Fields', action: 'update', module: 'own_fields' },
    { name: 'Delete Own Fields', action: 'delete', module: 'own_fields' },
    // Scoped: Assigned
    { name: 'View Assigned Fields', action: 'view', module: 'assigned_fields' },

    // --- USERS ---
    // Global
    { name: 'View All Users', action: 'view', module: 'users' },
    { name: 'Create User', action: 'create', module: 'users' },
    { name: 'Update All Users', action: 'update', module: 'users' },
    { name: 'Delete All Users', action: 'delete', module: 'users' },
    // Scoped: Own Team
    { name: 'View Own Users', action: 'view', module: 'own_users' },
    { name: 'Update Own Users', action: 'update', module: 'own_users' },
    { name: 'Delete Own Users', action: 'delete', module: 'own_users' },

    // --- CROPS ---
    { name: 'View All Crops', action: 'view', module: 'crops' },
    { name: 'Create Crop', action: 'create', module: 'crops' },
    { name: 'Update All Crops', action: 'update', module: 'crops' },
    { name: 'Delete All Crops', action: 'delete', module: 'crops' },
    // Scoped (used for implicit logic, but simplified to base permissions if needed, here adding distinct ones for clarity)
    { name: 'View Assigned Crops', action: 'view', module: 'assigned_crops' },

    // --- EVENTS ---
    { name: 'View All Events', action: 'view', module: 'events' },
    { name: 'Create Event', action: 'create', module: 'events' },
    { name: 'Update All Events', action: 'update', module: 'events' },
    { name: 'Delete All Events', action: 'delete', module: 'events' },
    // Scoped
    { name: 'View Assigned Events', action: 'view', module: 'assigned_events' },

    // --- WEATHER ---
    { name: 'View Weather', action: 'view', module: 'weather' },
  ];

  // 2. Upsert Permissions and build a Map
  const permissionMap = {};
  for (const perm of permissionsList) {
    const existingPerm = await Permission.findOneAndUpdate(
      { action: perm.action, module: perm.module },
      perm,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    permissionMap[`${perm.action}:${perm.module}`] = existingPerm._id;
  }

  // Helper to safely get permission IDs
  const getPerms = (keys) => keys.map(k => permissionMap[k]).filter(Boolean);

  // 3. Define Role Mappings
  const roleDefinitions = [
    {
      role: 'Admin',
      roleId: 'admin', // 0 concept
      permissions: getPerms([
        // All Global
        'view:farms', 'create:farms', 'update:farms', 'delete:farms',
        'view:fields', 'create:fields', 'update:fields', 'delete:fields',
        'view:users', 'create:users', 'update:users', 'delete:users',
        'view:crops', 'create:crops', 'update:crops', 'delete:crops',
        'view:events', 'create:events', 'update:events', 'delete:events',
        'view:weather'
      ])
    },
    {
      role: 'Owner',
      roleId: 'owner', // 1 concept
      permissions: getPerms([
        // Farms (Own)
        'create:farms', 'view:own_farms', 'update:own_farms', 'delete:own_farms',
        // Fields (Own)
        'create:own_fields', 'view:own_fields', 'update:own_fields', 'delete:own_fields',
        // Users (Own Team)
        'create:users', 'view:own_users', 'update:own_users', 'delete:own_users',
        // Crops/Events/Weather (Full Access as per "*")
        //'view:crops', 'create:crops', 'update:crops', 'delete:crops',
        'view:events', 'create:events', 'update:events', 'delete:events',
        'view:weather'
      ])
    },
    {
      role: 'Grower',
      roleId: 'grower', // 2 concept
      permissions: getPerms([
        // Farms: Assigned
        'view:assigned_farms',
        // Fields: Assigned (View Only)
        'view:assigned_fields',
        // Crops: Assigned (CRUD)
        'view:assigned_crops', 'create:crops', 'update:crops', 'delete:crops',
        // Events: Assigned (CRUD)
        'view:assigned_events', 'create:events', 'update:events', 'delete:events',
        // Weather
        'view:weather'
      ])
    },
    {
      role: 'Consultant',
      roleId: 'consultant', // 3 concept
      permissions: getPerms([
        // Farms: Assigned
        'view:assigned_farms',
        // Fields: Assigned (View Only)
        'view:assigned_fields',
        // Crops: Full CRUD
        'view:crops', 'create:crops', 'update:crops', 'delete:crops',
        // Events: View Only (Assigned implicit or global? Request said "view:events")
        'view:events',
        // Weather
        'view:weather'
      ])
    }
  ];

  // 4. Upsert Roles
  for (const r of roleDefinitions) {
    const existing = await UserRole.findOne({ roleId: r.roleId });
    if (!existing) {
      await UserRole.create(r);
      console.log(`✅ Created role: ${r.role}`);
    } else {
      existing.permissions = r.permissions;
      await existing.save();
      console.log(`✅ Updated role: ${r.role} with ${r.permissions.length} permissions`);
    }
  }
}

module.exports = ensureRoles;