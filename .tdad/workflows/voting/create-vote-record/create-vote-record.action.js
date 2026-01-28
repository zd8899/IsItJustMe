const { performValidateVoteInputAction } = require('../validate-vote-input/validate-vote-input.action.js');
const { performCheckExistingVoteAction } = require('../check-existing-vote/check-existing-vote.action.js');

/**
 * Create Vote Record Action
 *
 * Handles vote creation, update, and deletion via API.
 * The API should:
 * - Create new votes if none exists
 * - Update vote if changing direction (upvote <-> downvote)
 * - Delete vote if same value is sent again (toggle off)
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.targetType - 'post' or 'comment'
 * @param {string} context.postId - Post ID for post votes
 * @param {string} context.commentId - Comment ID for comment votes
 * @param {number} context.value - Vote value (+1 or -1)
 * @param {string} context.anonymousId - Anonymous ID for the voter
 * @param {string} context.authToken - Authentication token for registered user
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, voteId, voteValue, action }
 */
async function performCreateVoteRecordAction(page, context = {}) {
    try {
        const {
            mode,
            targetType,
            postId,
            commentId,
            value,
            anonymousId,
            authToken
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

            // Add value
            requestData.value = value;

            // Add anonymousId if provided
            if (anonymousId) {
                requestData.anonymousId = anonymousId;
            }

            // Build headers
            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await page.request.post(endpoint, {
                data: {
                    json: requestData
                },
                headers: headers
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
                errorMessage = body?.error?.json?.message || body?.error?.message || 'Vote request failed';
            }

            // Extract vote data from successful response
            const voteData = body?.result?.data?.json || body?.result?.data || null;

            // Determine what action occurred based on response
            let action = null;
            if (response.ok()) {
                if (voteData?.deleted) {
                    action = 'deleted';
                } else if (voteData?.updated) {
                    action = 'updated';
                } else {
                    action = 'created';
                }
            }

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                voteId: voteData?.id || null,
                voteValue: voteData?.value,
                postId: voteData?.postId || postId,
                commentId: voteData?.commentId || commentId,
                action: action,
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
 * @returns {Promise<Object>} - Returns { success, postId, anonymousId, initialUpvotes, initialDownvotes, initialScore }
 */
async function createTestPostForVoting(page) {
    try {
        // First get a category
        const categoryResult = await getOrCreateTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        const anonymousId = `anon_post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
            anonymousId: anonymousId,
            initialUpvotes: postData.upvotes || 0,
            initialDownvotes: postData.downvotes || 0,
            initialScore: postData.score || 0
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test comment for voting tests
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, commentId, postId, anonymousId, initialUpvotes, initialDownvotes, initialScore }
 */
async function createTestCommentForVoting(page) {
    try {
        // First create a post
        const postResult = await createTestPostForVoting(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        const anonymousId = `anon_comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
            anonymousId: anonymousId,
            initialUpvotes: commentData.upvotes || 0,
            initialDownvotes: commentData.downvotes || 0,
            initialScore: commentData.score || 0
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
 * Helper to get current post details (for verifying vote counts)
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} - Returns { success, upvotes, downvotes, score, errorMessage }
 */
async function getPostVoteCounts(page, postId) {
    try {
        const response = await page.request.get(`/api/trpc/post.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: postId } }))}`);

        if (!response.ok()) {
            return { success: false, errorMessage: 'Failed to get post details' };
        }

        const data = await response.json();
        const post = data?.result?.data?.json || data?.result?.data || data;

        return {
            success: true,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            score: post.score
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get current comment details (for verifying vote counts)
 * @param {Object} page - Playwright page object
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} - Returns { success, upvotes, downvotes, score, errorMessage }
 */
async function getCommentVoteCounts(page, commentId) {
    try {
        const response = await page.request.get(`/api/trpc/comment.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: commentId } }))}`);

        if (!response.ok()) {
            return { success: false, errorMessage: 'Failed to get comment details' };
        }

        const data = await response.json();
        const comment = data?.result?.data?.json || data?.result?.data || data;

        return {
            success: true,
            upvotes: comment.upvotes,
            downvotes: comment.downvotes,
            score: comment.score
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to cast an initial vote (for setting up "existing vote" scenarios)
 * @param {Object} page - Playwright page object
 * @param {Object} context - Vote context (targetType, postId/commentId, value, anonymousId, authToken)
 * @returns {Promise<Object>} - Returns { success, voteId, voteValue, errorMessage }
 */
async function castInitialVote(page, context = {}) {
    const result = await performCreateVoteRecordAction(page, {
        mode: 'api',
        ...context
    });

    return {
        success: result.success,
        voteId: result.voteId,
        voteValue: result.voteValue,
        errorMessage: result.errorMessage
    };
}

/**
 * Helper to create a test user and get auth token
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, userId, username, authToken, errorMessage }
 */
async function createTestUserWithAuth(page) {
    try {
        const username = `user_${Date.now().toString().slice(-6)}`;
        const password = 'TestPass123!';

        // Register user
        const registerResponse = await page.request.post('/api/auth/register', {
            data: { username, password }
        });

        if (!registerResponse.ok()) {
            const body = await registerResponse.json().catch(() => ({}));
            return { success: false, errorMessage: body?.error || 'Failed to create test user' };
        }

        const registerData = await registerResponse.json();

        // Login to get token
        const loginResponse = await page.request.post('/api/auth/login', {
            data: { username, password }
        });

        if (!loginResponse.ok()) {
            return {
                success: true,
                userId: registerData.userId || registerData.id,
                username: username,
                authToken: null,
                errorMessage: 'User created but login failed'
            };
        }

        const loginData = await loginResponse.json();

        return {
            success: true,
            userId: registerData.userId || registerData.id,
            username: username,
            authToken: loginData.token || null,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract vote ID from action result
 * @param {Object} result - Result from performCreateVoteRecordAction
 * @returns {string|null} - Vote ID or null
 */
function getVoteIdFromResult(result) {
    return result?.voteId || result?.body?.result?.data?.json?.id || null;
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performCreateVoteRecordAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || null;
}

module.exports = {
    performCreateVoteRecordAction,
    createTestPostForVoting,
    createTestCommentForVoting,
    getOrCreateTestCategory,
    generateVoterAnonymousId,
    getPostVoteCounts,
    getCommentVoteCounts,
    castInitialVote,
    createTestUserWithAuth,
    getVoteIdFromResult,
    getErrorFromResult
};
