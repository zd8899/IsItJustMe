/**
 * Create Session Action
 *
 * Generates a JWT token for an authenticated user.
 * This action is typically called after verify-credentials
 * to establish a user session.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.userId - User ID to create session for
 * @param {string} context.username - Username for the session
 * @param {string} context.mode - 'api' for API testing
 * @returns {Promise<Object>} - Returns session data with JWT token
 */
async function performCreateSessionAction(page, context = {}) {
    try {
        const { userId, username, mode } = context;

        if (mode === 'api') {
            // Build request data based on context flags
            let requestData = {};

            if (context.emptyBody) {
                requestData = {};
            } else if (context.userIdOnly) {
                requestData = { userId };
            } else if (context.usernameOnly) {
                requestData = { username };
            } else {
                requestData = { userId, username };
            }

            const response = await page.request.post('/api/auth/create-session', {
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
                token: body?.token || null,
                userId: body?.userId || null,
                username: body?.username || null,
                expiresIn: body?.expiresIn || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Session creation failed') : null
            };
        }

        // Default mode - return success with session info placeholder
        return {
            success: true,
            token: null,
            userId: userId,
            username: username,
            expiresIn: null
        };

    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Helper to create a full session flow (register + create session)
 * @param {Object} page - Playwright page object
 * @param {string} username - Username to register
 * @param {string} password - Password for the user
 * @returns {Promise<Object>} - Full session result
 */
async function createFullSessionForUser(page, username, password) {
    try {
        // Step 1: Register the user
        const registerResponse = await page.request.post('/api/auth/register', {
            data: { username, password }
        });

        let registerBody = null;

        try {
            registerBody = await registerResponse.json();
        } catch (e) {
            registerBody = await registerResponse.text();
        }

        if (!registerResponse.ok()) {
            return {
                success: false,
                errorMessage: registerBody?.error || 'Registration failed',
                step: 'register'
            };
        }

        const userId = registerBody?.userId || registerBody?.id;
        const registeredUsername = registerBody?.username || username;

        // Step 2: Create session for the registered user
        const sessionResult = await performCreateSessionAction(page, {
            mode: 'api',
            userId: userId,
            username: registeredUsername
        });

        if (!sessionResult.success) {
            return {
                success: false,
                errorMessage: sessionResult.errorMessage || 'Session creation failed',
                step: 'create-session'
            };
        }

        return {
            success: true,
            userId: userId,
            username: registeredUsername,
            token: sessionResult.token,
            expiresIn: sessionResult.expiresIn
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

/**
 * Extract token from session result
 * @param {Object} sessionResult - Result from performCreateSessionAction
 * @returns {string|null} - JWT token or null
 */
function getTokenFromSession(sessionResult) {
    return sessionResult?.token || sessionResult?.body?.token || null;
}

/**
 * Extract user ID from session result
 * @param {Object} sessionResult - Result from performCreateSessionAction
 * @returns {string|null} - User ID or null
 */
function getUserIdFromSession(sessionResult) {
    return sessionResult?.userId || sessionResult?.body?.userId || null;
}

module.exports = {
    performCreateSessionAction,
    createFullSessionForUser,
    generateUniqueUsername,
    getTokenFromSession,
    getUserIdFromSession
};
