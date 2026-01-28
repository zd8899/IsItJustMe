/**
 * Validate Vote Input Action
 *
 * Handles vote API requests with various validation scenarios.
 * Tests the Zod validation schema for vote values (+1 or -1 only).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.targetType - 'post' or 'comment'
 * @param {string} context.postId - Post ID for post votes
 * @param {string} context.commentId - Comment ID for comment votes
 * @param {number|string} context.value - Vote value to send
 * @param {boolean} context.omitValue - If true, omit the value field entirely
 * @param {string} context.anonymousId - Anonymous ID for the voter
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, voteId }
 */
async function performValidateVoteInputAction(page, context = {}) {
    try {
        const {
            mode,
            targetType,
            postId,
            commentId,
            value,
            omitValue,
            anonymousId
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api' || !mode) {
            // Determine endpoint based on target type
            const endpoint = targetType === 'comment'
                ? '/api/trpc/vote.castCommentVote'
                : '/api/trpc/vote.castPostVote';

            // Build request data based on target type
            let requestData = {};

            if (targetType === 'comment') {
                requestData.commentId = commentId;
            } else {
                requestData.postId = postId;
            }

            // Add value unless explicitly omitted
            if (!omitValue) {
                requestData.value = value;
            }

            // Add anonymousId if provided
            if (anonymousId) {
                requestData.anonymousId = anonymousId;
            }

            const response = await page.request.post(endpoint, {
                data: {
                    json: requestData
                }
            });

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
                // tRPC error format: { error: { json: { message, code, data } } }
                // or Zod validation error: { error: { json: { message, data: { zodError } } } }
                const zodError = body?.error?.json?.data?.zodError;
                if (zodError && zodError.fieldErrors) {
                    // Get first field error
                    const fieldErrors = Object.values(zodError.fieldErrors);
                    if (fieldErrors.length > 0 && Array.isArray(fieldErrors[0]) && fieldErrors[0].length > 0) {
                        errorMessage = fieldErrors[0][0];
                    }
                }
                if (!errorMessage) {
                    errorMessage = body?.error?.json?.message || body?.error?.message || 'Vote request failed';
                }
            }

            // Extract vote data from successful response
            const voteData = body?.result?.data?.json || body?.result?.data || null;

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                voteId: voteData?.id || null,
                voteValue: voteData?.value,
                postId: voteData?.postId || null,
                commentId: voteData?.commentId || null,
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
 * Helper to create a test post for voting tests
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, postId, anonymousId }
 */
async function createTestPostForVoting(page) {
    try {
        // First get a category
        const categoryResult = await getOrCreateTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        const anonymousId = `anon_vote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create a post via REST API
        const response = await page.request.post('/api/posts', {
            data: {
                frustration: `Test post for voting ${Date.now()}`,
                identity: `a voter tester`,
                categoryId: categoryResult.categoryId,
                anonymousId: anonymousId
            }
        });

        if (!response.ok()) {
            const body = await response.json().catch(() => ({}));
            return { success: false, errorMessage: body?.error || 'Failed to create test post' };
        }

        const postData = await response.json();

        return {
            success: true,
            postId: postData.id,
            anonymousId: anonymousId
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test comment for voting tests
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, commentId, postId, anonymousId }
 */
async function createTestCommentForVoting(page) {
    try {
        // First create a post
        const postResult = await createTestPostForVoting(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        const anonymousId = `anon_comment_vote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create a comment via REST API
        const response = await page.request.post('/api/comments', {
            data: {
                content: `Test comment for voting ${Date.now()}`,
                postId: postResult.postId,
                anonymousId: anonymousId
            }
        });

        if (!response.ok()) {
            const body = await response.json().catch(() => ({}));
            return { success: false, errorMessage: body?.error || 'Failed to create test comment' };
        }

        const commentData = await response.json();

        return {
            success: true,
            commentId: commentData.id,
            postId: postResult.postId,
            anonymousId: anonymousId
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get or create a valid category for testing
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, categoryId, categoryName, categorySlug }
 */
async function getOrCreateTestCategory(page) {
    try {
        // First try to get categories from REST API
        const categoriesResponse = await page.request.get('/api/categories');

        if (categoriesResponse.ok()) {
            const categories = await categoriesResponse.json();
            if (Array.isArray(categories) && categories.length > 0) {
                const category = categories[0];
                return {
                    success: true,
                    categoryId: category.id,
                    categoryName: category.name,
                    categorySlug: category.slug
                };
            }
        }

        // Try tRPC endpoint as fallback
        const listResponse = await page.request.get('/api/trpc/category.list');

        if (listResponse.ok()) {
            const listData = await listResponse.json();
            // tRPC with superjson returns data in result.data.json format
            const categories = listData?.result?.data?.json || listData?.result?.data || listData;

            if (Array.isArray(categories) && categories.length > 0) {
                const category = categories[0];
                return {
                    success: true,
                    categoryId: category.id,
                    categoryName: category.name,
                    categorySlug: category.slug
                };
            }
        }

        return { success: false, errorMessage: 'No categories found' };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to generate a unique anonymous ID for voting
 * @returns {string} - Generated anonymous ID
 */
function generateVoterAnonymousId() {
    return `voter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper to extract vote ID from action result
 * @param {Object} result - Result from performValidateVoteInputAction
 * @returns {string|null} - Vote ID or null
 */
function getVoteIdFromResult(result) {
    return result?.voteId || result?.body?.result?.data?.json?.id || null;
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performValidateVoteInputAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || null;
}

module.exports = {
    performValidateVoteInputAction,
    createTestPostForVoting,
    createTestCommentForVoting,
    getOrCreateTestCategory,
    generateVoterAnonymousId,
    getVoteIdFromResult,
    getErrorFromResult
};
