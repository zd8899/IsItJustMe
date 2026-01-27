const { performFetchPostByIdAction, createTestPost, getTestCategory } = require('../fetch-post-by-id/fetch-post-by-id.action.js');

/**
 * Show Post Detail Action
 *
 * Handles viewing the full post detail page including post content,
 * vote counts, comments section, and navigation.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.postId - The post ID to navigate to
 * @param {boolean} context.invalidId - If true, use an invalid ID format
 * @param {boolean} context.nonExistentId - If true, use a non-existent but valid format ID
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowPostDetailAction(page, context = {}) {
    try {
        const { postId, invalidId, nonExistentId } = context;

        let idToUse;
        if (invalidId) {
            // Use an obviously invalid ID format
            idToUse = '!@#$%invalid';
        } else if (nonExistentId) {
            // Use a valid CUID format that doesn't exist
            idToUse = 'clxyz123nonexistent456';
        } else {
            idToUse = postId;
        }

        if (!idToUse) {
            return { success: false, errorMessage: 'postId is required' };
        }

        // Navigate to post detail page
        await page.goto(`/post/${idToUse}`);
        await page.waitForLoadState('domcontentloaded');

        // Check for error states or success
        const postDetailLocator = page.locator('h1').filter({ hasText: 'Why is it so hard to' });
        // Look for specific error messages, not just any alert (Next.js dev overlay has empty alerts)
        const postNotFoundLocator = page.getByText('Post not found');
        const invalidIdLocator = page.getByText('Invalid post ID');

        const outcome = await Promise.race([
            postDetailLocator.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            postNotFoundLocator.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'not_found' })),
            invalidIdLocator.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'invalid_id' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'not_found') {
            return { success: false, errorMessage: 'Post not found', errorType: 'not_found' };
        }

        if (outcome.type === 'invalid_id') {
            return { success: false, errorMessage: 'Invalid post ID', errorType: 'invalid_id' };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for post detail to load' };
        }

        return {
            success: true,
            postId: idToUse
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View post detail content and verify all elements are displayed
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasAllElements, elements }
 */
