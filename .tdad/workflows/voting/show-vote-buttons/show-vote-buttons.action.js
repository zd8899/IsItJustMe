const { performCreatePostRecordAction, getOrCreateTestCategory } = require('../../posts/create-post-record/create-post-record.action.js');
const { performCreateCommentRecordAction } = require('../../comments/create-comment-record/create-comment-record.action.js');

/**
 * Show Vote Buttons Action
 *
 * Verifies vote buttons (upvote, downvote, score) are displayed correctly
 * on post cards, post detail pages, and comments.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.target - 'feed', 'detail', or 'comment'
 * @param {string} context.postId - Post ID for detail page tests
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowVoteButtonsAction(page, context = {}) {
    try {
        const { target = 'feed', postId } = context;

        if (target === 'feed') {
            return await checkVoteButtonsOnFeed(page);
        } else if (target === 'detail') {
            return await checkVoteButtonsOnDetail(page, postId);
        } else if (target === 'comment') {
            return await checkVoteButtonsOnComment(page, postId);
        }

        return { success: false, errorMessage: `Unknown target: ${target}` };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check vote buttons on post cards in the feed
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, hasUpvote, hasDownvote, hasScore }
 */
async function checkVoteButtonsOnFeed(page) {
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

        // Check vote buttons on the first post card
        const firstCard = postCardLocator.first();

        // Wait for upvote button to be visible
        await firstCard.getByRole('button', { name: 'Upvote' }).waitFor({ state: 'visible', timeout: 5000 });

        const upvoteButton = firstCard.getByRole('button', { name: 'Upvote' });
        const downvoteButton = firstCard.getByRole('button', { name: 'Downvote' });
        const scoreDisplay = firstCard.locator('[data-testid="vote-score"]');

        const hasUpvote = await upvoteButton.isVisible().catch(() => false);
        const hasDownvote = await downvoteButton.isVisible().catch(() => false);
        const hasScore = await scoreDisplay.isVisible().catch(() => false);

        let scoreValue = null;
        if (hasScore) {
            const scoreText = await scoreDisplay.textContent().catch(() => null);
            scoreValue = scoreText !== null ? parseInt(scoreText, 10) : null;
        }

        return {
            success: hasUpvote && hasDownvote && hasScore,
            hasUpvote,
            hasDownvote,
            hasScore,
            scoreValue,
            errorMessage: (!hasUpvote || !hasDownvote || !hasScore) ? 'Missing vote button elements' : null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check vote buttons on post detail page
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, hasUpvote, hasDownvote, hasScore }
 */
async function checkVoteButtonsOnDetail(page, postId) {
    try {
        let targetPostId = postId;

        // If no postId provided, navigate to feed and click first post
        if (!targetPostId) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
            await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

            // Click on the first post to go to detail page
            const link = postCardLocator.first().locator('a[href^="/post/"]');
            await link.click();

            await page.waitForURL('**/post/**', { timeout: 5000 });
            await page.waitForLoadState('domcontentloaded');

            // Extract post ID from URL
            const url = page.url();
            const postIdMatch = url.match(/\/post\/([^/]+)/);
            targetPostId = postIdMatch ? postIdMatch[1] : null;
        } else {
            // Navigate directly to the post detail page
            await page.goto(`/post/${targetPostId}`);
            await page.waitForLoadState('networkidle');
        }

        // Wait for page to load and check for post content
        const postHeader = page.locator('h1').filter({ hasText: 'Why is it so hard to' });
        const errorAlert = page.locator('[role="alert"]');

        // First wait for the vote-score element which appears once the post loads
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        try {
            await scoreDisplay.waitFor({ state: 'visible', timeout: 10000 });
        } catch {
            // Check if there's an error alert
            const hasError = await errorAlert.first().isVisible().catch(() => false);
            if (hasError) {
                const errorText = await errorAlert.first().textContent().catch(() => 'Unknown error');
                return { success: false, errorMessage: errorText };
            }
            return { success: false, errorMessage: 'Timeout waiting for post detail to load' };
        }

        // Verify the post header is also visible
        const hasHeader = await postHeader.first().isVisible().catch(() => false);
        if (!hasHeader) {
            return { success: false, errorMessage: 'Post header not found' };
        }

        // Check vote buttons on the post detail
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

        return {
            success: hasUpvote && hasDownvote && hasScore,
            hasUpvote,
            hasDownvote,
            hasScore,
            scoreValue,
            postId: targetPostId,
            errorMessage: (!hasUpvote || !hasDownvote || !hasScore) ? 'Missing vote button elements on detail page' : null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check vote buttons on comments
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID with comments
 * @returns {Promise<Object>} - Returns { success, hasUpvote, hasDownvote, hasScore }
 */
async function checkVoteButtonsOnComment(page, postId) {
    try {
        let targetPostId = postId;

        // Navigate to post detail page
        if (targetPostId) {
            await page.goto(`/post/${targetPostId}`);
        } else {
            // Navigate to feed and find a post with comments, or create one
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
            await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

            // Look for a post with comments
            const postWithComments = postCardLocator.filter({ hasText: /[1-9]\d* comments/ }).first();
            const hasPostWithComments = await postWithComments.count() > 0;

            if (hasPostWithComments) {
                await postWithComments.locator('a[href^="/post/"]').click();
            } else {
                // Just use the first post
                await postCardLocator.first().locator('a[href^="/post/"]').click();
            }

            await page.waitForURL('**/post/**', { timeout: 5000 });

            // Extract post ID from URL
            const url = page.url();
            const postIdMatch = url.match(/\/post\/([^/]+)/);
            targetPostId = postIdMatch ? postIdMatch[1] : null;
        }

        await page.waitForLoadState('domcontentloaded');

        // Wait for the post header to ensure page is loaded
        const postHeader = page.locator('h1').filter({ hasText: 'Why is it so hard to' });
        await postHeader.first().waitFor({ state: 'visible', timeout: 5000 });

        // Look for comment cards (comments have the nested structure with ml-8 or are direct children)
        // Comment cards have VoteButtons inside them
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').filter({
            has: page.locator('p.text-primary-800') // Comments have content in p.text-primary-800
        });

        // Wait a bit for comments to load
        try {
            await commentCard.first().waitFor({ state: 'visible', timeout: 3000 });
        } catch {
            // No comments found
            return {
                success: false,
                errorMessage: 'No comments found on this post',
                needsComment: true,
                postId: targetPostId
            };
        }

        const hasComments = await commentCard.count() > 0;

        if (!hasComments) {
            return {
                success: false,
                errorMessage: 'No comments found on this post',
                needsComment: true,
                postId: targetPostId
            };
        }

        // Check vote buttons on the first comment
        // Comments have vote buttons - we need to find them within the comment area (not the main post)
        // The comment section is after the post card
        const commentSection = page.locator('div').filter({ has: page.locator('h2:has-text("Comments")') });

        // Get all vote buttons after the Comments heading
        const allScoreDisplays = page.locator('[data-testid="vote-score"]');
        const scoreCount = await allScoreDisplays.count();

        // If there are more than 1 vote-score elements, the extra ones are on comments
        // (first one is on the post)
        if (scoreCount < 2) {
            return {
                success: false,
                errorMessage: 'No vote buttons found on comments',
                postId: targetPostId
            };
        }

        // Check the second vote score (should be on a comment)
        const commentScoreDisplay = allScoreDisplays.nth(1);
        const hasScore = await commentScoreDisplay.isVisible().catch(() => false);

        // Check for upvote/downvote buttons in the comment area
        // We'll check all buttons and verify there are enough for comments
        const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
        const allDownvoteButtons = page.getByRole('button', { name: 'Downvote' });

        const upvoteCount = await allUpvoteButtons.count();
        const downvoteCount = await allDownvoteButtons.count();

        // If there are 2+ of each, comments have vote buttons
        const hasUpvote = upvoteCount >= 2;
        const hasDownvote = downvoteCount >= 2;

        let scoreValue = null;
        if (hasScore) {
            const scoreText = await commentScoreDisplay.textContent().catch(() => null);
            scoreValue = scoreText !== null ? parseInt(scoreText, 10) : null;
        }

        return {
            success: hasUpvote && hasDownvote && hasScore,
            hasUpvote,
            hasDownvote,
            hasScore,
            scoreValue,
            postId: targetPostId,
            commentCount: scoreCount - 1, // Subtract the post's vote display
            errorMessage: (!hasUpvote || !hasDownvote || !hasScore) ? 'Missing vote button elements on comments' : null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if vote buttons are in neutral state (not active/highlighted)
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, upvoteNeutral, downvoteNeutral }
 */
async function checkVoteButtonsNeutralState(page) {
    try {
        // Navigate to home page (feed)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for post cards to be visible
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

        // Check the first post card
        const firstCard = postCardLocator.first();
        const upvoteButton = firstCard.getByRole('button', { name: 'Upvote' });
        const downvoteButton = firstCard.getByRole('button', { name: 'Downvote' });

        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Check that buttons don't have active/selected state classes
        // In neutral state, buttons should not have special coloring like text-green-500 or text-red-500
        const upvoteClasses = await upvoteButton.getAttribute('class') || '';
        const downvoteClasses = await downvoteButton.getAttribute('class') || '';

        // Neutral state means no active color classes
        const upvoteNeutral = !upvoteClasses.includes('text-green') &&
                             !upvoteClasses.includes('text-emerald') &&
                             !upvoteClasses.includes('text-orange') &&
                             !upvoteClasses.includes('active');

        const downvoteNeutral = !downvoteClasses.includes('text-red') &&
                               !downvoteClasses.includes('text-orange') &&
                               !downvoteClasses.includes('active');

        // Also check aria-pressed attribute if it exists
        const upvotePressed = await upvoteButton.getAttribute('aria-pressed');
        const downvotePressed = await downvoteButton.getAttribute('aria-pressed');

        const upvoteNotPressed = upvotePressed !== 'true';
        const downvoteNotPressed = downvotePressed !== 'true';

        return {
            success: true,
            upvoteNeutral: upvoteNeutral && upvoteNotPressed,
            downvoteNeutral: downvoteNeutral && downvoteNotPressed,
            upvoteClasses,
            downvoteClasses
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check vote count displays zero for a new post
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to check (should be a newly created post)
 * @returns {Promise<Object>} - Returns { success, scoreIsZero, scoreValue }
 */
async function checkZeroVoteCount(page, postId) {
    try {
        let targetPostId = postId;

        if (targetPostId) {
            // Navigate to the specific post detail page
            await page.goto(`/post/${targetPostId}`);
            await page.waitForLoadState('networkidle');
        } else {
            // Navigate to feed
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for vote score element to be visible (works for both feed and detail pages)
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await scoreDisplay.waitFor({ state: 'visible', timeout: 10000 });

        const scoreText = await scoreDisplay.textContent();
        const scoreValue = parseInt(scoreText, 10);
        const scoreIsZero = scoreValue === 0;

        return {
            success: true,
            scoreIsZero,
            scoreValue,
            scoreText
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test post for vote button tests
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, postId, frustration }
 */
async function createTestPostForVoteButtons(page) {
    try {
        // Get a valid category first
        const categoryResult = await getOrCreateTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: `Failed to get category: ${categoryResult.errorMessage}` };
        }

        const frustration = `vote buttons test ${Date.now()}`;
        const identity = `a tester ${Date.now()}`;

        // Create a post via API
        const postResult = await performCreatePostRecordAction(page, {
            mode: 'api',
            frustration: frustration,
            identity: identity,
            categoryId: categoryResult.categoryId
        });

        if (!postResult.success) {
            return { success: false, errorMessage: `Failed to create post: ${postResult.errorMessage}` };
        }

        return {
            success: true,
            postId: postResult.postId,
            frustration: frustration,
            identity: identity,
            categoryId: categoryResult.categoryId
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test comment for vote button tests
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to add comment to
 * @returns {Promise<Object>} - Returns { success, commentId, content }
 */
async function createTestCommentForVoteButtons(page, postId) {
    try {
        const content = `Test comment for vote buttons ${Date.now()}`;

        const commentResult = await performCreateCommentRecordAction(page, {
            mode: 'api',
            postId: postId,
            content: content
        });

        if (!commentResult.success) {
            return { success: false, errorMessage: `Failed to create comment: ${commentResult.errorMessage}` };
        }

        return {
            success: true,
            commentId: commentResult.commentId,
            content: content,
            postId: postId
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get vote button state from a post card
 * @param {Object} page - Playwright page object
 * @param {number} cardIndex - Index of the post card to check (default: 0)
 * @returns {Promise<Object>} - Returns { success, upvoteVisible, downvoteVisible, scoreVisible, scoreValue }
 */
async function getVoteButtonState(page, cardIndex = 0) {
    try {
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const card = postCardLocator.nth(cardIndex);

        const upvoteButton = card.getByRole('button', { name: 'Upvote' });
        const downvoteButton = card.getByRole('button', { name: 'Downvote' });
        const scoreDisplay = card.locator('[data-testid="vote-score"]');

        const upvoteVisible = await upvoteButton.isVisible().catch(() => false);
        const downvoteVisible = await downvoteButton.isVisible().catch(() => false);
        const scoreVisible = await scoreDisplay.isVisible().catch(() => false);

        let scoreValue = null;
        if (scoreVisible) {
            const scoreText = await scoreDisplay.textContent().catch(() => null);
            scoreValue = scoreText !== null ? parseInt(scoreText, 10) : null;
        }

        return {
            success: true,
            upvoteVisible,
            downvoteVisible,
            scoreVisible,
            scoreValue
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowVoteButtonsAction,
    checkVoteButtonsOnFeed,
    checkVoteButtonsOnDetail,
    checkVoteButtonsOnComment,
    checkVoteButtonsNeutralState,
    checkZeroVoteCount,
    createTestPostForVoteButtons,
    createTestCommentForVoteButtons,
    getVoteButtonState,
    // Re-export dependency helpers
    performCreatePostRecordAction,
    performCreateCommentRecordAction,
    getOrCreateTestCategory
};
