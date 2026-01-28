const { performShowVoteButtonsAction, createTestPostForVoteButtons, createTestCommentForVoteButtons, getOrCreateTestCategory, performCreatePostRecordAction } = require('../show-vote-buttons/show-vote-buttons.action.js');
const { performCreateVoteRecordAction, createTestPostForVoting, createTestCommentForVoting, generateVoterAnonymousId, getPostVoteCounts, getCommentVoteCounts, castInitialVote, createTestUserWithAuth } = require('../create-vote-record/create-vote-record.action.js');

/**
 * Handle Upvote Click Action
 *
 * Processes upvote button clicks on posts and comments.
 * Handles new upvotes, toggle off (remove), and direction change (downvote to upvote).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' or 'ui'
 * @param {string} context.targetType - 'post' or 'comment'
 * @param {string} context.postId - Post ID for post votes
 * @param {string} context.commentId - Comment ID for comment votes
 * @param {number} context.initialScore - Initial score before vote
 * @param {string} context.anonymousId - Anonymous ID for the voter
 * @param {string} context.authToken - Auth token for authenticated user
 * @param {string} context.existingVote - 'upvote', 'downvote', or null
 * @returns {Promise<Object>} - Returns { success, statusCode, body, newScore, voteStatus, errorMessage }
 */
