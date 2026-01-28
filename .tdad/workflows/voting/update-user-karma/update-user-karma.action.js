const { performUpdatePostScoreAction, createTestUserWithAuth, generateVoterAnonymousId, getPostVoteCounts, getCommentVoteCounts, castInitialVote } = require('../update-post-score/update-post-score.action.js');
const { performCreateVoteRecordAction, getOrCreateTestCategory } = require('../create-vote-record/create-vote-record.action.js');

/**
 * Update User Karma Action
 *
 * Casts a vote on a post or comment and verifies the author's karma is correctly updated.
 * Karma = sum of all upvotes - downvotes received on user's posts and comments.
 * Only registered users (with userId) have karma tracked.
 * Anonymous content has no author to credit karma to.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.targetType - 'post' or 'comment'
 * @param {string} context.postId - Post ID for post votes (optional if commentId provided)
 * @param {string} context.commentId - Comment ID for comment votes (optional if postId provided)
 * @param {number} context.value - Vote value (+1 or -1)
 * @param {string} context.voterAnonymousId - Anonymous ID for the voter
 * @param {string} context.voterAuthToken - Auth token for authenticated voter
 * @param {string} context.authorUserId - The author's user ID (to verify karma)
 * @param {number} context.expectedKarma - Expected karma value after the vote
 * @returns {Promise<Object>} - Returns { success, statusCode, body, authorKarma, errorMessage }
 */
async function performUpdateUserKarmaAction(page, context = {}) {
    try {
        const {
            mode,
            targetType,
            postId,
            commentId,
            value,
            voterAnonymousId,
            voterAuthToken,
            authorUserId,
            expectedKarma
        } = context;

        // ==========================================
        // API MODE - Cast vote and verify karma update
        // ==========================================
        if (mode === 'api' || !mode) {
            // Cast the vote
            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType,
                postId,
                commentId,
                value,
                anonymousId: voterAnonymousId,
                authToken: voterAuthToken
            });

            if (!voteResult.success) {
                return {
                    success: false,
                    statusCode: voteResult.statusCode,
                    body: voteResult.body,
                    errorMessage: voteResult.errorMessage
                };
            }

            // Get author karma if author exists
            let authorKarma = null;
            if (authorUserId) {
                const karmaResult = await getUserKarma(page, authorUserId);
                if (karmaResult.success) {
                    authorKarma = karmaResult.karma;
                }
            }

            return {
                success: true,
                statusCode: voteResult.statusCode,
                body: voteResult.body,
                authorKarma: authorKarma,
                voteAction: voteResult.action,
                errorMessage: null
            };
        }

        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get user karma via API
 * @param {Object} page - Playwright page object
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Returns { success, karma, statusCode, body, errorMessage }
 */
async function getUserKarma(page, userId) {
    try {
        const response = await page.request.get(
            `/api/trpc/user.getKarma?input=${encodeURIComponent(JSON.stringify({ json: { userId } }))}`
        );

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        if (!response.ok()) {
            return {
                success: false,
                statusCode: status,
                body,
                karma: null,
                errorMessage: body?.error?.json?.message || 'Failed to get user karma'
            };
        }

        // tRPC with superjson returns data in result.data.json format
        const karma = body?.result?.data?.json ?? body?.result?.data ?? body;

        return {
            success: true,
            statusCode: status,
            body,
            karma: karma,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, karma: null, errorMessage: error.message };
    }
}

/**
 * Create a test user with specific initial karma
 * @param {Object} page - Playwright page object
 * @param {number} initialKarma - Initial karma value (default: 0)
 * @returns {Promise<Object>} - Returns { success, userId, username, authToken, karma, errorMessage }
 */
