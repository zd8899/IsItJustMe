/**
 * Fetch Comments By Post Action
 *
 * Retrieves comments for a specific post from the API.
 * Supports API testing for fetching comments including vote counts and nested replies.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.postId - The post ID to fetch comments for
 * @param {boolean} context.invalidFormat - If true, use an invalid ID format
 * @param {boolean} context.nonExistent - If true, use a non-existent but valid format ID
 * @param {boolean} context.missingPostId - If true, omit the postId parameter
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, comments, ... }
 */
async function performFetchCommentsByPostAction(page, context = {}) {
    try {
        const { mode, postId, invalidFormat, nonExistent, missingPostId } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            let url = '/api/comments';

            if (missingPostId) {
                // Don't add postId parameter
            } else if (invalidFormat) {
                // Use an obviously invalid ID format (not CUID)
                url = '/api/comments?postId=invalid-id-!@%23%24%25';
            } else if (nonExistent) {
                // Use a valid CUID format that doesn't exist
                url = '/api/comments?postId=clxyz123nonexistent456';
            } else if (postId) {
                url = `/api/comments?postId=${postId}`;
            }

            const response = await page.request.get(url);

            const status = response.status();
            let body = null;

            try {
                body = await response.json();
            } catch (e) {
                body = await response.text();
            }

            // Parse comments from response
            const comments = Array.isArray(body) ? body : (body?.comments || []);

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                comments: comments,
                commentCount: comments.length,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Fetch failed') : null
            };
        }

        // ==========================================
        // Default/UI MODE - Not implemented for this action
        // ==========================================
        return { success: false, errorMessage: 'UI mode not implemented for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test post for comment fetching
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the post
 * @param {string} options.categoryId - Category ID (required)
 * @param {string} options.frustration - Custom frustration text (optional)
 * @param {string} options.identity - Custom identity text (optional)
 * @returns {Promise<Object>} - Returns { success, postId, frustration, identity, categoryId, errorMessage }
 */
async function createTestPost(page, options = {}) {
    try {
        const { categoryId, frustration, identity } = options;

        if (!categoryId) {
            return { success: false, errorMessage: 'categoryId is required to create a test post' };
        }

        const postData = {
            frustration: frustration || `Test frustration for comments ${Date.now()}`,
            identity: identity || `TestUser_${Date.now()}`,
            categoryId: categoryId
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
            frustration: body?.frustration || postData.frustration,
            identity: body?.identity || postData.identity,
            categoryId: body?.categoryId || categoryId,
            createdAt: body?.createdAt || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Post creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a comment on a post
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the comment
 * @param {string} options.postId - Post ID to comment on (required)
 * @param {string} options.content - Comment content (optional, defaults to unique content)
 * @param {string} options.parentId - Parent comment ID for replies (optional)
 * @returns {Promise<Object>} - Returns { success, commentId, content, postId, parentId, errorMessage }
 */
async function createTestComment(page, options = {}) {
    try {
        const { postId, content, parentId } = options;

        if (!postId) {
            return { success: false, errorMessage: 'postId is required to create a comment' };
        }

        const commentData = {
            postId: postId,
            content: content || `Test comment ${Date.now()}`
        };

        if (parentId) {
            commentData.parentId = parentId;
        }

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
            content: body?.content || commentData.content,
            postId: body?.postId || postId,
            parentId: body?.parentId || parentId || null,
            createdAt: body?.createdAt || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Comment creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get a valid category ID for creating test posts
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, categoryId, categoryName, categorySlug, errorMessage }
 */
async function getTestCategory(page) {
    try {
        const response = await page.request.get('/api/categories');

        if (!response.ok()) {
            return { success: false, errorMessage: 'Failed to fetch categories' };
        }

        const categories = await response.json();

        if (!Array.isArray(categories) || categories.length === 0) {
            return { success: false, errorMessage: 'No categories available' };
        }

        const category = categories[0];
        return {
            success: true,
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a post with comments (full setup for testing)
 * @param {Object} page - Playwright page object
 * @param {Object} options - Setup options
 * @param {number} options.commentCount - Number of comments to create (default: 2)
 * @param {boolean} options.withReplies - If true, add replies to comments
 * @returns {Promise<Object>} - Returns { success, postId, commentIds, replyIds, errorMessage }
 */
async function createPostWithComments(page, options = {}) {
    try {
        const { commentCount = 2, withReplies = false } = options;

        // Get a valid category
        const categoryResult = await getTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        // Create a test post
        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        const commentIds = [];
        const replyIds = [];

        // Create comments
        for (let i = 0; i < commentCount; i++) {
            const commentResult = await createTestComment(page, {
                postId: postResult.postId,
                content: `Test comment ${i + 1} - ${Date.now()}`
            });
            if (commentResult.success) {
                commentIds.push(commentResult.commentId);

                // Create a reply if requested
                if (withReplies && commentResult.commentId) {
                    const replyResult = await createTestComment(page, {
                        postId: postResult.postId,
                        content: `Reply to comment ${i + 1} - ${Date.now()}`,
                        parentId: commentResult.commentId
                    });
                    if (replyResult.success) {
                        replyIds.push(replyResult.commentId);
                    }
                }
            }
        }

        return {
            success: true,
            postId: postResult.postId,
            categoryId: categoryResult.categoryId,
            commentIds: commentIds,
            replyIds: replyIds,
            totalComments: commentIds.length + replyIds.length
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract comments array from fetch result
 * @param {Object} result - Result from performFetchCommentsByPostAction
 * @returns {Array} - Array of comments or empty array
 */
function getCommentsFromResult(result) {
    return result?.comments || result?.body || [];
}

/**
 * Helper to extract error from fetch result
 * @param {Object} result - Result from performFetchCommentsByPostAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

/**
 * Helper to check if a comment has expected fields
 * @param {Object} comment - A comment object
 * @returns {Object} - Object with boolean fields indicating presence of expected properties
 */
function validateCommentFields(comment) {
    return {
        hasId: comment?.id !== undefined,
        hasContent: comment?.content !== undefined,
        hasPostId: comment?.postId !== undefined,
        hasCreatedAt: comment?.createdAt !== undefined,
        hasUpvotes: comment?.upvotes !== undefined,
        hasDownvotes: comment?.downvotes !== undefined,
        hasScore: comment?.score !== undefined,
        hasReplies: comment?.replies !== undefined
    };
}

module.exports = {
    performFetchCommentsByPostAction,
    createTestPost,
    createTestComment,
    getTestCategory,
    createPostWithComments,
    getCommentsFromResult,
    getErrorFromResult,
    validateCommentFields
};
