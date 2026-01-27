const { performShowPostDetailAction, createTestPostForDetail } = require('../../posts/show-post-detail/show-post-detail.action.js');

/**
 * Show Comment Form Action
 *
 * Navigates to a post detail page and verifies the comment form is displayed
 * with all required elements (textarea and Reply button).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.postId - The post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, errorMessage, postId, formElements }
 */
async function performShowCommentFormAction(page, context = {}) {
    try {
        let { postId } = context;

        // If no postId provided, create a test post first
        if (!postId) {
            const createResult = await createTestPostForDetail(page);
            if (!createResult.success) {
                return { success: false, errorMessage: `Failed to create test post: ${createResult.errorMessage}` };
            }
            postId = createResult.postId;
        }

        // Navigate to post detail page
        const showDetailResult = await performShowPostDetailAction(page, { postId });
        if (!showDetailResult.success) {
            return { success: false, errorMessage: showDetailResult.errorMessage };
        }

        // Wait for page to stabilize
        await page.waitForLoadState('domcontentloaded');

        // Look for the comment form section
        const commentFormHeading = page.locator('h2').filter({ hasText: 'Add a Comment' });

        try {
            await commentFormHeading.waitFor({ state: 'visible', timeout: 5000 });
        } catch (e) {
            return { success: false, errorMessage: 'Comment form section not found on post detail page' };
        }

        // Verify all form elements are visible
        const commentTextarea = page.locator('textarea[placeholder="Share your thoughts..."]');
        const replyButton = page.getByRole('button', { name: 'Reply' });

        const textareaVisible = await commentTextarea.isVisible().catch(() => false);
        const replyButtonVisible = await replyButton.isVisible().catch(() => false);

        if (!textareaVisible) {
            return { success: false, errorMessage: 'Comment textarea not visible' };
        }

        if (!replyButtonVisible) {
            return { success: false, errorMessage: 'Reply button not visible' };
        }

        return {
            success: true,
            postId: postId,
            formElements: {
                hasCommentTextarea: textareaVisible,
                hasReplyButton: replyButtonVisible
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate to post detail and verify comment form is visible
 * (for anonymous user scenario - same behavior since auth is not required)
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional postId
 * @returns {Promise<Object>} - Returns { success, errorMessage, postId }
 */
async function navigateToPostDetailForComment(page, context = {}) {
    try {
        let { postId } = context;

        // If no postId provided, create a test post first
        if (!postId) {
            const createResult = await createTestPostForDetail(page);
            if (!createResult.success) {
                return { success: false, errorMessage: `Failed to create test post: ${createResult.errorMessage}` };
            }
            postId = createResult.postId;
        }

        // Navigate to post detail page
        await page.goto(`/post/${postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for post content to load
        const postHeading = page.locator('h1').filter({ hasText: 'Why is it so hard to' });

        try {
            await postHeading.waitFor({ state: 'visible', timeout: 5000 });
        } catch (e) {
            const errorLocator = page.getByRole('alert');
            const errorVisible = await errorLocator.first().isVisible().catch(() => false);
            if (errorVisible) {
                const msg = await errorLocator.first().textContent();
                return { success: false, errorMessage: msg };
            }
            return { success: false, errorMessage: 'Post detail page did not load properly' };
        }

        return {
            success: true,
            postId: postId
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Type text into the comment textarea
 *
 * @param {Object} page - Playwright page object
 * @param {string} text - Text to type into the textarea
 * @returns {Promise<Object>} - Returns { success, errorMessage, typedText }
 */
async function typeInCommentTextarea(page, text) {
    try {
        const commentTextarea = page.locator('textarea[placeholder="Share your thoughts..."]');

        await commentTextarea.waitFor({ state: 'visible', timeout: 5000 });
        await commentTextarea.fill(text);

        // Verify the text was entered
        const enteredText = await commentTextarea.inputValue();

        return {
            success: true,
            typedText: enteredText
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get the placeholder text of the comment textarea
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, placeholder }
 */
async function getCommentTextareaPlaceholder(page) {
    try {
        const commentTextarea = page.locator('textarea[placeholder="Share your thoughts..."]');

        await commentTextarea.waitFor({ state: 'visible', timeout: 5000 });
        const placeholder = await commentTextarea.getAttribute('placeholder');

        return {
            success: true,
            placeholder: placeholder
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if the Reply button is enabled
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, isEnabled }
 */
async function checkReplyButtonEnabled(page) {
    try {
        const replyButton = page.getByRole('button', { name: 'Reply' });

        await replyButton.waitFor({ state: 'visible', timeout: 5000 });
        const isDisabled = await replyButton.isDisabled();

        return {
            success: true,
            isEnabled: !isDisabled
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Verify comment form elements are visible
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, elements }
 */
async function verifyCommentFormElements(page) {
    try {
        const commentTextarea = page.locator('textarea[placeholder="Share your thoughts..."]');
        const replyButton = page.getByRole('button', { name: 'Reply' });

        const textareaVisible = await commentTextarea.isVisible().catch(() => false);
        const replyButtonVisible = await replyButton.isVisible().catch(() => false);

        return {
            success: true,
            elements: {
                textareaVisible: textareaVisible,
                replyButtonVisible: replyButtonVisible
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get the post ID for testing
 *
 * @param {Object} result - Result from performShowCommentFormAction
 * @returns {string|null} - Post ID or null
 */
function getPostIdFromResult(result) {
    return result?.postId || null;
}

module.exports = {
    performShowCommentFormAction,
    navigateToPostDetailForComment,
    typeInCommentTextarea,
    getCommentTextareaPlaceholder,
    checkReplyButtonEnabled,
    verifyCommentFormElements,
    getPostIdFromResult,
    // Re-export dependencies
    createTestPostForDetail
};
