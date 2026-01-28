const { performCreateVoteRecordAction, createTestCommentForVoting, getCommentVoteCounts, generateVoterAnonymousId, createTestUserWithAuth } = require('../create-vote-record/create-vote-record.action.js');

/**
 * Update Comment Score Action
 *
 * Tests the recalculation of comment vote totals after voting actions.
 * This action handles the complete flow of:
 * 1. Creating a test comment
 * 2. Setting up initial vote state (if needed)
 * 3. Casting the test vote
 * 4. Verifying the resulting score, upvotes, and downvotes
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and configuration
 * @param {string} context.mode - 'api' for API testing
 * @param {number} context.voteValue - Vote value to cast (+1 or -1)
 * @param {number} context.previousVoteValue - Previous vote value if testing vote change (optional)
 * @param {boolean} context.isAuthenticated - Whether user is logged in (default: false for anonymous)
 * @param {string} context.anonymousId - Anonymous ID for the voter (auto-generated if not provided)
 * @param {string} context.authToken - Auth token for authenticated user
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, commentId, upvotes, downvotes, score }
 */
async function performUpdateCommentScoreAction(page, context = {}) {
    try {
        const {
            mode = 'api',
            voteValue,
            previousVoteValue = null,
            isAuthenticated = false,
            anonymousId: providedAnonymousId,
            authToken: providedAuthToken
        } = context;

        // ==========================================
        // API MODE - Test comment score updates
        // ==========================================
        if (mode === 'api' || !mode) {
            // Step 1: Create a test comment
            const commentResult = await createTestCommentForVoting(page);
            if (!commentResult.success) {
                return { success: false, errorMessage: `Failed to create test comment: ${commentResult.errorMessage}` };
            }

            const { commentId, postId } = commentResult;

            // Step 2: Set up voter identity
            let voterAnonymousId = providedAnonymousId || generateVoterAnonymousId();
            let authToken = providedAuthToken;

            // If authenticated, create a test user
            if (isAuthenticated && !authToken) {
                const userResult = await createTestUserWithAuth(page);
                if (!userResult.success) {
                    return { success: false, errorMessage: `Failed to create test user: ${userResult.errorMessage}` };
                }
                authToken = userResult.authToken;
            }

            // Step 3: If there's a previous vote, cast it first
            if (previousVoteValue !== null) {
                const previousVoteResult = await performCreateVoteRecordAction(page, {
                    mode: 'api',
                    targetType: 'comment',
                    commentId: commentId,
                    value: previousVoteValue,
                    anonymousId: isAuthenticated ? undefined : voterAnonymousId,
                    authToken: authToken
                });

                if (!previousVoteResult.success) {
                    return {
                        success: false,
                        errorMessage: `Failed to cast previous vote: ${previousVoteResult.errorMessage}`,
                        statusCode: previousVoteResult.statusCode,
                        body: previousVoteResult.body
                    };
                }
            }

            // Step 4: Cast the test vote
            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType: 'comment',
                commentId: commentId,
                value: voteValue,
                anonymousId: isAuthenticated ? undefined : voterAnonymousId,
                authToken: authToken
            });

            if (!voteResult.success) {
                return {
                    success: false,
                    errorMessage: voteResult.errorMessage,
                    statusCode: voteResult.statusCode,
                    body: voteResult.body,
                    commentId: commentId
                };
            }

            // Step 5: Get the updated comment vote counts
            const countsResult = await getCommentVoteCounts(page, commentId);
            if (!countsResult.success) {
                return {
                    success: false,
                    errorMessage: `Failed to get comment vote counts: ${countsResult.errorMessage}`,
                    statusCode: voteResult.statusCode,
                    body: voteResult.body,
                    commentId: commentId
                };
            }

            return {
                success: true,
                statusCode: voteResult.statusCode,
                body: voteResult.body,
                commentId: commentId,
                postId: postId,
                upvotes: countsResult.upvotes,
                downvotes: countsResult.downvotes,
                score: countsResult.score,
                voteAction: voteResult.action,
                voterAnonymousId: voterAnonymousId,
                errorMessage: null
            };
        }

        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to set up a comment with specific vote counts
 * This is needed for scenarios that require starting with non-zero vote counts
 *
 * @param {Object} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {number} options.upvotesToAdd - Number of upvotes to add
 * @param {number} options.downvotesToAdd - Number of downvotes to add
 * @returns {Promise<Object>} - Returns { success, commentId, upvotes, downvotes, score, voterIds, errorMessage }
 */