async function createTestUserWithKarma(page, initialKarma = 0) {
    try {
        // Create user via registration API
        const userResult = await createTestUserWithAuth(page);
        if (!userResult.success) {
            return { success: false, errorMessage: userResult.errorMessage };
        }

        // If initial karma is non-zero, we need to update it
        // Since there's no direct API to set karma, we'd need to simulate votes
        // For simplicity, we'll return the user and handle karma setup separately
        // Note: In a real scenario, you'd need a test endpoint to set karma directly

        return {
            success: true,
            userId: userResult.userId,
            username: userResult.username,
            authToken: userResult.authToken,
            karma: 0, // New users start with 0 karma
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a post with a registered user as author
 * @param {Object} page - Playwright page object
 * @param {string} authToken - Auth token for the author
 * @param {string} userId - User ID of the author
 * @returns {Promise<Object>} - Returns { success, postId, userId, errorMessage }
 */
async function createPostWithAuthor(page, authToken, userId) {
    try {
        // Get a category first
        const categoryResult = await getOrCreateTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        // Create post via tRPC with auth token
        const response = await page.request.post('/api/trpc/post.create', {
            data: {
                json: {
                    frustration: `Test post for karma ${Date.now()}`,
                    identity: 'a karma tester',
                    categoryId: categoryResult.categoryId
                }
            },
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        if (!response.ok()) {
            return {
                success: false,
                statusCode: status,
                body,
                errorMessage: body?.error?.json?.message || 'Failed to create post with author'
            };
        }

        const postData = body?.result?.data?.json || body?.result?.data || body;

        return {
            success: true,
            postId: postData.id,
            userId: postData.userId || userId,
            statusCode: status,
            body,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a comment with a registered user as author
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to comment on
 * @param {string} userId - User ID of the author
 * @returns {Promise<Object>} - Returns { success, commentId, postId, userId, errorMessage }
 */
async function createCommentWithAuthor(page, postId, userId) {
    try {
        // Create comment via REST API with userId
        const response = await page.request.post('/api/comments', {
            data: {
                content: `Test comment for karma ${Date.now()}`,
                postId: postId,
                userId: userId
            }
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        if (!response.ok()) {
            return {
                success: false,
                statusCode: status,
                body,
                errorMessage: body?.error || 'Failed to create comment with author'
            };
        }

        return {
            success: true,
            commentId: body.id,
            postId: postId,
            userId: userId,
            statusCode: status,
            body,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create an anonymous post (no author)
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, postId, anonymousId, errorMessage }
 */
async function createAnonymousPost(page) {
    try {
        // Get a category first
        const categoryResult = await getOrCreateTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create post via REST API (anonymous)
        const response = await page.request.post('/api/posts', {
            data: {
                frustration: `Anonymous test post ${Date.now()}`,
                identity: 'an anonymous user',
                categoryId: categoryResult.categoryId,
                anonymousId: anonymousId
            }
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        if (!response.ok()) {
            return {
                success: false,
                statusCode: status,
                body,
                errorMessage: body?.error || 'Failed to create anonymous post'
            };
        }

        return {
            success: true,
            postId: body.id,
            anonymousId: anonymousId,
            statusCode: status,
            body,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create an anonymous comment (no author)
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to comment on
 * @returns {Promise<Object>} - Returns { success, commentId, postId, anonymousId, errorMessage }
 */
async function createAnonymousComment(page, postId) {
    try {
        const anonymousId = `anon_comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const response = await page.request.post('/api/comments', {
            data: {
                content: `Anonymous test comment ${Date.now()}`,
                postId: postId,
                anonymousId: anonymousId
            }
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        if (!response.ok()) {
            return {
                success: false,
                statusCode: status,
                body,
                errorMessage: body?.error || 'Failed to create anonymous comment'
            };
        }

        return {
            success: true,
            commentId: body.id,
            postId: postId,
            anonymousId: anonymousId,
            statusCode: status,
            body,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a post with author and specific initial karma
 * Creates an author user, optionally adds votes to set karma, then creates a post
 * @param {Object} page - Playwright page object
 * @param {number} targetKarma - Target karma value (achieved through votes on other content)
 * @param {number} targetPostScore - Target post score
 * @returns {Promise<Object>} - Returns { success, postId, authorUserId, authorKarma, errorMessage }
 */
async function setupPostWithAuthorKarma(page, targetKarma = 0, targetPostScore = 0) {
    try {
        // Create author user
        const authorResult = await createTestUserWithKarma(page, 0);
        if (!authorResult.success) {
            return { success: false, errorMessage: `Failed to create author: ${authorResult.errorMessage}` };
        }

        // First create an anonymous post to get a postId for creating the main post
        const categoryResult = await getOrCreateTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        // Create comment with author (we can set userId directly on comments)
        // For now, create a simple post and then we'll cast votes to set karma
        const anonPost = await createAnonymousPost(page);
        if (!anonPost.success) {
            return { success: false, errorMessage: `Failed to create post: ${anonPost.errorMessage}` };
        }

        // Create a comment by the author (so we can adjust karma via votes on it)
        const commentResult = await createCommentWithAuthor(page, anonPost.postId, authorResult.userId);
        if (!commentResult.success) {
            return { success: false, errorMessage: `Failed to create author comment: ${commentResult.errorMessage}` };
        }

        // Build up author's karma by having others vote on their comment
        if (targetKarma > 0) {
            for (let i = 0; i < targetKarma; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: commentResult.commentId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        } else if (targetKarma < 0) {
            for (let i = 0; i < Math.abs(targetKarma); i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: commentResult.commentId,
                    value: -1,
                    anonymousId: voterId
                });
            }
        }

        // Now create another comment that will be the target for voting in the test
        const targetComment = await createCommentWithAuthor(page, anonPost.postId, authorResult.userId);
        if (!targetComment.success) {
            return { success: false, errorMessage: `Failed to create target comment: ${targetComment.errorMessage}` };
        }

        // Add votes to achieve target score on the target comment
        if (targetPostScore > 0) {
            for (let i = 0; i < targetPostScore; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: targetComment.commentId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        } else if (targetPostScore < 0) {
            for (let i = 0; i < Math.abs(targetPostScore); i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: targetComment.commentId,
                    value: -1,
                    anonymousId: voterId
                });
            }
        }

        // Verify karma
        const karmaResult = await getUserKarma(page, authorResult.userId);

        return {
            success: true,
            postId: anonPost.postId,
            commentId: targetComment.commentId,
            authorUserId: authorResult.userId,
            authorAuthToken: authorResult.authToken,
            authorKarma: karmaResult.success ? karmaResult.karma : targetKarma + targetPostScore,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a comment with author and specific initial karma
 * @param {Object} page - Playwright page object
 * @param {number} targetKarma - Target karma value
 * @param {number} targetCommentScore - Target comment score
 * @returns {Promise<Object>} - Returns { success, commentId, postId, authorUserId, authorKarma, errorMessage }
 */
async function setupCommentWithAuthorKarma(page, targetKarma = 0, targetCommentScore = 0) {
    try {
        // Create author user
        const authorResult = await createTestUserWithKarma(page, 0);
        if (!authorResult.success) {
            return { success: false, errorMessage: `Failed to create author: ${authorResult.errorMessage}` };
        }

        // Create a post to host the comments
        const postResult = await createAnonymousPost(page);
        if (!postResult.success) {
            return { success: false, errorMessage: `Failed to create post: ${postResult.errorMessage}` };
        }

        // If we need non-zero initial karma, create another comment and vote on it
        if (targetKarma !== 0) {
            const karmaComment = await createCommentWithAuthor(page, postResult.postId, authorResult.userId);
            if (!karmaComment.success) {
                return { success: false, errorMessage: `Failed to create karma comment: ${karmaComment.errorMessage}` };
            }

            if (targetKarma > 0) {
                for (let i = 0; i < targetKarma; i++) {
                    const voterId = generateVoterAnonymousId();
                    await castInitialVote(page, {
                        targetType: 'comment',
                        commentId: karmaComment.commentId,
                        value: 1,
                        anonymousId: voterId
                    });
                }
            } else {
                for (let i = 0; i < Math.abs(targetKarma); i++) {
                    const voterId = generateVoterAnonymousId();
                    await castInitialVote(page, {
                        targetType: 'comment',
                        commentId: karmaComment.commentId,
                        value: -1,
                        anonymousId: voterId
                    });
                }
            }
        }

        // Create the target comment for the test
        const targetComment = await createCommentWithAuthor(page, postResult.postId, authorResult.userId);
        if (!targetComment.success) {
            return { success: false, errorMessage: `Failed to create target comment: ${targetComment.errorMessage}` };
        }

        // Add votes to achieve target score
        if (targetCommentScore > 0) {
            for (let i = 0; i < targetCommentScore; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: targetComment.commentId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        } else if (targetCommentScore < 0) {
            for (let i = 0; i < Math.abs(targetCommentScore); i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: targetComment.commentId,
                    value: -1,
                    anonymousId: voterId
                });
            }
        }

        // Verify karma
        const karmaResult = await getUserKarma(page, authorResult.userId);

        return {
            success: true,
            commentId: targetComment.commentId,
            postId: postResult.postId,
            authorUserId: authorResult.userId,
            authorAuthToken: authorResult.authToken,
            authorKarma: karmaResult.success ? karmaResult.karma : targetKarma + targetCommentScore,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a comment with an existing vote from a specific voter
 * @param {Object} page - Playwright page object
 * @param {number} targetKarma - Target karma value for author
 * @param {number} targetCommentScore - Target comment score
 * @param {number} existingVoteValue - Existing vote value (1 or -1)
 * @returns {Promise<Object>} - Returns { success, commentId, postId, authorUserId, voterAnonymousId, authorKarma, errorMessage }
 */
async function setupCommentWithExistingVote(page, targetKarma = 0, targetCommentScore = 0, existingVoteValue = 1) {
    try {
        // Create author user
        const authorResult = await createTestUserWithKarma(page, 0);
        if (!authorResult.success) {
            return { success: false, errorMessage: `Failed to create author: ${authorResult.errorMessage}` };
        }

        // Create a post to host the comments
        const postResult = await createAnonymousPost(page);
        if (!postResult.success) {
            return { success: false, errorMessage: `Failed to create post: ${postResult.errorMessage}` };
        }

        // Calculate how many additional votes we need besides the main voter's vote
        // The target score includes the voter's existing vote
        // For upvote: score = adjustedUpvotes + 1, so adjustedUpvotes = score - 1
        // For downvote: score = adjustedUpvotes - 1, so adjustedUpvotes = score + 1
        const adjustedUpvotes = existingVoteValue === 1 ? targetCommentScore - 1 : targetCommentScore + 1;
        const adjustedDownvotes = existingVoteValue === -1 ? 0 : 0;

        // Calculate additional karma needed (excluding target comment score)
        const additionalKarma = targetKarma - targetCommentScore;

        // If we need additional karma, create another comment and vote on it
        if (additionalKarma !== 0) {
            const karmaComment = await createCommentWithAuthor(page, postResult.postId, authorResult.userId);
            if (!karmaComment.success) {
                return { success: false, errorMessage: `Failed to create karma comment: ${karmaComment.errorMessage}` };
            }

            if (additionalKarma > 0) {
                for (let i = 0; i < additionalKarma; i++) {
                    const voterId = generateVoterAnonymousId();
                    await castInitialVote(page, {
                        targetType: 'comment',
                        commentId: karmaComment.commentId,
                        value: 1,
                        anonymousId: voterId
                    });
                }
            } else {
                for (let i = 0; i < Math.abs(additionalKarma); i++) {
                    const voterId = generateVoterAnonymousId();
                    await castInitialVote(page, {
                        targetType: 'comment',
                        commentId: karmaComment.commentId,
                        value: -1,
                        anonymousId: voterId
                    });
                }
            }
        }

        // Create the target comment for the test
        const targetComment = await createCommentWithAuthor(page, postResult.postId, authorResult.userId);
        if (!targetComment.success) {
            return { success: false, errorMessage: `Failed to create target comment: ${targetComment.errorMessage}` };
        }

        // Add other votes to achieve target score (excluding the main voter's vote)
        if (adjustedUpvotes > 0) {
            for (let i = 0; i < adjustedUpvotes; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: targetComment.commentId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        }

        // Cast the main voter's existing vote
        const voterAnonymousId = generateVoterAnonymousId();
        const voterVoteResult = await castInitialVote(page, {
            targetType: 'comment',
            commentId: targetComment.commentId,
            value: existingVoteValue,
            anonymousId: voterAnonymousId
        });

        if (!voterVoteResult.success) {
            return { success: false, errorMessage: `Failed to cast voter's existing vote: ${voterVoteResult.errorMessage}` };
        }

        // Verify karma
        const karmaResult = await getUserKarma(page, authorResult.userId);

        return {
            success: true,
            commentId: targetComment.commentId,
            postId: postResult.postId,
            authorUserId: authorResult.userId,
            authorAuthToken: authorResult.authToken,
            voterAnonymousId: voterAnonymousId,
            authorKarma: karmaResult.success ? karmaResult.karma : targetKarma,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Cast a vote and return the author's updated karma
 * @param {Object} page - Playwright page object
 * @param {Object} options - Vote options
 * @param {string} options.targetType - 'post' or 'comment'
 * @param {string} options.postId - Post ID (for post votes)
 * @param {string} options.commentId - Comment ID (for comment votes)
 * @param {number} options.value - Vote value (+1 or -1)
 * @param {string} options.voterAnonymousId - Voter's anonymous ID
 * @param {string} options.voterAuthToken - Voter's auth token (for authenticated votes)
 * @param {string} options.authorUserId - Author's user ID (to check karma)
 * @returns {Promise<Object>} - Returns { success, statusCode, authorKarma, voteAction, errorMessage }
 */
async function castVoteAndGetAuthorKarma(page, options = {}) {
    try {
        const {
            targetType,
            postId,
            commentId,
            value,
            voterAnonymousId,
            voterAuthToken,
            authorUserId
        } = options;

        // Cast the vote
        const voteResult = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType,
            postId,
            commentId,
            value,
            anonymousId: voterAnonymousId,
            authToken: voterAuthToken
        });

        if (!voteResult.success) {
            return {
                success: false,
                statusCode: voteResult.statusCode,
                authorKarma: null,
                voteAction: null,
                errorMessage: voteResult.errorMessage
            };
        }

        // Get author karma
        let authorKarma = null;
        if (authorUserId) {
            const karmaResult = await getUserKarma(page, authorUserId);
            authorKarma = karmaResult.success ? karmaResult.karma : null;
        }

        return {
            success: true,
            statusCode: voteResult.statusCode,
            authorKarma: authorKarma,
            voteAction: voteResult.action,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, authorKarma: null, errorMessage: error.message };
    }
}

/**
 * Helper to get karma from result
 * @param {Object} result - Result from action
 * @returns {number|null} - Karma value or null
 */
function getKarmaFromResult(result) {
    return result?.authorKarma ?? null;
}

module.exports = {
    performUpdateUserKarmaAction,
    getUserKarma,
    createTestUserWithKarma,
    createPostWithAuthor,
    createCommentWithAuthor,
    createAnonymousPost,
    createAnonymousComment,
    setupPostWithAuthorKarma,
    setupCommentWithAuthorKarma,
    setupCommentWithExistingVote,
    castVoteAndGetAuthorKarma,
    getKarmaFromResult,
    // Re-exports for convenience
    generateVoterAnonymousId,
    castInitialVote,
    createTestUserWithAuth
};