async function viewPostDetailContent(page) {
    try {
        // Wait for the main post heading to be visible
        const postHeading = page.locator('h1').filter({ hasText: 'Why is it so hard to' });
        await postHeading.waitFor({ state: 'visible', timeout: 5000 });

        // Check for all required elements using exact selectors from PostDetail component
        const frustrationText = postHeading;
        const identityText = page.locator('p.text-lg.text-primary-600').filter({ hasText: 'I am' });
        const categoryBadge = page.locator('.px-2.py-1.bg-primary-100.rounded');
        const createdDate = page.locator('.text-sm.text-primary-500 span').last();

        const elements = {
            frustration: await frustrationText.isVisible().catch(() => false),
            identity: await identityText.isVisible().catch(() => false),
            category: await categoryBadge.isVisible().catch(() => false),
            date: await createdDate.isVisible().catch(() => false)
        };

        const allPresent = Object.values(elements).every(v => v === true);

        // Extract content for verification
        const frustrationContent = await frustrationText.textContent().catch(() => null);
        const identityContent = await identityText.textContent().catch(() => null);
        const categoryContent = await categoryBadge.textContent().catch(() => null);

        return {
            success: true,
            hasAllElements: allPresent,
            elements: elements,
            content: {
                frustration: frustrationContent,
                identity: identityContent,
                category: categoryContent
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View vote counts on post detail page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, voteElements, hasAllVoteElements }
 */
async function viewPostDetailVotes(page) {
    try {
        // Wait for the vote buttons component (use first() since there are multiple vote buttons on page)
        const upvoteButton = page.getByRole('button', { name: 'Upvote' }).first();
        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        const downvoteButton = page.getByRole('button', { name: 'Downvote' }).first();
        const scoreDisplay = page.locator('.text-sm.font-medium.text-primary-700').first();

        const voteElements = {
            upvote: await upvoteButton.isVisible().catch(() => false),
            downvote: await downvoteButton.isVisible().catch(() => false),
            score: await scoreDisplay.isVisible().catch(() => false)
        };

        const allPresent = Object.values(voteElements).every(v => v === true);

        // Extract score value
        const scoreText = await scoreDisplay.textContent().catch(() => '0');
        const score = parseInt(scoreText, 10) || 0;

        return {
            success: true,
            voteElements: voteElements,
            hasAllVoteElements: allPresent,
            score: score
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View comments section on post detail page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasCommentsSection, commentCount }
 */
async function viewPostDetailComments(page) {
    try {
        // Look for comments section heading
        const commentsHeading = page.locator('h2').filter({ hasText: /Comments \(\d+\)/ });
        const hasCommentsHeading = await commentsHeading.isVisible().catch(() => false);

        // Look for comment count in post metadata
        const commentCountText = page.locator('.text-sm.text-primary-500').getByText(/\d+ comments/);
        const hasCommentCount = await commentCountText.isVisible().catch(() => false);

        // Look for comment list (individual comment cards)
        const commentCards = page.locator('.bg-white.border.border-primary-200.rounded-lg p.text-primary-800');
        const commentCount = await commentCards.count().catch(() => 0);

        return {
            success: true,
            hasCommentsSection: hasCommentsHeading,
            hasCommentCount: hasCommentCount,
            commentCount: commentCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View nested comments (replies) on post detail page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasNestedComments, parentComments, replyComments }
 */
async function viewNestedComments(page) {
    try {
        // Parent comments (no indentation class)
        const parentComments = page.locator('div:not(.ml-8) > .bg-white.border.border-primary-200.rounded-lg');
        const parentCount = await parentComments.count().catch(() => 0);

        // Nested/reply comments (with indentation - ml-8 class)
        const nestedComments = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        const nestedCount = await nestedComments.count().catch(() => 0);

        return {
            success: true,
            hasNestedComments: nestedCount > 0,
            parentCommentCount: parentCount,
            replyCommentCount: nestedCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check for loading state on post detail page
 *
 * @param {Object} page - Playwright page object
 * @param {string} postId - Post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, errorMessage, loadingVisible }
 */
async function checkLoadingState(page, postId) {
    try {
        // Navigate to post detail page
        await page.goto(`/post/${postId}`);

        // Check for loading indicator - this needs to be fast to catch it
        const loadingLocator = page.getByText('Loading...');

        // Try to catch the loading state (may be very brief)
        const loadingVisible = await loadingLocator.isVisible({ timeout: 1000 }).catch(() => false);

        // Wait for content to load
        await page.waitForLoadState('domcontentloaded');

        return {
            success: true,
            loadingVisible: loadingVisible
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View empty comments state on post detail page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasNoCommentsMessage, hasCommentForm }
 */
async function viewEmptyCommentsState(page) {
    try {
        // Check for "No comments yet" message
        const noCommentsMessage = page.getByText('No comments yet');
        const hasNoCommentsMessage = await noCommentsMessage.isVisible().catch(() => false);

        // Check for comment form (Add a Comment section)
        const commentFormHeading = page.locator('h2').filter({ hasText: 'Add a Comment' });
        const hasCommentForm = await commentFormHeading.isVisible().catch(() => false);

        // Check for textarea in comment form
        const commentTextarea = page.locator('textarea[placeholder="Share your thoughts..."]');
        const hasTextarea = await commentTextarea.isVisible().catch(() => false);

        return {
            success: true,
            hasNoCommentsMessage: hasNoCommentsMessage,
            hasCommentForm: hasCommentForm && hasTextarea
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate back to feed from post detail page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigatedToFeed }
 */
async function navigateBackToFeed(page) {
    try {
        // Look for back navigation link or button
        const backLink = page.getByRole('link', { name: /back/i });
        const backButton = page.getByRole('button', { name: /back/i });
        const homeLink = page.getByRole('link', { name: /home/i });
        const logoLink = page.locator('header a').first();

        // Try different back navigation options
        if (await backLink.isVisible().catch(() => false)) {
            await backLink.click();
        } else if (await backButton.isVisible().catch(() => false)) {
            await backButton.click();
        } else if (await homeLink.isVisible().catch(() => false)) {
            await homeLink.click();
        } else if (await logoLink.isVisible().catch(() => false)) {
            await logoLink.click();
        } else {
            // Fallback: use browser back
            await page.goBack();
        }

        // Wait for navigation to feed
        const outcome = await Promise.race([
            page.waitForURL('**/', { timeout: 5000 }).then(() => ({ type: 'success' })),
            page.waitForURL('**/feed', { timeout: 5000 }).then(() => ({ type: 'success' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for navigation to feed' };
        }

        await page.waitForLoadState('domcontentloaded');

        return {
            success: true,
            navigatedToFeed: true
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test post for viewing detail page
 *
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the post
 * @returns {Promise<Object>} - Returns { success, postId, frustration, identity, categoryId, errorMessage }
 */
async function createTestPostForDetail(page, options = {}) {
    try {
        // First get a valid category
        const categoryResult = await getTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        // Create a test post using the dependency action
        const timestamp = Date.now();
        const postResult = await createTestPost(page, {
            categoryId: options.categoryId || categoryResult.categoryId,
            frustration: options.frustration || `Test frustration for detail ${timestamp}`,
            identity: options.identity || `TestUser_${timestamp}`
        });

        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        return {
            success: true,
            postId: postResult.postId,
            frustration: postResult.frustration,
            identity: postResult.identity,
            categoryId: postResult.categoryId,
            categoryName: categoryResult.categoryName
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get post ID from action result
 *
 * @param {Object} result - Result from performShowPostDetailAction
 * @returns {string|null} - Post ID or null
 */
function getPostIdFromResult(result) {
    return result?.postId || null;
}

/**
 * Helper to extract error type from result
 *
 * @param {Object} result - Result from performShowPostDetailAction
 * @returns {string|null} - Error type ('not_found', 'invalid_id', 'error') or null
 */
function getErrorTypeFromResult(result) {
    return result?.errorType || null;
}

module.exports = {
    performShowPostDetailAction,
    viewPostDetailContent,
    viewPostDetailVotes,
    viewPostDetailComments,
    viewNestedComments,
    checkLoadingState,
    viewEmptyCommentsState,
    navigateBackToFeed,
    createTestPostForDetail,
    getPostIdFromResult,
    getErrorTypeFromResult
};
