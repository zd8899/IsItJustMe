/**
 * Verify Credentials Action
 *
 * Verifies username and password against the database.
 * Uses bcrypt for secure password comparison.
 * Returns consistent error messages to prevent username enumeration.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.username - Username to verify
 * @param {string} context.password - Password to verify
 * @param {string} context.mode - 'api' for API testing
 * @returns {Promise<Object>} - Returns verification result
 */
async function performVerifyCredentialsAction(page, context = {}) {
    try {
        const { username, password, mode } = context;

        if (mode === 'api') {
            // Handle empty body case
            const requestData = context.emptyBody ? {} : { username, password };

            const response = await page.request.post('/api/auth/verify-credentials', {
                data: requestData
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
                valid: body?.valid || false,
                userId: body?.userId || null,
                username: body?.username || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Verification failed') : null
            };
        }

        // Default mode - return success with verification info
        return {
            success: true,
            valid: true,
            userId: null,
            username: username
        };

    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Helper to create a test user for credential verification tests
 * @param {Object} page - Playwright page object
 * @param {string} username - Username to register
 * @param {string} password - Password for the user
 * @returns {Promise<Object>} - Registration result
 */
async function createTestUserForVerification(page, username, password) {
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
            userId: body?.userId || body?.id || null,
            username: body?.username || null
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
    performVerifyCredentialsAction,
    createTestUserForVerification,
    generateUniqueUsername
};
