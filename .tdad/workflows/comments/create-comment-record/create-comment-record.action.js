const { createTestPostForComment, performCreatePostRecordAction, getOrCreateTestCategory } = require('../validate-comment-input/validate-comment-input.action.js');

/**
 * Create Comment Record Action
 *
 * Handles comment creation API requests for inserting new comments into the database.
 * Supports anonymous and authenticated users with proper validation.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.content - Comment content to submit
 * @param {string} context.postId - Post ID to attach comment to
 * @param {string} context.parentId - Optional parent comment ID for replies
 * @param {string} context.userId - User ID for authenticated comments
 * @param {string} context.anonymousId - Anonymous ID for anonymous comments
 * @param {string} context.authToken - JWT token for authenticated users
 * @param {boolean} context.useNonExistentPost - If true, use a non-existent post ID
 * @param {boolean} context.useNonExistentParent - If true, use a non-existent parent comment ID
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, commentId }
 */
async function performCreateCommentRecordAction(page, context = {}) {
    try {
        const {
            mode,
            content,
            postId,
            parentId,
            userId,
            anonymousId,
            authToken,
            useNonExistentPost,
            useNonExistentParent
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api' || !mode) {
            // Build request data
            const requestData = {
                content: content || `Test comment ${Date.now()}`,
                postId: useNonExistentPost ? 'non-existent-post-id-12345' : postId
            };

            // Add parentId if provided (for replies)
            if (parentId !== undefined) {
                requestData.parentId = useNonExistentParent ? 'non-existent-parent-comment' : parentId;
            }

            // Add userId if provided (authenticated user)
            if (userId !== undefined) {
                requestData.userId = userId;
            }

            // Add anonymousId if provided (anonymous user)
            if (anonymousId !== undefined) {
                requestData.anonymousId = anonymousId;
            }

            // Build request options
            const requestOptions = {
                data: requestData
            };

            // Add auth header if token provided
            if (authToken) {
                requestOptions.headers = {
                    'Authorization': `Bearer ${authToken}`
                };
            }

            const response = await page.request.post('/api/comments', requestOptions);

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
                commentId: body?.id || null,
                content: body?.content || null,
                postId: body?.postId || null,
                parentId: body?.parentId || null,
                userId: body?.userId || null,
                anonymousId: body?.anonymousId || null,
                upvotes: body?.upvotes,
                downvotes: body?.downvotes,
                score: body?.score,
                createdAt: body?.createdAt || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Comment creation failed') : null
            };
        }

        // No UI mode for this action - it's API only
        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get post details including comment count
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to fetch
 * @returns {Promise<Object>} - Returns { success, post, commentCount }
 */
async function getPostDetails(page, postId) {
    try {
        // Use the GET /api/posts endpoint which returns commentCount
        const response = await page.request.get('/api/posts');

        if (!response.ok()) {
            return { success: false, errorMessage: 'Failed to fetch posts' };
        }

        const posts = await response.json();
        const post = posts.find(p => p.id === postId);

        if (!post) {
            return { success: false, errorMessage: 'Post not found in list' };
        }

        return {
            success: true,
            post: post,
            commentCount: post.commentCount
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a parent comment for reply tests
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to attach comment to
 * @returns {Promise<Object>} - Returns { success, commentId, content }
 */
async function createParentComment(page, postId) {
    try {
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: `Parent comment for reply test ${Date.now()}`,
            postId: postId
        });

        if (!result.success) {
            return { success: false, errorMessage: result.errorMessage };
        }

        return {
            success: true,
            commentId: result.commentId,
            content: result.content
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test user and get auth token
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Prefix for username
 * @returns {Promise<Object>} - Returns { success, token, userId, username }
 */
async function createTestUserAndLogin(page, prefix = 'commentuser') {
    try {
        const timestamp = Date.now().toString().slice(-6);
        const username = `${prefix}_${timestamp}`;
        const password = 'TestPassword123!';

        // Register user
        const registerResponse = await page.request.post('/api/auth/register', {
            data: { username, password }
        });

        if (!registerResponse.ok()) {
            const body = await registerResponse.json().catch(() => ({}));
            return { success: false, errorMessage: body?.error || 'Registration failed' };
        }

        // Login to get token
        const loginResponse = await page.request.post('/api/auth/login', {
            data: { username, password }
        });

        if (!loginResponse.ok()) {
            const body = await loginResponse.json().catch(() => ({}));
            return { success: false, errorMessage: body?.error || 'Login failed' };
        }

        const loginBody = await loginResponse.json();

        return {
            success: true,
            token: loginBody.token,
            userId: loginBody.userId,
            username: loginBody.username
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract comment ID from action result
 * @param {Object} result - Result from performCreateCommentRecordAction
 * @returns {string|null} - Comment ID or null
 */
function getCommentIdFromResult(result) {
    return result?.commentId || result?.body?.id || null;
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performCreateCommentRecordAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

/**
 * Helper to generate anonymous ID
 * @returns {string} - Generated anonymous ID
 */
function generateAnonymousId() {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

module.exports = {
    performCreateCommentRecordAction,
    getPostDetails,
    createParentComment,
    createTestUserAndLogin,
    getCommentIdFromResult,
    getErrorFromResult,
    generateAnonymousId,
    // Re-export dependency helpers for convenience
    createTestPostForComment,
    performCreatePostRecordAction,
    getOrCreateTestCategory
};
