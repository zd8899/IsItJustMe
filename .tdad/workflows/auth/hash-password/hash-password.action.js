/**
 * Hash Password Action
 *
 * Hash password using bcrypt with salt.
 * Supports hashing and verification operations.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.password - Password to hash
 * @param {string} context.action - 'hash' (default) or 'verify'
 * @param {string} context.hash - Hash to verify against (required for verify action)
 * @param {string} context.mode - 'api' for API testing
 * @returns {Promise<Object>} - Returns hash result or verification result
 */
async function performHashPasswordAction(page, context = {}) {
    try {
        const { password, action = 'hash', hash, mode } = context;

        if (mode === 'api') {
            const requestBody = action === 'verify'
                ? { password, action, hash }
                : { password };

            const response = await page.request.post('/api/auth/hash-password', {
                data: requestBody
            });

            const status = response.status();
            let body = null;

            try {
                body = await response.json();
            } catch (e) {
                body = await response.text();
            }

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                hash: body?.hash || null,
                valid: body?.valid ?? null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Operation failed') : null
            };
        }

        // Default mode - return success with basic info
        return {
            success: true,
            password: password,
            action: action
        };

    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Helper to verify if a string is a valid bcrypt hash
 * @param {string} hash - Hash to validate
 * @returns {boolean} - True if valid bcrypt hash format
 */
function isValidBcryptHash(hash) {
    if (!hash || typeof hash !== 'string') return false;
    // Bcrypt hashes start with $2a$ or $2b$ and are 60 characters
    return /^\$2[ab]\$\d{2}\$.{53}$/.test(hash);
}

/**
 * Helper to extract bcrypt version from hash
 * @param {string} hash - Bcrypt hash
 * @returns {string|null} - Version prefix (e.g., "$2b$") or null
 */
function getBcryptVersion(hash) {
    if (!hash || typeof hash !== 'string') return null;
    const match = hash.match(/^(\$2[ab]\$)/);
    return match ? match[1] : null;
}

module.exports = {
    performHashPasswordAction,
    isValidBcryptHash,
    getBcryptVersion
};
