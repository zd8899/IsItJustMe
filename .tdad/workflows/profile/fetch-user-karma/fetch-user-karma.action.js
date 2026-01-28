/**
 * Fetch User Karma Action
 *
 * Queries user karma data from the database via the user.getKarma tRPC endpoint.
 * Returns karma breakdown including postKarma, commentKarma, and totalKarma.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.userId - The user ID to fetch karma for
 * @param {string} context.authToken - JWT token for authenticated requests
 * @param {boolean} context.unauthenticated - If true, make unauthenticated request (no token)
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, postKarma, commentKarma, totalKarma }
 */
async function performFetchUserKarmaAction(page, context = {}) {
    try {
        const { mode, userId, authToken, unauthenticated } = context;

        // ==========================================
        // API MODE - Direct HTTP request via tRPC
        // ==========================================
        if (mode === 'api' || !mode) {
            // Build URL with encoded input parameter
            const inputParams = { userId: userId || '' };
            const encodedInput = encodeURIComponent(JSON.stringify({ json: inputParams }));
            const url = `/api/trpc/user.getKarma?input=${encodedInput}`;

            // Build request options
            const requestOptions = {};

            // Add Authorization header if authenticated (not explicitly unauthenticated)
            if (!unauthenticated && authToken) {
                requestOptions.headers = {
                    'Authorization': `Bearer ${authToken}`
                };
            }

            const response = await page.request.get(url, requestOptions);

            const status = response.status();
            let body = null;

            try {
                body = await response.json();
            } catch (e) {
                body = await response.text();
            }

            // Extract error information from tRPC error response
            let errorMessage = null;
            let errorCode = null;
            if (!response.ok()) {
                errorCode = body?.error?.json?.data?.code || body?.error?.json?.code || null;
                const zodError = body?.error?.json?.data?.zodError;
                if (zodError && zodError.fieldErrors) {
                    const fieldErrors = Object.values(zodError.fieldErrors);
                    if (fieldErrors.length > 0 && Array.isArray(fieldErrors[0]) && fieldErrors[0].length > 0) {
                        errorMessage = fieldErrors[0][0];
                    }
                }
                if (!errorMessage) {
                    errorMessage = body?.error?.json?.message || body?.error?.message || 'Fetch user karma failed';
                }
            }

            // Extract karma data from successful response
            // tRPC with superjson returns data in result.data.json format
            const resultData = body?.result?.data;
            let karmaData = resultData && typeof resultData === 'object' && 'json' in resultData
                ? resultData.json
                : (resultData ?? null);

            // If karmaData is a number (current implementation returns just karma)
            // wrap it to match expected structure
            if (typeof karmaData === 'number') {
                karmaData = {
                    totalKarma: karmaData,
                    postKarma: null,
                    commentKarma: null
                };
            }

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                postKarma: karmaData?.postKarma ?? null,
                commentKarma: karmaData?.commentKarma ?? null,
                totalKarma: karmaData?.totalKarma ?? karmaData ?? null,
                errorMessage: errorMessage,
                errorCode: errorCode
            };
        }

        // No UI mode for this action - it's API only
        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a unique test user via API
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Prefix for username (default: 'karma')
 * @param {string} password - Password for the user (default: 'TestPassword123!')
 * @returns {Promise<Object>} - Registration result with user data
 */
async function createTestUser(page, prefix = 'karma', password = 'TestPassword123!') {
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
        password: password,
        errorMessage: !response.ok() ? (body?.error || body?.message || 'Registration failed') : null
    };
}

/**
 * Helper to login and get auth token
 * @param {Object} page - Playwright page object
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 * @returns {Promise<Object>} - Login result with token
 */
