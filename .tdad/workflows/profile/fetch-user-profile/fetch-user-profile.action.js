/**
 * Fetch User Profile Action
 *
 * Queries user profile data from the database via the user.getProfile tRPC endpoint.
 * Returns user information including id, username, karma, createdAt, and counts.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.userId - The user ID to fetch
 * @param {boolean} context.emptyUserId - If true, send empty userId (validation error test)
 * @param {boolean} context.nonExistent - If true, use a non-existent user ID
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, ... }
 */
async function performFetchUserProfileAction(page, context = {}) {
    try {
        const { mode, userId, emptyUserId, nonExistent } = context;

        // ==========================================
        // API MODE - Direct HTTP request via tRPC
        // ==========================================
        if (mode === 'api' || !mode) {
            let idToUse;

            if (emptyUserId) {
                // Empty userId to test validation
                idToUse = '';
            } else if (nonExistent) {
                // Use a valid-looking CUID that doesn't exist
                idToUse = 'clxyz123nonexistent456';
            } else {
                idToUse = userId;
            }

            // Build URL with encoded input parameter
            const inputParams = { userId: idToUse };
            const encodedInput = encodeURIComponent(JSON.stringify({ json: inputParams }));
            const url = `/api/trpc/user.getProfile?input=${encodedInput}`;

            const response = await page.request.get(url);

            const status = response.status();
            let body = null;

            try {
                body = await response.json();
            } catch (e) {
                body = await response.text();
            }

            // Extract error message from tRPC error response
            let errorMessage = null;
            if (!response.ok()) {
                const zodError = body?.error?.json?.data?.zodError;
                if (zodError && zodError.fieldErrors) {
                    const fieldErrors = Object.values(zodError.fieldErrors);
                    if (fieldErrors.length > 0 && Array.isArray(fieldErrors[0]) && fieldErrors[0].length > 0) {
                        errorMessage = fieldErrors[0][0];
                    }
                }
                if (!errorMessage) {
                    errorMessage = body?.error?.json?.message || body?.error?.message || 'Fetch user profile failed';
                }
            }

            // Extract profile data from successful response
            // tRPC with superjson returns data in result.data.json format
            // Check if json property exists in the response to properly handle null values
            const resultData = body?.result?.data;
            const profileData = resultData && typeof resultData === 'object' && 'json' in resultData
                ? resultData.json
                : (resultData ?? null);

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                profile: profileData,
                userId: profileData?.id || null,
                username: profileData?.username || null,
                karma: profileData?.karma ?? null,
                createdAt: profileData?.createdAt || null,
                _count: profileData?._count || null,
                postCount: profileData?._count?.posts ?? null,
                commentCount: profileData?._count?.comments ?? null,
                isNull: profileData === null,
                errorMessage: errorMessage
            };
        }

        // No UI mode for this action - it's API only
        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a unique test user
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Prefix for username (default: 'user')
 * @param {string} password - Password for the user (default: 'TestPassword123!')
 * @returns {Promise<Object>} - Registration result with user data
 */
async function createTestUser(page, prefix = 'user', password = 'TestPassword123!') {
    const username = generateUniqueUsername(prefix);

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
        username: body?.username || username,
        karma: body?.karma ?? null,
        errorMessage: !response.ok() ? (body?.error || body?.message || 'Registration failed') : null
    };
}

/**
 * Generate unique username with timestamp
 * @param {string} prefix - Prefix for the username
 * @returns {string} - Unique username (max 20 chars)
 */
function generateUniqueUsername(prefix = 'user') {
    const shortTimestamp = Date.now().toString().slice(-6);
    return `${prefix}_${shortTimestamp}`;
}

/**
 * Helper to create a test post for a user
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the post
 * @param {string} options.userId - User ID to associate with post (optional)
 * @param {string} options.categoryId - Category ID (required if no category available)
 * @returns {Promise<Object>} - Returns { success, postId, errorMessage }
 */
async function createTestPost(page, options = {}) {
    try {
        // Get a category if not provided
        let categoryId = options.categoryId;
        if (!categoryId) {
            const catResponse = await page.request.get('/api/categories');
            if (catResponse.ok()) {
                const categories = await catResponse.json();
                if (Array.isArray(categories) && categories.length > 0) {
                    categoryId = categories[0].id;
                }
            }
        }

        if (!categoryId) {
            return { success: false, errorMessage: 'No category available for creating test post' };
        }

        const anonymousId = `anon_profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const postData = {
            frustration: `Test frustration ${Date.now()}`,
            identity: `a profile tester`,
            categoryId: categoryId,
            anonymousId: anonymousId,
            userId: options.userId || undefined
        };

        const response = await page.request.post('/api/posts', {
            data: postData
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
            postId: body?.id || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Post creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test comment for a user
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the comment
 * @param {string} options.postId - Post ID to comment on (required)
 * @param {string} options.userId - User ID to associate with comment (optional)
 * @returns {Promise<Object>} - Returns { success, commentId, errorMessage }
 */
async function createTestComment(page, options = {}) {
    try {
        if (!options.postId) {
            return { success: false, errorMessage: 'postId is required to create a comment' };
        }

        const anonymousId = `anon_comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const commentData = {
            content: `Test comment ${Date.now()}`,
            postId: options.postId,
            anonymousId: anonymousId,
            userId: options.userId || undefined
        };

        const response = await page.request.post('/api/comments', {
            data: commentData
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
            commentId: body?.id || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Comment creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get user ID from profile result
 * @param {Object} result - Result from performFetchUserProfileAction
 * @returns {string|null} - User ID or null
 */
function getUserIdFromResult(result) {
    return result?.userId || result?.profile?.id || null;
}

/**
 * Helper to get username from profile result
 * @param {Object} result - Result from performFetchUserProfileAction
 * @returns {string|null} - Username or null
 */
function getUsernameFromResult(result) {
    return result?.username || result?.profile?.username || null;
}

/**
 * Helper to get karma from profile result
 * @param {Object} result - Result from performFetchUserProfileAction
 * @returns {number|null} - Karma value or null
 */
function getKarmaFromResult(result) {
    return result?.karma ?? result?.profile?.karma ?? null;
}

/**
 * Helper to get _count object from profile result
 * @param {Object} result - Result from performFetchUserProfileAction
 * @returns {Object|null} - Count object { posts, comments } or null
 */
function getCountsFromResult(result) {
    return result?._count || result?.profile?._count || null;
}

/**
 * Helper to check if profile response is null
 * @param {Object} result - Result from performFetchUserProfileAction
 * @returns {boolean} - True if profile is null
 */
function isProfileNull(result) {
    return result?.isNull === true || result?.profile === null;
}

/**
 * Helper to extract error message from result
 * @param {Object} result - Result from performFetchUserProfileAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error?.json?.message || null;
}

/**
 * Helper to check if response indicates validation error
 * @param {Object} result - Result from performFetchUserProfileAction
 * @returns {boolean} - True if validation error occurred
 */
function isValidationError(result) {
    return result?.statusCode === 400 || result?.body?.error?.json?.data?.code === 'BAD_REQUEST';
}

module.exports = {
    performFetchUserProfileAction,
    createTestUser,
    generateUniqueUsername,
    createTestPost,
    createTestComment,
    getUserIdFromResult,
    getUsernameFromResult,
    getKarmaFromResult,
    getCountsFromResult,
    isProfileNull,
    getErrorFromResult,
    isValidationError
};