async function performHandleUpvoteClickAction(page, context = {}) {
    try {
        const {
            mode,
            targetType = 'post',
            postId,
            commentId,
            initialScore,
            anonymousId,
            authToken,
            existingVote
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType,
                postId,
                commentId,
                value: 1, // Upvote value
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

            // Determine new score and vote status based on action
            let newScore = initialScore;
            let voteStatus = 1; // Default: upvote is active

            if (voteResult.action === 'created') {
                // New upvote: score + 1
                newScore = initialScore + 1;
                voteStatus = 1;
            } else if (voteResult.action === 'deleted') {
                // Toggle off: score - 1 (existing upvote removed)
                newScore = initialScore - 1;
                voteStatus = null;
            } else if (voteResult.action === 'updated') {
                // Direction change from downvote to upvote: score + 2
                newScore = initialScore + 2;
                voteStatus = 1;
            }

            // Verify actual score from database
            let actualScore = newScore;
            if (targetType === 'comment' && commentId) {
                const counts = await getCommentVoteCounts(page, commentId);
                if (counts.success) {
                    actualScore = counts.score;
                }
            } else if (targetType === 'post' && postId) {
                const counts = await getPostVoteCounts(page, postId);
                if (counts.success) {
                    actualScore = counts.score;
                }
            }

            return {
                success: true,
                statusCode: voteResult.statusCode,
                body: voteResult.body,
                newScore: actualScore,
                voteStatus: voteStatus,
                action: voteResult.action,
                errorMessage: null
            };
        }

        // ==========================================
        // UI MODE - Browser interaction
        // ==========================================
        if (mode === 'ui') {
            return await performUpvoteClickUI(page, context);
        }

        return { success: false, errorMessage: 'Invalid mode. Use "api" or "ui".' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * UI mode for upvote click
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, newScore, upvoteActive, downvoteActive, errorMessage }
 */
async function performUpvoteClickUI(page, context = {}) {
    try {
        const {
            targetType = 'post',
            postId,
            commentId,
            target = 'feed', // 'feed', 'detail', or 'comment'
            cardIndex = 0
        } = context;

        // Navigate based on target
        if (target === 'feed') {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        } else if (target === 'detail' && postId) {
            await page.goto(`/post/${postId}`);
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for content to load
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 10000 });

        // Find the appropriate upvote button
        let upvoteButton;
        let scoreDisplay;

        if (target === 'comment') {
            // For comments, need to find buttons after the post's buttons
            const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
            const allScoreDisplays = page.locator('[data-testid="vote-score"]');

            // Index 0 is the post, index 1+ are comments
            const commentIndex = cardIndex + 1;
            upvoteButton = allUpvoteButtons.nth(commentIndex);
            scoreDisplay = allScoreDisplays.nth(commentIndex);
        } else {
            // For posts in feed or detail
            const card = postCardLocator.nth(cardIndex);
            upvoteButton = card.getByRole('button', { name: 'Upvote' });
            scoreDisplay = card.locator('[data-testid="vote-score"]');
        }

        // Get score before click
        await scoreDisplay.waitFor({ state: 'visible', timeout: 5000 });
        const scoreBefore = parseInt(await scoreDisplay.textContent(), 10);

        // Get button state before click
        const upvoteClassesBefore = await upvoteButton.getAttribute('class') || '';
        const upvoteActiveBefore = upvoteClassesBefore.includes('text-green') ||
                                   upvoteClassesBefore.includes('text-emerald') ||
                                   upvoteClassesBefore.includes('text-orange');

        // Click the upvote button
        await upvoteButton.click();

        // Wait for score to update (optimistic update should be immediate)
        await page.waitForLoadState('domcontentloaded');

        // Get score after click
        const scoreAfter = parseInt(await scoreDisplay.textContent(), 10);

        // Get button states after click
        const upvoteClassesAfter = await upvoteButton.getAttribute('class') || '';
        const upvoteActiveAfter = upvoteClassesAfter.includes('text-green') ||
                                  upvoteClassesAfter.includes('text-emerald') ||
                                  upvoteClassesAfter.includes('text-orange');

        // Get downvote button state
        let downvoteButton;
        if (target === 'comment') {
            const allDownvoteButtons = page.getByRole('button', { name: 'Downvote' });
            const commentIndex = cardIndex + 1;
            downvoteButton = allDownvoteButtons.nth(commentIndex);
        } else {
            const card = postCardLocator.nth(cardIndex);
            downvoteButton = card.getByRole('button', { name: 'Downvote' });
        }

        const downvoteClasses = await downvoteButton.getAttribute('class') || '';
        const downvoteActive = downvoteClasses.includes('text-red') ||
                               downvoteClasses.includes('text-orange');

        return {
            success: true,
            scoreBefore,
            scoreAfter,
            newScore: scoreAfter,
            upvoteActiveBefore,
            upvoteActiveAfter,
            upvoteActive: upvoteActiveAfter,
            downvoteActive,
            errorMessage: null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a post with specific initial score for testing
 * @param {Object} page - Playwright page object
 * @param {number} targetScore - Target initial score
 * @returns {Promise<Object>} - Returns { success, postId, anonymousId, score, errorMessage }
 */
async function setupPostWithScore(page, targetScore = 0) {
    try {
        // Create a post
        const postResult = await createTestPostForVoting(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        // Add votes to achieve target score
        if (targetScore > 0) {
            for (let i = 0; i < targetScore; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'post',
                    postId: postResult.postId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        } else if (targetScore < 0) {
            for (let i = 0; i < Math.abs(targetScore); i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'post',
                    postId: postResult.postId,
                    value: -1,
                    anonymousId: voterId
                });
            }
        }

        // Verify score
        const counts = await getPostVoteCounts(page, postResult.postId);

        return {
            success: true,
            postId: postResult.postId,
            anonymousId: postResult.anonymousId,
            score: counts.success ? counts.score : targetScore,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a comment with specific initial score for testing
 * @param {Object} page - Playwright page object
 * @param {number} targetScore - Target initial score
 * @returns {Promise<Object>} - Returns { success, commentId, postId, anonymousId, score, errorMessage }
 */
async function setupCommentWithScore(page, targetScore = 0) {
    try {
        // Create a comment (this also creates a post)
        const commentResult = await createTestCommentForVoting(page);
        if (!commentResult.success) {
            return { success: false, errorMessage: commentResult.errorMessage };
        }

        // Add votes to achieve target score
        if (targetScore > 0) {
            for (let i = 0; i < targetScore; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: commentResult.commentId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        } else if (targetScore < 0) {
            for (let i = 0; i < Math.abs(targetScore); i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: commentResult.commentId,
                    value: -1,
                    anonymousId: voterId
                });
            }
        }

        // Verify score
        const counts = await getCommentVoteCounts(page, commentResult.commentId);

        return {
            success: true,
            commentId: commentResult.commentId,
            postId: commentResult.postId,
            anonymousId: commentResult.anonymousId,
            score: counts.success ? counts.score : targetScore,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a post with an existing vote from a specific voter
 * @param {Object} page - Playwright page object
 * @param {number} targetScore - Target score
 * @param {number} existingVoteValue - Existing vote value (1 or -1)
 * @returns {Promise<Object>} - Returns { success, postId, voterAnonymousId, score, errorMessage }
 */
async function setupPostWithExistingVote(page, targetScore = 0, existingVoteValue = 1) {
    try {
        // Create a post
        const postResult = await createTestPostForVoting(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        // Calculate additional votes needed (excluding the main voter's vote)
        const adjustedScore = existingVoteValue === 1 ? targetScore - 1 : targetScore + 1;

        // Add other votes to achieve adjusted score
        if (adjustedScore > 0) {
            for (let i = 0; i < adjustedScore; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'post',
                    postId: postResult.postId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        } else if (adjustedScore < 0) {
            for (let i = 0; i < Math.abs(adjustedScore); i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'post',
                    postId: postResult.postId,
                    value: -1,
                    anonymousId: voterId
                });
            }
        }

        // Cast the main voter's existing vote
        const voterAnonymousId = generateVoterAnonymousId();
        const voterVoteResult = await castInitialVote(page, {
            targetType: 'post',
            postId: postResult.postId,
            value: existingVoteValue,
            anonymousId: voterAnonymousId
        });

        if (!voterVoteResult.success) {
            return { success: false, errorMessage: `Failed to cast voter's existing vote: ${voterVoteResult.errorMessage}` };
        }

        // Verify score
        const counts = await getPostVoteCounts(page, postResult.postId);

        return {
            success: true,
            postId: postResult.postId,
            postAnonymousId: postResult.anonymousId,
            voterAnonymousId: voterAnonymousId,
            score: counts.success ? counts.score : targetScore,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a comment with an existing vote from a specific voter
 * @param {Object} page - Playwright page object
 * @param {number} targetScore - Target score
 * @param {number} existingVoteValue - Existing vote value (1 or -1)
 * @returns {Promise<Object>} - Returns { success, commentId, postId, voterAnonymousId, score, errorMessage }
 */
async function setupCommentWithExistingVote(page, targetScore = 0, existingVoteValue = 1) {
    try {
        // Create a comment
        const commentResult = await createTestCommentForVoting(page);
        if (!commentResult.success) {
            return { success: false, errorMessage: commentResult.errorMessage };
        }

        // Calculate additional votes needed
        const adjustedScore = existingVoteValue === 1 ? targetScore - 1 : targetScore + 1;

        // Add other votes to achieve adjusted score
        if (adjustedScore > 0) {
            for (let i = 0; i < adjustedScore; i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: commentResult.commentId,
                    value: 1,
                    anonymousId: voterId
                });
            }
        } else if (adjustedScore < 0) {
            for (let i = 0; i < Math.abs(adjustedScore); i++) {
                const voterId = generateVoterAnonymousId();
                await castInitialVote(page, {
                    targetType: 'comment',
                    commentId: commentResult.commentId,
                    value: -1,
                    anonymousId: voterId
                });
            }
        }

        // Cast the main voter's existing vote
        const voterAnonymousId = generateVoterAnonymousId();
        const voterVoteResult = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentResult.commentId,
            value: existingVoteValue,
            anonymousId: voterAnonymousId
        });

        if (!voterVoteResult.success) {
            return { success: false, errorMessage: `Failed to cast voter's existing vote: ${voterVoteResult.errorMessage}` };
        }

        // Verify score
        const counts = await getCommentVoteCounts(page, commentResult.commentId);

        return {
            success: true,
            commentId: commentResult.commentId,
            postId: commentResult.postId,
            commentAnonymousId: commentResult.anonymousId,
            voterAnonymousId: voterAnonymousId,
            score: counts.success ? counts.score : targetScore,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if upvote button shows active state
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with target info
 * @returns {Promise<Object>} - Returns { success, upvoteActive, downvoteActive, score, errorMessage }
 */
async function checkUpvoteButtonState(page, context = {}) {
    try {
        const { target = 'feed', cardIndex = 0 } = context;

        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');

        let upvoteButton;
        let downvoteButton;
        let scoreDisplay;

        if (target === 'comment') {
            const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
            const allDownvoteButtons = page.getByRole('button', { name: 'Downvote' });
            const allScoreDisplays = page.locator('[data-testid="vote-score"]');

            const commentIndex = cardIndex + 1;
            upvoteButton = allUpvoteButtons.nth(commentIndex);
            downvoteButton = allDownvoteButtons.nth(commentIndex);
            scoreDisplay = allScoreDisplays.nth(commentIndex);
        } else {
            const card = postCardLocator.nth(cardIndex);
            upvoteButton = card.getByRole('button', { name: 'Upvote' });
            downvoteButton = card.getByRole('button', { name: 'Downvote' });
            scoreDisplay = card.locator('[data-testid="vote-score"]');
        }

        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        const upvoteClasses = await upvoteButton.getAttribute('class') || '';
        const downvoteClasses = await downvoteButton.getAttribute('class') || '';
        const scoreText = await scoreDisplay.textContent();

        const upvoteActive = upvoteClasses.includes('text-green') ||
                            upvoteClasses.includes('text-emerald') ||
                            upvoteClasses.includes('text-orange');

        const downvoteActive = downvoteClasses.includes('text-red') ||
                              downvoteClasses.includes('text-orange');

        return {
            success: true,
            upvoteActive,
            downvoteActive,
            score: parseInt(scoreText, 10),
            upvoteClasses,
            downvoteClasses,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get new score from result
 * @param {Object} result - Result from action
 * @returns {number|null} - New score or null
 */
function getNewScoreFromResult(result) {
    return result?.newScore ?? null;
}

/**
 * Helper to get vote status from result
 * @param {Object} result - Result from action
 * @returns {number|null} - Vote status (1, -1, or null)
 */
function getVoteStatusFromResult(result) {
    return result?.voteStatus ?? null;
}

module.exports = {
    performHandleUpvoteClickAction,
    performUpvoteClickUI,
    setupPostWithScore,
    setupCommentWithScore,
    setupPostWithExistingVote,
    setupCommentWithExistingVote,
    checkUpvoteButtonState,
    getNewScoreFromResult,
    getVoteStatusFromResult,
    // Re-exports for convenience
    generateVoterAnonymousId,
    createTestUserWithAuth,
    createTestPostForVoting,
    createTestCommentForVoting,
    getPostVoteCounts,
    getCommentVoteCounts,
    castInitialVote
};
