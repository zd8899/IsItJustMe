/**
 * Create User Record Action
 *
 * Creates a new user record in the database via the registration API.
 * Handles username validation and password hashing internally.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.username - Username for the new user
 * @param {string} context.password - Password for the new user
 * @param {string} context.mode - 'api' for API testing
 * @returns {Promise<Object>} - Returns creation result with user data
 */
async function performCreateUserRecordAction(page, context = {}) {
    try {
        const { username, password, mode } = context;

        if (mode === 'api') {
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
                username: body?.username || null,
                karma: body?.karma ?? null,
                createdAt: body?.createdAt || null,
                updatedAt: body?.updatedAt || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Registration failed') : null
            };
        }

        // Default mode - return success with basic info
        return {
            success: true,
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
 * Helper to create a unique user for tests
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Prefix for username (default: 'user')
 * @param {string} password - Password for the user (default: 'TestPassword123!')
 * @returns {Promise<Object>} - Registration result with user data
 */
async function createUniqueUser(page, prefix = 'user', password = 'TestPassword123!') {
    const username = generateUniqueUsername(prefix);
    return performCreateUserRecordAction(page, {
        mode: 'api',
        username,
        password
    });
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

/**
 * Helper to get user ID from action result
 * @param {Object} result - Result from performCreateUserRecordAction
 * @returns {string|null} - User ID or null
 */
function getUserId(result) {
    return result?.userId || result?.body?.userId || result?.body?.id || null;
}

/**
 * Helper to check if response body does not contain a specific field
 * @param {Object} body - Response body object
 * @param {string} field - Field name to check
 * @returns {boolean} - True if field is not present
 */
function bodyDoesNotContain(body, field) {
    return body && !(field in body);
}

module.exports = {
    performCreateUserRecordAction,
    createUniqueUser,
    generateUniqueUsername,
    getUserId,
    bodyDoesNotContain
};
