const {
    performCreateVoteRecordAction,
    createTestPostForVoting,
    createTestCommentForVoting,
    generateVoterAnonymousId,
    getPostVoteCounts,
    getCommentVoteCounts,
    castInitialVote,
    createTestUserWithAuth
} = require('../create-vote-record/create-vote-record.action.js');

/**
 * Update Post Score Action
 *
 * Casts a vote and verifies the post/comment score is correctly updated.
 * Score = upvotes - downvotes
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
 * @returns {Promise<Object>} - Returns { success, statusCode, body, upvotes, downvotes, score, errorMessage }
 */
async function performUpdatePostScoreAction(page, context = {}) {
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
        // API MODE - Cast vote and verify score update
        // ==========================================
        if (mode === 'api' || !mode) {
            // Cast the vote
            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType,
                postId,
                commentId,
                value,
                anonymousId,
                authToken
            });

            if (!voteResult.success) {
                return {
                    success: false,
                    statusCode: voteResult.statusCode,
                    body: voteResult.body,
                    errorMessage: voteResult.errorMessage
                };
            }

            // Get updated counts to verify score
            let counts;
            if (targetType === 'comment') {
                counts = await getCommentVoteCounts(page, commentId);
            } else {
                counts = await getPostVoteCounts(page, postId);
            }

            if (!counts.success) {
                return {
                    success: false,
                    statusCode: voteResult.statusCode,
                    body: voteResult.body,
                    errorMessage: counts.errorMessage || 'Failed to verify vote counts'
                };
            }

            return {
                success: true,
                statusCode: voteResult.statusCode,
                body: voteResult.body,
                upvotes: counts.upvotes,
                downvotes: counts.downvotes,
                score: counts.score,
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
 * Helper to get post details via API
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} - Returns { success, statusCode, body, upvotes, downvotes, score, errorMessage }
 */
