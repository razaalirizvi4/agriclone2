function success(data) {
    return { success: true, data };
}

function fail(message) {
    return { success: false, error: { message } };
}

module.exports = { success, fail };
