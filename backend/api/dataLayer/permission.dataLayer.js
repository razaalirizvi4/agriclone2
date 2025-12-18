const Permission = require('../models/permissionModule/permission.model');

async function createPermission(input) {
    const permission = await Permission.create(input);
    return permission;
}

async function listPermissions(filter = {}) {
    const query = {};

    if (filter.name) {
        query.name = { $regex: filter.name, $options: 'i' };
    }
    if (filter.module) {
        query.module = filter.module;
    }
    if (filter.action) {
        query.action = filter.action;
    }

    return Permission.find(query).sort({ createdAt: -1 });
}

async function getPermissionById(id) {
    return Permission.findById(id);
}

async function updatePermissionById(id, update) {
    return Permission.findByIdAndUpdate(id, update, { new: true });
}

async function deletePermissionById(id) {
    return Permission.findByIdAndDelete(id);
}

module.exports = {
    createPermission,
    listPermissions,
    getPermissionById,
    updatePermissionById,
    deletePermissionById
};