async function loginUser(page, username, password) {
    const response = await page.request.post('/api/auth/login', {
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
        token: body?.token || body?.accessToken || null,
        userId: body?.userId || body?.user?.id || null,
        errorMessage: !response.ok() ? (body?.error || body?.message || 'Login failed') : null
    };
}

/**
 * Generate unique username with timestamp
 * @param {string} prefix - Prefix for the username
 * @returns {string} - Unique username (max 20 chars)
 */
function generateUniqueUsername(prefix = 'karma') {
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

        const anonymousId = `anon_karma_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const postData = {
            frustration: `Test frustration for karma ${Date.now()}`,
            identity: `a karma tester`,
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
 * Helper to create a test comment
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

        const anonymousId = `anon_comment_karma_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const commentData = {
            content: `Test comment for karma ${Date.now()}`,
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
 * Helper to cast a vote on a post via tRPC
 * @param {Object} page - Playwright page object
 * @param {Object} options - Voting options
 * @param {string} options.postId - Post ID to vote on
 * @param {number} options.value - Vote value (1 for upvote, -1 for downvote)
 * @param {string} options.anonymousId - Anonymous ID for the voter
 * @returns {Promise<Object>} - Returns { success, voteId, errorMessage }
 */
async function castPostVote(page, options = {}) {
    try {
        const { postId, value, anonymousId } = options;

        if (!postId) {
            return { success: false, errorMessage: 'postId is required to cast vote' };
        }

        const voterAnonId = anonymousId || `voter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Use tRPC mutation endpoint
        const inputData = {
            postId: postId,
            value: value || 1,
            anonymousId: voterAnonId
        };

        const response = await page.request.post('/api/trpc/vote.castPostVote', {
            data: { json: inputData }
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        // Extract result from tRPC response
        const resultData = body?.result?.data;
        const voteData = resultData && typeof resultData === 'object' && 'json' in resultData
            ? resultData.json
            : resultData;

        return {
            success: response.ok(),
            statusCode: status,
            voteId: voteData?.id || null,
            errorMessage: !response.ok() ? (body?.error?.json?.message || 'Vote failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to cast a vote on a comment via tRPC
 * @param {Object} page - Playwright page object
 * @param {Object} options - Voting options
 * @param {string} options.commentId - Comment ID to vote on
 * @param {number} options.value - Vote value (1 for upvote, -1 for downvote)
 * @param {string} options.anonymousId - Anonymous ID for the voter
 * @returns {Promise<Object>} - Returns { success, voteId, errorMessage }
 */
async function castCommentVote(page, options = {}) {
    try {
        const { commentId, value, anonymousId } = options;

        if (!commentId) {
            return { success: false, errorMessage: 'commentId is required to cast vote' };
        }

        const voterAnonId = anonymousId || `voter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Use tRPC mutation endpoint
        const inputData = {
            commentId: commentId,
            value: value || 1,
            anonymousId: voterAnonId
        };

        const response = await page.request.post('/api/trpc/vote.castCommentVote', {
            data: { json: inputData }
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        // Extract result from tRPC response
        const resultData = body?.result?.data;
        const voteData = resultData && typeof resultData === 'object' && 'json' in resultData
            ? resultData.json
            : resultData;

        return {
            success: response.ok(),
            statusCode: status,
            voteId: voteData?.id || null,
            errorMessage: !response.ok() ? (body?.error?.json?.message || 'Vote failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to cast multiple votes on a post
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to vote on
 * @param {number} upvoteCount - Number of upvotes to cast
 * @param {number} downvoteCount - Number of downvotes to cast
 * @returns {Promise<Object>} - Returns { success, upvotes, downvotes, errorMessage }
 */
async function castMultiplePostVotes(page, postId, upvoteCount = 0, downvoteCount = 0) {
    let upvotesCreated = 0;
    let downvotesCreated = 0;

    // Cast upvotes
    for (let i = 0; i < upvoteCount; i++) {
        const result = await castPostVote(page, {
            postId: postId,
            value: 1,
            anonymousId: `upvoter_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`
        });
        if (result.success) upvotesCreated++;
    }

    // Cast downvotes
    for (let i = 0; i < downvoteCount; i++) {
        const result = await castPostVote(page, {
            postId: postId,
            value: -1,
            anonymousId: `downvoter_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`
        });
        if (result.success) downvotesCreated++;
    }

    return {
        success: upvotesCreated === upvoteCount && downvotesCreated === downvoteCount,
        upvotes: upvotesCreated,
        downvotes: downvotesCreated,
        errorMessage: null
    };
}

/**
 * Helper to cast multiple votes on a comment
 * @param {Object} page - Playwright page object
 * @param {string} commentId - Comment ID to vote on
 * @param {number} upvoteCount - Number of upvotes to cast
 * @param {number} downvoteCount - Number of downvotes to cast
 * @returns {Promise<Object>} - Returns { success, upvotes, downvotes, errorMessage }
 */
async function castMultipleCommentVotes(page, commentId, upvoteCount = 0, downvoteCount = 0) {
    let upvotesCreated = 0;
    let downvotesCreated = 0;

    // Cast upvotes
    for (let i = 0; i < upvoteCount; i++) {
        const result = await castCommentVote(page, {
            commentId: commentId,
            value: 1,
            anonymousId: `cupvoter_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`
        });
        if (result.success) upvotesCreated++;
    }

    // Cast downvotes
    for (let i = 0; i < downvoteCount; i++) {
        const result = await castCommentVote(page, {
            commentId: commentId,
            value: -1,
            anonymousId: `cdownvoter_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`
        });
        if (result.success) downvotesCreated++;
    }

    return {
        success: upvotesCreated === upvoteCount && downvotesCreated === downvoteCount,
        upvotes: upvotesCreated,
        downvotes: downvotesCreated,
        errorMessage: null
    };
}

/**
 * Helper to get karma values from result
 * @param {Object} result - Result from performFetchUserKarmaAction
 * @returns {Object} - { postKarma, commentKarma, totalKarma }
 */
function getKarmaFromResult(result) {
    return {
        postKarma: result?.postKarma ?? null,
        commentKarma: result?.commentKarma ?? null,
        totalKarma: result?.totalKarma ?? null
    };
}

/**
 * Helper to check if response indicates unauthorized error
 * @param {Object} result - Result from performFetchUserKarmaAction
 * @returns {boolean} - True if unauthorized error
 */
function isUnauthorizedError(result) {
    return result?.statusCode === 401 || result?.errorCode === 'UNAUTHORIZED';
}

/**
 * Helper to get error message from result
 * @param {Object} result - Result from performFetchUserKarmaAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.errorCode || null;
}

module.exports = {
    performFetchUserKarmaAction,
    createTestUser,
    loginUser,
    generateUniqueUsername,
    createTestPost,
    createTestComment,
    castPostVote,
    castCommentVote,
    castMultiplePostVotes,
    castMultipleCommentVotes,
    getKarmaFromResult,
    isUnauthorizedError,
    getErrorFromResult
};
