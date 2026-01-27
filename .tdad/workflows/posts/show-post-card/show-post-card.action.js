/**
 * Show Post Card Action
 *
 * Handles viewing post cards in the feed. Tests that post cards display all
 * required information including frustration text, identity, category, votes,
 * comments, date, and author information.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowPostCardAction(page, context = {}) {
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
            return { success: false, errorMessage: 'No posts found in the feed' };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for post cards to load' };
        }

        // Count the number of post cards
        const postCount = await postCardLocator.count();

        return {
            success: true,
            postCount: postCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View post card and verify essential information is displayed
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional cardIndex
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasAllElements }
 */
async function viewPostCardEssentialInfo(page, context = {}) {
    try {
        const { cardIndex = 0 } = context;

        // Use the exact same locator pattern as the test for consistency
        const firstCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();

        // Wait for the card to be visible with h3 content (ensures full render)
        await firstCard.locator('h3').waitFor({ state: 'visible', timeout: 5000 });

        // Use exact same selectors as the test assertions (lines 32-49)
        const frustrationText = firstCard.locator('h3');
        const identityText = firstCard.locator('p.text-sm.text-primary-600');
        const categoryBadge = firstCard.locator('.bg-primary-100.rounded');
        // Score selector must be span-specific to avoid matching buttons (which also have these classes)
        const voteScore = firstCard.locator('span.text-sm.font-medium.text-primary-700');
        const commentCount = firstCard.getByText(/\d+ comments/);
        const dateSpan = firstCard.locator('.text-xs.text-primary-500 span').last();

        // Check visibility with catch (elements should already be rendered)
        const hasAllElements = {
            frustration: await frustrationText.isVisible().catch(() => false),
            identity: await identityText.isVisible().catch(() => false),
            category: await categoryBadge.isVisible().catch(() => false),
            score: await voteScore.isVisible().catch(() => false),
            comments: await commentCount.isVisible().catch(() => false),
            date: await dateSpan.isVisible().catch(() => false)
        };

        const allPresent = Object.values(hasAllElements).every(v => v === true);

        return {
            success: true,
            hasAllElements: hasAllElements,
            allElementsPresent: allPresent
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View post card vote buttons
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional cardIndex
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasVoteButtons }
 */
async function viewPostCardVoteButtons(page, context = {}) {
    try {
        const { cardIndex = 0 } = context;

        // Use the exact same locator pattern as the test for consistency
        const firstCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();

        // Wait for the upvote button to be visible (ensures full render)
        await firstCard.getByRole('button', { name: 'Upvote' }).waitFor({ state: 'visible', timeout: 5000 });

        // Use exact same selectors as the test assertions (lines 66-72)
        const upvoteButton = firstCard.getByRole('button', { name: 'Upvote' });
        const downvoteButton = firstCard.getByRole('button', { name: 'Downvote' });
        // Score selector must be span-specific to avoid matching buttons (which also have these classes)
        const scoreDisplay = firstCard.locator('span.text-sm.font-medium.text-primary-700');

        // Check visibility with catch (elements should already be rendered)
        const hasVoteButtons = {
            upvote: await upvoteButton.isVisible().catch(() => false),
            downvote: await downvoteButton.isVisible().catch(() => false),
            score: await scoreDisplay.isVisible().catch(() => false)
        };

        const allPresent = Object.values(hasVoteButtons).every(v => v === true);

        return {
            success: true,
            hasVoteButtons: hasVoteButtons,
            allVoteElementsPresent: allPresent
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View anonymous post card and verify author display
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasAnonymousAuthor }
 */
async function viewAnonymousPostCard(page, context = {}) {
    try {
        // Navigate to home page (feed)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for post cards to be visible
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

        // Look for a card with "Anonymous" text
        const anonymousCard = postCardLocator.filter({ hasText: 'Anonymous' }).first();
        const hasAnonymousAuthor = await anonymousCard.isVisible().catch(() => false);

        return {
            success: true,
            hasAnonymousAuthor: hasAnonymousAuthor
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View registered user post card and verify author display
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasUsernameAuthor, username }
 */
async function viewRegisteredUserPostCard(page, context = {}) {
    try {
        // Navigate to home page (feed)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for post cards to be visible
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

        // Look for a card with "by [username]" pattern
        const userCard = postCardLocator.filter({ hasText: /by \w+/ }).first();
        const hasUsernameAuthor = await userCard.isVisible().catch(() => false);

        let username = null;
        if (hasUsernameAuthor) {
            // Extract the username from the card
            const authorText = await userCard.locator('.text-xs.text-primary-500').getByText(/by \w+/).textContent();
            if (authorText) {
                const match = authorText.match(/by (\w+)/);
                if (match) {
                    username = match[1];
                }
            }
        }

        return {
            success: true,
            hasUsernameAuthor: hasUsernameAuthor,
            username: username
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click on post card and verify navigation to detail page
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional cardIndex
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigatedToDetail, postId }
 */
async function clickPostCardAndNavigate(page, context = {}) {
    try {
        const { cardIndex = 0 } = context;

        // Navigate to home page (feed)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for post cards to be visible
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

        const card = postCardLocator.nth(cardIndex);

        // Get the link inside the card (the clickable area that leads to detail page)
        const link = card.locator('a[href^="/post/"]');
        await link.click();

        // Wait for navigation to detail page
        const outcome = await Promise.race([
            page.waitForURL('**/post/**', { timeout: 5000 }).then(() => ({ type: 'success' })),
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for navigation to detail page' };
        }

        await page.waitForLoadState('domcontentloaded');

        // Extract post ID from URL
        const url = page.url();
        const postIdMatch = url.match(/\/post\/([^/]+)/);
        const postId = postIdMatch ? postIdMatch[1] : null;

        return {
            success: true,
            navigatedToDetail: true,
            postId: postId
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View post card comment count display
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional cardIndex
 * @returns {Promise<Object>} - Returns { success, errorMessage, commentCountText, commentCount }
 */
async function viewPostCardCommentCount(page, context = {}) {
    try {
        const { cardIndex = 0 } = context;

        // Navigate to home page (feed)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for post cards to be visible
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

        const card = postCardLocator.nth(cardIndex);

        // Find the comment count text
        const commentCountLocator = card.getByText(/\d+ comments/);
        const isVisible = await commentCountLocator.isVisible();

        let commentCountText = null;
        let commentCount = null;

        if (isVisible) {
            commentCountText = await commentCountLocator.textContent();
            const match = commentCountText.match(/(\d+) comments/);
            if (match) {
                commentCount = parseInt(match[1], 10);
            }
        }

        return {
            success: true,
            commentCountVisible: isVisible,
            commentCountText: commentCountText,
            commentCount: commentCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get post card data for verification
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional cardIndex
 * @returns {Promise<Object>} - Returns { success, errorMessage, postData }
 */
async function getPostCardData(page, context = {}) {
    try {
        const { cardIndex = 0 } = context;

        // Navigate to home page (feed)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for post cards to be visible
        const postCardLocator = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await postCardLocator.first().waitFor({ state: 'visible', timeout: 5000 });

        const card = postCardLocator.nth(cardIndex);

        // Extract data from the card
        const frustrationEl = card.locator('h3');
        const identityEl = card.locator('p.text-sm.text-primary-600');
        const categoryEl = card.locator('.bg-primary-100.rounded');
        const scoreEl = card.locator('.text-sm.font-medium.text-primary-700');
        const commentsEl = card.getByText(/\d+ comments/);

        const postData = {
            frustration: await frustrationEl.textContent().catch(() => null),
            identity: await identityEl.textContent().catch(() => null),
            category: await categoryEl.textContent().catch(() => null),
            score: await scoreEl.textContent().catch(() => null),
            commentCount: await commentsEl.textContent().catch(() => null)
        };

        return {
            success: true,
            postData: postData
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowPostCardAction,
    viewPostCardEssentialInfo,
    viewPostCardVoteButtons,
    viewAnonymousPostCard,
    viewRegisteredUserPostCard,
    clickPostCardAndNavigate,
    viewPostCardCommentCount,
    getPostCardData
};
