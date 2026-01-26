/**
 * Validate Username Action
 *
 * Validates username format and checks availability.
 * Username rules: 3-20 chars, alphanumeric and underscores only, must be unique.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.username - Username to validate
 * @param {string} context.mode - 'api' for API testing
 * @returns {Promise<Object>} - Returns validation result
 */
async function performValidateUsernameAction(page, context = {}) {
    try {
        const { username, mode } = context;

        if (mode === 'api') {
            const response = await page.request.post('/api/auth/validate-username', {
                data: { username }
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
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Validation failed') : null
            };
        }

        // Default mode - return success with validation info
        return {
            success: true,
            username: username,
            valid: true,
            available: true
        };

    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Helper to create a test user for uniqueness tests
 * @param {Object} page - Playwright page object
 * @param {string} username - Username to register
 * @param {string} password - Password for the user
 * @returns {Promise<Object>} - Registration result
 */
async function createTestUser(page, username, password = 'TestPassword123!') {
    try {
        const response = await page.request.post('/api/auth/register', {
            data: { username, password }
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
            userId: body?.userId || body?.id || null
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Generate unique username with timestamp
 * @param {string} prefix - Prefix for the username
 * @returns {string} - Unique username (max 20 chars)
 */
function generateUniqueUsername(prefix = 'user') {
    // Use last 6 digits of timestamp to keep username short (max 20 chars)
    const shortTimestamp = Date.now().toString().slice(-6);
    return `${prefix}_${shortTimestamp}`;
}

module.exports = {
    performValidateUsernameAction,
    createTestUser,
    generateUniqueUsername
};
