const {
    performShowVoteButtonsAction,
    createTestPostForVoteButtons,
    createTestCommentForVoteButtons
} = require('../show-vote-buttons/show-vote-buttons.action.js');
const {
    performCreateVoteRecordAction,
    generateVoterAnonymousId
} = require('../create-vote-record/create-vote-record.action.js');

/**
 * Show Score Display Action
 *
 * Verifies score displays correctly on posts and comments,
 * including value updates after voting.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.target - 'feed', 'detail', or 'comment'
 * @param {string} context.postId - Post ID for detail/comment tests
 * @returns {Promise<Object>} - Returns { success, errorMessage, scoreValue, ...data }
 */
async function performShowScoreDisplayAction(page, context = {}) {
    try {
        const { target = 'feed', postId } = context;

        if (target === 'feed') {
            return await checkScoreDisplayOnFeed(page);
        } else if (target === 'detail') {
            return await checkScoreDisplayOnDetail(page, postId);
        } else if (target === 'comment') {
            return await checkScoreDisplayOnComment(page, postId);
        }

        return { success: false, errorMessage: `Unknown target: ${target}` };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check score displays between vote arrows on feed
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, scoreValue, hasScoreBetweenArrows }
 */
async function checkScoreDisplayOnFeed(page) {
    try {
        // Navigate to home page (feed)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for post cards to be visible
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const outcome = await Promise.race([
            postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            page.getByText('No posts found').waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'empty' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'empty') {
            return { success: false, errorMessage: 'No posts found in the feed', needsPost: true };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for post cards to load' };
        }

        // Check the first post card
        const firstCard = postCardLocator.first();

        // Wait for vote score to be visible
        const scoreDisplay = firstCard.locator('[data-testid="vote-score"]');
        await scoreDisplay.waitFor({ state: 'visible', timeout: 5000 });

        // Check that upvote, score, and downvote are visible (score is between arrows)
        const upvoteButton = firstCard.getByRole('button', { name: 'Upvote' });
        const downvoteButton = firstCard.getByRole('button', { name: 'Downvote' });

        const hasUpvote = await upvoteButton.isVisible().catch(() => false);
        const hasDownvote = await downvoteButton.isVisible().catch(() => false);
        const hasScore = await scoreDisplay.isVisible().catch(() => false);

        let scoreValue = null;
        if (hasScore) {
            const scoreText = await scoreDisplay.textContent().catch(() => null);
            scoreValue = scoreText !== null ? parseInt(scoreText, 10) : null;
        }

        // The score is between arrows if all three elements are visible
        const hasScoreBetweenArrows = hasUpvote && hasDownvote && hasScore;

        return {
            success: hasScoreBetweenArrows,
            hasScoreBetweenArrows,
            scoreValue,
            hasUpvote,
            hasDownvote,
            hasScore,
            errorMessage: !hasScoreBetweenArrows ? 'Score not displayed between vote arrows' : null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check score displays on post detail page
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, scoreValue, hasScoreBetweenArrows }
 */
async function checkScoreDisplayOnDetail(page, postId) {
    try {
        let targetPostId = postId;

        // Navigate to the post detail page
        if (targetPostId) {
            await page.goto(`/post/${targetPostId}`);
            await page.waitForLoadState('networkidle');
        } else {
            // Navigate to feed and click first post
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
            await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

            const link = postCardLocator.first().locator('a[href^="/post/"]');
            await link.click();

            await page.waitForURL('**/post/**', { timeout: 5000 });
            await page.waitForLoadState('domcontentloaded');

            // Extract post ID from URL
            const url = page.url();
            const postIdMatch = url.match(/\/post\/([^/]+)/);
            targetPostId = postIdMatch ? postIdMatch[1] : null;
        }

        // Wait for score display to be visible
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await scoreDisplay.waitFor({ state: 'visible', timeout: 10000 });

        // Check vote elements
        const upvoteButton = page.getByRole('button', { name: 'Upvote' }).first();
        const downvoteButton = page.getByRole('button', { name: 'Downvote' }).first();

        const hasUpvote = await upvoteButton.isVisible().catch(() => false);
        const hasDownvote = await downvoteButton.isVisible().catch(() => false);
        const hasScore = await scoreDisplay.isVisible().catch(() => false);

        let scoreValue = null;
        if (hasScore) {
            const scoreText = await scoreDisplay.textContent().catch(() => null);
            scoreValue = scoreText !== null ? parseInt(scoreText, 10) : null;
        }

        const hasScoreBetweenArrows = hasUpvote && hasDownvote && hasScore;

        return {
            success: hasScoreBetweenArrows,
            hasScoreBetweenArrows,
            scoreValue,
            postId: targetPostId,
            hasUpvote,
            hasDownvote,
            hasScore,
            errorMessage: !hasScoreBetweenArrows ? 'Score not displayed between vote arrows on detail page' : null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check score displays on comments
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID with comments
 * @returns {Promise<Object>} - Returns { success, commentScoreValue, hasCommentScore }
 */
async function checkScoreDisplayOnComment(page, postId) {
    try {
        let targetPostId = postId;

        // Navigate to post detail page
        if (targetPostId) {
            await page.goto(`/post/${targetPostId}`);
        } else {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
            await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

            await postCardLocator.first().locator('a[href^="/post/"]').click();
            await page.waitForURL('**/post/**', { timeout: 5000 });

            const url = page.url();
            const postIdMatch = url.match(/\/post\/([^/]+)/);
            targetPostId = postIdMatch ? postIdMatch[1] : null;
        }

        await page.waitForLoadState('domcontentloaded');

        // Wait for the post content to load
        const postHeader = page.locator('h1').filter({ hasText: 'Why is it so hard to' });
        await postHeader.first().waitFor({ state: 'visible', timeout: 5000 });

        // Get all vote score elements - first is post, rest are comments
        const allScoreDisplays = page.locator('[data-testid="vote-score"]');
        const scoreCount = await allScoreDisplays.count();

        if (scoreCount < 2) {
            return {
                success: false,
                errorMessage: 'No comment score displays found (only post score visible)',
                needsComment: true,
                postId: targetPostId
            };
        }

        // Get the second score display (first comment)
        const commentScoreDisplay = allScoreDisplays.nth(1);
        const hasCommentScore = await commentScoreDisplay.isVisible().catch(() => false);

        let commentScoreValue = null;
        if (hasCommentScore) {
            const scoreText = await commentScoreDisplay.textContent().catch(() => null);
            commentScoreValue = scoreText !== null ? parseInt(scoreText, 10) : null;
        }

        return {
            success: hasCommentScore,
            hasCommentScore,
            commentScoreValue,
            postId: targetPostId,
            commentCount: scoreCount - 1,
            errorMessage: !hasCommentScore ? 'Comment score not visible' : null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get the current score value from a post card on the feed
 * @param {Object} page - Playwright page object
 * @param {number} cardIndex - Index of the post card (default: 0)
 * @returns {Promise<Object>} - Returns { success, scoreValue }
 */
async function getScoreFromFeedCard(page, cardIndex = 0) {
    try {
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const card = postCardLocator.nth(cardIndex);
        const scoreDisplay = card.locator('[data-testid="vote-score"]');

        const hasScore = await scoreDisplay.isVisible().catch(() => false);
        if (!hasScore) {
            return { success: false, errorMessage: 'Score display not visible' };
        }

        const scoreText = await scoreDisplay.textContent().catch(() => null);
        const scoreValue = scoreText !== null ? parseInt(scoreText, 10) : null;

        return {
            success: true,
            scoreValue,
            scoreText
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click upvote on a post card and get the updated score
 * @param {Object} page - Playwright page object
 * @param {number} cardIndex - Index of the post card (default: 0)
 * @returns {Promise<Object>} - Returns { success, previousScore, newScore }
 */
async function clickUpvoteAndGetScore(page, cardIndex = 0) {
    try {
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const card = postCardLocator.nth(cardIndex);
        const scoreDisplay = card.locator('[data-testid="vote-score"]');
        const upvoteButton = card.getByRole('button', { name: 'Upvote' });

        // Get current score
        const previousScoreText = await scoreDisplay.textContent().catch(() => '0');
        const previousScore = parseInt(previousScoreText, 10);

        // Click upvote
        await upvoteButton.click();

        // Wait for score to update (using domcontentloaded as we can't use waitForTimeout)
        await page.waitForLoadState('domcontentloaded');

        // Get new score
        const newScoreText = await scoreDisplay.textContent().catch(() => '0');
        const newScore = parseInt(newScoreText, 10);

        return {
            success: true,
            previousScore,
            newScore,
            scoreChanged: newScore !== previousScore
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click downvote on a post card and get the updated score
 * @param {Object} page - Playwright page object
 * @param {number} cardIndex - Index of the post card (default: 0)
 * @returns {Promise<Object>} - Returns { success, previousScore, newScore }
 */
async function clickDownvoteAndGetScore(page, cardIndex = 0) {
    try {
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const card = postCardLocator.nth(cardIndex);
        const scoreDisplay = card.locator('[data-testid="vote-score"]');
        const downvoteButton = card.getByRole('button', { name: 'Downvote' });

        // Get current score
        const previousScoreText = await scoreDisplay.textContent().catch(() => '0');
        const previousScore = parseInt(previousScoreText, 10);

        // Click downvote
        await downvoteButton.click();

        // Wait for score to update
        await page.waitForLoadState('domcontentloaded');

        // Get new score
        const newScoreText = await scoreDisplay.textContent().catch(() => '0');
        const newScore = parseInt(newScoreText, 10);

        return {
            success: true,
            previousScore,
            newScore,
            scoreChanged: newScore !== previousScore
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click upvote on a comment and get the updated score
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (default: 0, which is the first comment)
 * @returns {Promise<Object>} - Returns { success, previousScore, newScore }
 */
async function clickCommentUpvoteAndGetScore(page, commentIndex = 0) {
    try {
        // Comment vote buttons are the 2nd, 3rd, etc. (first is the post)
        const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
        const allScoreDisplays = page.locator('[data-testid="vote-score"]');

        // Get the comment's upvote button and score display (offset by 1 for the post)
        const commentUpvoteButton = allUpvoteButtons.nth(commentIndex + 1);
        const commentScoreDisplay = allScoreDisplays.nth(commentIndex + 1);

        // Get current score
        const previousScoreText = await commentScoreDisplay.textContent().catch(() => '0');
        const previousScore = parseInt(previousScoreText, 10);

        // Click upvote
        await commentUpvoteButton.click();

        // Wait for score to update
        await page.waitForLoadState('domcontentloaded');

        // Get new score
        const newScoreText = await commentScoreDisplay.textContent().catch(() => '0');
        const newScore = parseInt(newScoreText, 10);

        return {
            success: true,
            previousScore,
            newScore,
            scoreChanged: newScore !== previousScore
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a post with a specific score by applying votes via API
 * @param {Object} page - Playwright page object
 * @param {number} targetScore - Target score to achieve
 * @returns {Promise<Object>} - Returns { success, postId, actualScore }
 */
async function createPostWithScore(page, targetScore) {
    try {
        // Create a test post
        const postResult = await createTestPostForVoteButtons(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        const postId = postResult.postId;
        let actualScore = 0;

        // Apply votes to reach target score
        if (targetScore > 0) {
            // Need upvotes
            for (let i = 0; i < targetScore; i++) {
                const anonymousId = generateVoterAnonymousId();
                const voteResult = await performCreateVoteRecordAction(page, {
                    mode: 'api',
                    targetType: 'post',
                    postId: postId,
                    value: 1,
                    anonymousId: anonymousId
                });
                if (voteResult.success) {
                    actualScore++;
                }
            }
        } else if (targetScore < 0) {
            // Need downvotes
            for (let i = 0; i < Math.abs(targetScore); i++) {
                const anonymousId = generateVoterAnonymousId();
                const voteResult = await performCreateVoteRecordAction(page, {
                    mode: 'api',
                    targetType: 'post',
                    postId: postId,
                    value: -1,
                    anonymousId: anonymousId
                });
                if (voteResult.success) {
                    actualScore--;
                }
            }
        }

        return {
            success: true,
            postId,
            actualScore,
            frustration: postResult.frustration
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a post with equal upvotes and downvotes (score = 0)
 * @param {Object} page - Playwright page object
 * @param {number} voteCount - Number of upvotes AND downvotes to add (default: 2)
 * @returns {Promise<Object>} - Returns { success, postId, upvotes, downvotes, score }
 */
async function createPostWithEqualVotes(page, voteCount = 2) {
    try {
        // Create a test post
        const postResult = await createTestPostForVoteButtons(page);
        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        const postId = postResult.postId;
        let upvotes = 0;
        let downvotes = 0;

        // Add upvotes
        for (let i = 0; i < voteCount; i++) {
            const anonymousId = generateVoterAnonymousId();
            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType: 'post',
                postId: postId,
                value: 1,
                anonymousId: anonymousId
            });
            if (voteResult.success) {
                upvotes++;
            }
        }

        // Add downvotes
        for (let i = 0; i < voteCount; i++) {
            const anonymousId = generateVoterAnonymousId();
            const voteResult = await performCreateVoteRecordAction(page, {
                mode: 'api',
                targetType: 'post',
                postId: postId,
                value: -1,
                anonymousId: anonymousId
            });
            if (voteResult.success) {
                downvotes++;
            }
        }

        const score = upvotes - downvotes;

        return {
            success: true,
            postId,
            upvotes,
            downvotes,
            score,
            frustration: postResult.frustration
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a comment with a specific score by applying votes via API
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to add comment to
 * @param {number} targetScore - Target score to achieve
 * @returns {Promise<Object>} - Returns { success, commentId, postId, actualScore }
 */
async function createCommentWithScore(page, postId, targetScore) {
    try {
        // Create a test comment
        const commentResult = await createTestCommentForVoteButtons(page, postId);
        if (!commentResult.success) {
            return { success: false, errorMessage: commentResult.errorMessage };
        }

        const commentId = commentResult.commentId;
        let actualScore = 0;

        // Apply votes to reach target score
        if (targetScore > 0) {
            for (let i = 0; i < targetScore; i++) {
                const anonymousId = generateVoterAnonymousId();
                const voteResult = await performCreateVoteRecordAction(page, {
                    mode: 'api',
                    targetType: 'comment',
                    commentId: commentId,
                    value: 1,
                    anonymousId: anonymousId
                });
                if (voteResult.success) {
                    actualScore++;
                }
            }
        } else if (targetScore < 0) {
            for (let i = 0; i < Math.abs(targetScore); i++) {
                const anonymousId = generateVoterAnonymousId();
                const voteResult = await performCreateVoteRecordAction(page, {
                    mode: 'api',
                    targetType: 'comment',
                    commentId: commentId,
                    value: -1,
                    anonymousId: anonymousId
                });
                if (voteResult.success) {
                    actualScore--;
                }
            }
        }

        return {
            success: true,
            commentId,
            postId,
            actualScore,
            content: commentResult.content
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate to feed and find a post, returning its score
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to find (optional, uses first card if not provided)
 * @returns {Promise<Object>} - Returns { success, scoreValue, cardIndex }
 */
async function findPostScoreOnFeed(page, postId = null) {
    try {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

        if (postId) {
            // Find the specific post by looking for its link
            const cards = await postCardLocator.count();
            for (let i = 0; i < cards; i++) {
                const card = postCardLocator.nth(i);
                const link = card.locator(`a[href="/post/${postId}"]`);
                const hasLink = await link.count() > 0;
                if (hasLink) {
                    const scoreDisplay = card.locator('[data-testid="vote-score"]');
                    const scoreText = await scoreDisplay.textContent().catch(() => '0');
                    return {
                        success: true,
                        scoreValue: parseInt(scoreText, 10),
                        cardIndex: i
                    };
                }
            }
            return { success: false, errorMessage: `Post ${postId} not found on feed` };
        }

        // Use first card
        const scoreDisplay = postCardLocator.first().locator('[data-testid="vote-score"]');
        const scoreText = await scoreDisplay.textContent().catch(() => '0');
        return {
            success: true,
            scoreValue: parseInt(scoreText, 10),
            cardIndex: 0
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowScoreDisplayAction,
    checkScoreDisplayOnFeed,
    checkScoreDisplayOnDetail,
    checkScoreDisplayOnComment,
    getScoreFromFeedCard,
    clickUpvoteAndGetScore,
    clickDownvoteAndGetScore,
    clickCommentUpvoteAndGetScore,
    createPostWithScore,
    createPostWithEqualVotes,
    createCommentWithScore,
    findPostScoreOnFeed,
    // Re-export dependencies for convenience
    createTestPostForVoteButtons,
    createTestCommentForVoteButtons,
    performCreateVoteRecordAction,
    generateVoterAnonymousId
};
