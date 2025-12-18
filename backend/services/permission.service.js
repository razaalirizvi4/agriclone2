const permissionDataLayer = require('../api/dataLayer/permission.dataLayer');

async function createPermission(data) {
    if (!data.name || !data.action || !data.module) {
        throw new Error('Name, action, and module are required');
    }
    // Check if permission already exists happens in dataLayer usually or we check duplicates here?
    // The model doesn't enforce unique combination implicitly other than _id, but we should probably check.
    // EnsureRoles checks it. Let's assume for now we just create.
    // Or we could check uniqueness.
    
    // For now, simple pass-through with validation.
    return permissionDataLayer.createPermission(data);
}

async function getAllPermissions(filter) {
    return permissionDataLayer.listPermissions(filter);
}

async function getPermission(id) {
    const permission = await permissionDataLayer.getPermissionById(id);
    if (!permission) {
        throw new Error('Permission not found');
    }
    return permission;
}

async function updatePermission(id, data) {
    // Check existence
    const existing = await permissionDataLayer.getPermissionById(id);
    if (!existing) {
        throw new Error('Permission not found');
    }
    return permissionDataLayer.updatePermissionById(id, data);
}

async function deletePermission(id) {
    const existing = await permissionDataLayer.getPermissionById(id);
    if (!existing) {
        throw new Error('Permission not found');
    }
    return permissionDataLayer.deletePermissionById(id);
}

module.exports = {
    createPermission,
    getAllPermissions,
    getPermission,
    updatePermission,
    deletePermission
};
