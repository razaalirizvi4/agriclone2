const permissionService = require('../../../services/permission.service');

// @desc    Create a new permission
// @route   POST /api/permissions
// @access  Private (Admin only - to be enforced by middleware)
const create = async (req, res) => {
    try {
        const permission = await permissionService.createPermission(req.body);
        res.status(201).json(permission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    List all permissions
// @route   GET /api/permissions
// @access  Private
const list = async (req, res) => {
    try {
        const permissions = await permissionService.getAllPermissions(req.query);
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get permission by ID
// @route   GET /api/permissions/:id
// @access  Private
const read = async (req, res) => {
    try {
        const permission = await permissionService.getPermission(req.params.id);
        res.json(permission);
    } catch (error) {
        if (error.message === 'Permission not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Private (Admin only)
const update = async (req, res) => {
    try {
        const permission = await permissionService.updatePermission(req.params.id, req.body);
        res.json(permission);
    } catch (error) {
        if (error.message === 'Permission not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Private (Admin only)
const remove = async (req, res) => {
    try {
        await permissionService.deletePermission(req.params.id);
        res.json({ message: 'Permission removed' });
    } catch (error) {
        if (error.message === 'Permission not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    create,
    list,
    read,
    update,
    remove
};
