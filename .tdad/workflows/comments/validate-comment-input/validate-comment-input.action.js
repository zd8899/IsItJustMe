const { performCreatePostRecordAction, getOrCreateTestCategory } = require('../../posts/create-post-record/create-post-record.action.js');

/**
 * Validate Comment Input Action
 *
 * Handles comment creation API requests with validation testing.
 * Supports testing valid and invalid comment content scenarios.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.content - Comment content to submit
 * @param {string} context.postId - Post ID to attach comment to
 * @param {string} context.parentId - Optional parent comment ID for replies
 * @param {boolean} context.emptyContent - If true, send empty content
 * @param {boolean} context.overMaxContent - If true, send content exceeding 2000 characters
 * @param {number} context.exactContentLength - If provided, send content of this exact length
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, commentId }
 */
async function performValidateCommentInputAction(page, context = {}) {
    try {
        const {
            mode,
            content,
            postId,
            parentId,
            emptyContent,
            overMaxContent,
            exactContentLength
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api' || !mode) {
            // Build request data
            const requestData = {};

            // Handle content
            if (overMaxContent) {
                // Create content that exceeds 2000 characters
                requestData.content = 'x'.repeat(2001);
            } else if (emptyContent) {
                requestData.content = '';
            } else if (exactContentLength !== undefined) {
                requestData.content = 'x'.repeat(exactContentLength);
            } else if (content !== undefined) {
                requestData.content = content;
            }

            // Add postId
            if (postId !== undefined) {
                requestData.postId = postId;
            }

            // Add parentId if provided
            if (parentId !== undefined) {
                requestData.parentId = parentId;
            }

            // Build request options
            const requestOptions = {
                data: requestData
            };

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
 * Helper to create a test post as a prerequisite for comment tests
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, postId, categoryId }
 */
async function createTestPostForComment(page) {
    try {
        // First get or create a category
        const categoryResult = await getOrCreateTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: 'Failed to get/create test category: ' + categoryResult.errorMessage };
        }

        // Create a test post
        const postResult = await performCreatePostRecordAction(page, {
            mode: 'api',
            frustration: `Test post for comment ${Date.now()}`,
            identity: 'a comment tester',
            categoryId: categoryResult.categoryId
        });

        if (!postResult.success) {
            return { success: false, errorMessage: 'Failed to create test post: ' + postResult.errorMessage };
        }

        return {
            success: true,
            postId: postResult.postId,
            categoryId: categoryResult.categoryId
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract comment ID from action result
 * @param {Object} result - Result from performValidateCommentInputAction
 * @returns {string|null} - Comment ID or null
 */
function getCommentIdFromResult(result) {
    return result?.commentId || result?.body?.id || null;
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performValidateCommentInputAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

module.exports = {
    performValidateCommentInputAction,
    createTestPostForComment,
    getCommentIdFromResult,
    getErrorFromResult,
    // Re-export dependency helpers for convenience
    performCreatePostRecordAction,
    getOrCreateTestCategory
};
