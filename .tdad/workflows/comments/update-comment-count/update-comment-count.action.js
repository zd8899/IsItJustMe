const {
    performCreateCommentRecordAction,
    getPostDetails,
    createParentComment,
    createTestPostForComment
} = require('../create-comment-record/create-comment-record.action.js');

/**
 * Update Comment Count Action
 *
 * Handles verification of comment count increment functionality.
 * The comment count on a post should increment by 1 each time a comment is created.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.postId - Post ID to add comment to
 * @param {string} context.content - Comment content
 * @param {string} context.parentId - Optional parent comment ID for replies
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, commentId, initialCount, finalCount }
 */
async function performUpdateCommentCountAction(page, context = {}) {
    try {
        const {
            mode,
            postId,
            content,
            parentId
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api' || !mode) {
            // Get initial comment count
            const initialPostDetails = await getPostDetails(page, postId);
            if (!initialPostDetails.success) {
                return {
                    success: false,
                    errorMessage: `Failed to get initial post details: ${initialPostDetails.errorMessage}`
                };
            }
            const initialCount = initialPostDetails.commentCount;

            // Create comment using the create-comment-record action
            const createResult = await performCreateCommentRecordAction(page, {
                mode: 'api',
                postId: postId,
                content: content || `Test comment ${Date.now()}`,
                parentId: parentId
            });

            // Get final comment count
            const finalPostDetails = await getPostDetails(page, postId);
            if (!finalPostDetails.success) {
                return {
                    success: false,
                    errorMessage: `Failed to get final post details: ${finalPostDetails.errorMessage}`,
                    createResult: createResult
                };
            }
            const finalCount = finalPostDetails.commentCount;

            return {
                success: createResult.success,
                statusCode: createResult.statusCode,
                body: createResult.body,
                commentId: createResult.commentId,
                initialCount: initialCount,
                finalCount: finalCount,
                countIncremented: finalCount === initialCount + 1,
                errorMessage: createResult.errorMessage
            };
        }

        // No UI mode for this action - it's API only
        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get post comment count
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to get count for
 * @returns {Promise<Object>} - Returns { success, commentCount, errorMessage }
 */
async function getPostCommentCount(page, postId) {
    try {
        const result = await getPostDetails(page, postId);
        if (!result.success) {
            return { success: false, errorMessage: result.errorMessage };
        }
        return {
            success: true,
            commentCount: result.commentCount
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create multiple comments and verify count accumulates
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to add comments to
 * @param {number} count - Number of comments to create
 * @returns {Promise<Object>} - Returns { success, commentIds, initialCount, finalCount, errorMessage }
 */
async function createMultipleCommentsAndVerifyCount(page, postId, count) {
    try {
        // Get initial count
        const initialResult = await getPostCommentCount(page, postId);
        if (!initialResult.success) {
            return { success: false, errorMessage: initialResult.errorMessage };
        }
        const initialCount = initialResult.commentCount;

        const commentIds = [];
        for (let i = 0; i < count; i++) {
            const result = await performCreateCommentRecordAction(page, {
                mode: 'api',
                postId: postId,
                content: `Comment ${i + 1} at ${Date.now()}`
            });
            if (!result.success) {
                return {
                    success: false,
                    errorMessage: `Failed to create comment ${i + 1}: ${result.errorMessage}`,
                    commentIds: commentIds,
                    initialCount: initialCount
                };
            }
            commentIds.push(result.commentId);
        }

        // Get final count
        const finalResult = await getPostCommentCount(page, postId);
        if (!finalResult.success) {
            return { success: false, errorMessage: finalResult.errorMessage };
        }
        const finalCount = finalResult.commentCount;

        return {
            success: true,
            commentIds: commentIds,
            initialCount: initialCount,
            finalCount: finalCount,
            expectedFinalCount: initialCount + count
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to verify comment count on two posts (one changed, one unchanged)
 * @param {Object} page - Playwright page object
 * @param {string} targetPostId - Post ID to add comment to
 * @param {string} otherPostId - Post ID that should not be affected
 * @returns {Promise<Object>} - Returns { success, targetInitialCount, targetFinalCount, otherInitialCount, otherFinalCount }
 */
async function verifyCommentCountIsolation(page, targetPostId, otherPostId) {
    try {
        // Get initial counts for both posts
        const targetInitial = await getPostCommentCount(page, targetPostId);
        const otherInitial = await getPostCommentCount(page, otherPostId);

        if (!targetInitial.success || !otherInitial.success) {
            return {
                success: false,
                errorMessage: 'Failed to get initial counts'
            };
        }

        // Create comment on target post
        const createResult = await performCreateCommentRecordAction(page, {
            mode: 'api',
            postId: targetPostId,
            content: `Isolation test comment ${Date.now()}`
        });

        if (!createResult.success) {
            return {
                success: false,
                errorMessage: `Failed to create comment: ${createResult.errorMessage}`
            };
        }

        // Get final counts for both posts
        const targetFinal = await getPostCommentCount(page, targetPostId);
        const otherFinal = await getPostCommentCount(page, otherPostId);

        if (!targetFinal.success || !otherFinal.success) {
            return {
                success: false,
                errorMessage: 'Failed to get final counts'
            };
        }

        return {
            success: true,
            targetInitialCount: targetInitial.commentCount,
            targetFinalCount: targetFinal.commentCount,
            otherInitialCount: otherInitial.commentCount,
            otherFinalCount: otherFinal.commentCount,
            targetIncremented: targetFinal.commentCount === targetInitial.commentCount + 1,
            otherUnchanged: otherFinal.commentCount === otherInitial.commentCount
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performUpdateCommentCountAction,
    getPostCommentCount,
    createMultipleCommentsAndVerifyCount,
    verifyCommentCountIsolation,
    // Re-export dependency helpers for convenience
    performCreateCommentRecordAction,
    getPostDetails,
    createParentComment,
    createTestPostForComment
};