async function setupCommentWithVotes(page, options = {}) {
    try {
        const { upvotesToAdd = 0, downvotesToAdd = 0 } = options;

        // Create a test comment
        const commentResult = await createTestCommentForVoting(page);
        if (!commentResult.success) {
            return { success: false, errorMessage: commentResult.errorMessage };
        }

        const { commentId, postId } = commentResult;
        const voterIds = [];

        // Add upvotes
        for (let i = 0; i < upvotesToAdd; i++) {
            const voterId = generateVoterAnonymousId();
            voterIds.push({ id: voterId, value: 1 });

            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType: 'comment',
                commentId: commentId,
                value: 1,
                anonymousId: voterId
            });

            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to add upvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Add downvotes
        for (let i = 0; i < downvotesToAdd; i++) {
            const voterId = generateVoterAnonymousId();
            voterIds.push({ id: voterId, value: -1 });

            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType: 'comment',
                commentId: commentId,
                value: -1,
                anonymousId: voterId
            });

            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to add downvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Verify final counts
        const countsResult = await getCommentVoteCounts(page, commentId);
        if (!countsResult.success) {
            return { success: false, errorMessage: countsResult.errorMessage };
        }

        return {
            success: true,
            commentId: commentId,
            postId: postId,
            upvotes: countsResult.upvotes,
            downvotes: countsResult.downvotes,
            score: countsResult.score,
            voterIds: voterIds,
            errorMessage: null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Cast a vote on a comment and return updated counts
 *
 * @param {Object} page - Playwright page object
 * @param {Object} options - Vote options
 * @param {string} options.commentId - Comment to vote on
 * @param {number} options.value - Vote value (+1 or -1)
 * @param {string} options.anonymousId - Voter's anonymous ID
 * @param {string} options.authToken - Auth token for authenticated users
 * @returns {Promise<Object>} - Returns { success, statusCode, body, upvotes, downvotes, score, action, errorMessage }
 */
async function castVoteAndGetCounts(page, options = {}) {
    try {
        const { commentId, value, anonymousId, authToken } = options;

        // Cast the vote
        const voteResult = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentId,
            value: value,
            anonymousId: anonymousId,
            authToken: authToken
        });

        if (!voteResult.success) {
            return {
                success: false,
                statusCode: voteResult.statusCode,
                body: voteResult.body,
                errorMessage: voteResult.errorMessage
            };
        }

        // Get updated counts
        const countsResult = await getCommentVoteCounts(page, commentId);
        if (!countsResult.success) {
            return {
                success: false,
                statusCode: voteResult.statusCode,
                body: voteResult.body,
                errorMessage: countsResult.errorMessage
            };
        }

        return {
            success: true,
            statusCode: voteResult.statusCode,
            body: voteResult.body,
            upvotes: countsResult.upvotes,
            downvotes: countsResult.downvotes,
            score: countsResult.score,
            action: voteResult.action,
            errorMessage: null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get current comment score
 *
 * @param {Object} result - Result from action
 * @returns {number|null} - Current score or null
 */
function getScoreFromResult(result) {
    return result?.score ?? null;
}

/**
 * Helper to get current upvotes count
 *
 * @param {Object} result - Result from action
 * @returns {number|null} - Current upvotes or null
 */
function getUpvotesFromResult(result) {
    return result?.upvotes ?? null;
}

/**
 * Helper to get current downvotes count
 *
 * @param {Object} result - Result from action
 * @returns {number|null} - Current downvotes or null
 */
function getDownvotesFromResult(result) {
    return result?.downvotes ?? null;
}

module.exports = {
    performUpdateCommentScoreAction,
    setupCommentWithVotes,
    castVoteAndGetCounts,
    getScoreFromResult,
    getUpvotesFromResult,
    getDownvotesFromResult
};