async function getPostById(page, postId) {
    try {
        const response = await page.request.get(
            `/api/trpc/post.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: postId } }))}`
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
                errorMessage: body?.error?.json?.message || 'Failed to get post'
            };
        }

        const post = body?.result?.data?.json || body?.result?.data || body;

        return {
            success: true,
            statusCode: status,
            body,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            score: post.score
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to set up a post with specific initial vote counts.
 * Creates a post and casts votes from multiple anonymous IDs to achieve desired counts.
 * @param {Object} page - Playwright page object
 * @param {number} targetUpvotes - Desired upvote count
 * @param {number} targetDownvotes - Desired downvote count
 * @returns {Promise<Object>} - Returns { success, postId, anonymousId, errorMessage }
 */
async function setupPostWithVoteCounts(page, targetUpvotes, targetDownvotes) {
    try {
        // Create the post
        const postResult = await createTestPostForVoting(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        // Cast upvotes from unique anonymous IDs
        for (let i = 0; i < targetUpvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'post',
                postId: postResult.postId,
                value: 1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast upvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Cast downvotes from unique anonymous IDs
        for (let i = 0; i < targetDownvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'post',
                postId: postResult.postId,
                value: -1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast downvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        return {
            success: true,
            postId: postResult.postId,
            anonymousId: postResult.anonymousId
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to set up a comment with specific initial vote counts.
 * Creates a comment and casts votes from multiple anonymous IDs to achieve desired counts.
 * @param {Object} page - Playwright page object
 * @param {number} targetUpvotes - Desired upvote count
 * @param {number} targetDownvotes - Desired downvote count
 * @returns {Promise<Object>} - Returns { success, commentId, postId, anonymousId, errorMessage }
 */
async function setupCommentWithVoteCounts(page, targetUpvotes, targetDownvotes) {
    try {
        // Create the comment
        const commentResult = await createTestCommentForVoting(page);
        if (!commentResult.success) {
            return { success: false, errorMessage: commentResult.errorMessage };
        }

        // Cast upvotes from unique anonymous IDs
        for (let i = 0; i < targetUpvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'comment',
                commentId: commentResult.commentId,
                value: 1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast upvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Cast downvotes from unique anonymous IDs
        for (let i = 0; i < targetDownvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'comment',
                commentId: commentResult.commentId,
                value: -1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast downvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        return {
            success: true,
            commentId: commentResult.commentId,
            postId: commentResult.postId,
            anonymousId: commentResult.anonymousId
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to set up a post with an existing vote from a specific voter.
 * @param {Object} page - Playwright page object
 * @param {number} targetUpvotes - Desired upvote count (before the voter's vote)
 * @param {number} targetDownvotes - Desired downvote count (before the voter's vote)
 * @param {number} voterValue - The existing vote value from the main voter (1 or -1)
 * @returns {Promise<Object>} - Returns { success, postId, voterAnonymousId, authToken, errorMessage }
 */
async function setupPostWithExistingVote(page, targetUpvotes, targetDownvotes, voterValue) {
    try {
        // Create the post
        const postResult = await createTestPostForVoting(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        // Adjust counts: if voter voted +1, we need targetUpvotes-1 other upvotes
        // if voter voted -1, we need targetDownvotes-1 other downvotes
        const otherUpvotes = voterValue === 1 ? targetUpvotes - 1 : targetUpvotes;
        const otherDownvotes = voterValue === -1 ? targetDownvotes - 1 : targetDownvotes;

        // Cast upvotes from unique anonymous IDs
        for (let i = 0; i < otherUpvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'post',
                postId: postResult.postId,
                value: 1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast upvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Cast downvotes from unique anonymous IDs
        for (let i = 0; i < otherDownvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'post',
                postId: postResult.postId,
                value: -1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast downvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Create the main voter and cast their vote
        const voterAnonymousId = generateVoterAnonymousId();
        const voterVoteResult = await castInitialVote(page, {
            targetType: 'post',
            postId: postResult.postId,
            value: voterValue,
            anonymousId: voterAnonymousId
        });

        if (!voterVoteResult.success) {
            return { success: false, errorMessage: `Failed to cast voter's initial vote: ${voterVoteResult.errorMessage}` };
        }

        return {
            success: true,
            postId: postResult.postId,
            voterAnonymousId: voterAnonymousId,
            authToken: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to set up a comment with an existing vote from a specific voter.
 * @param {Object} page - Playwright page object
 * @param {number} targetUpvotes - Desired upvote count (before the voter's vote)
 * @param {number} targetDownvotes - Desired downvote count (before the voter's vote)
 * @param {number} voterValue - The existing vote value from the main voter (1 or -1)
 * @returns {Promise<Object>} - Returns { success, commentId, postId, voterAnonymousId, errorMessage }
 */
async function setupCommentWithExistingVote(page, targetUpvotes, targetDownvotes, voterValue) {
    try {
        // Create the comment
        const commentResult = await createTestCommentForVoting(page);
        if (!commentResult.success) {
            return { success: false, errorMessage: commentResult.errorMessage };
        }

        // Adjust counts
        const otherUpvotes = voterValue === 1 ? targetUpvotes - 1 : targetUpvotes;
        const otherDownvotes = voterValue === -1 ? targetDownvotes - 1 : targetDownvotes;

        // Cast upvotes from unique anonymous IDs
        for (let i = 0; i < otherUpvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'comment',
                commentId: commentResult.commentId,
                value: 1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast upvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Cast downvotes from unique anonymous IDs
        for (let i = 0; i < otherDownvotes; i++) {
            const voterId = generateVoterAnonymousId();
            const voteResult = await castInitialVote(page, {
                targetType: 'comment',
                commentId: commentResult.commentId,
                value: -1,
                anonymousId: voterId
            });
            if (!voteResult.success) {
                return { success: false, errorMessage: `Failed to cast downvote ${i + 1}: ${voteResult.errorMessage}` };
            }
        }

        // Create the main voter and cast their vote
        const voterAnonymousId = generateVoterAnonymousId();
        const voterVoteResult = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentResult.commentId,
            value: voterValue,
            anonymousId: voterAnonymousId
        });

        if (!voterVoteResult.success) {
            return { success: false, errorMessage: `Failed to cast voter's initial vote: ${voterVoteResult.errorMessage}` };
        }

        return {
            success: true,
            commentId: commentResult.commentId,
            postId: commentResult.postId,
            voterAnonymousId: voterAnonymousId
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performUpdatePostScoreAction,
    getPostById,
    setupPostWithVoteCounts,
    setupCommentWithVoteCounts,
    setupPostWithExistingVote,
    setupCommentWithExistingVote,
    // Re-export helpers from create-vote-record for convenience
    createTestPostForVoting,
    createTestCommentForVoting,
    generateVoterAnonymousId,
    getPostVoteCounts,
    getCommentVoteCounts,
    castInitialVote,
    createTestUserWithAuth
};
