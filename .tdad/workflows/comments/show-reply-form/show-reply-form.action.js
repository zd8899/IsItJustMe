const { createTestPostWithComments, createTestComment } = require('../show-comment-card/show-comment-card.action.js');

/**
 * Show Reply Form Action
 *
 * Handles interactions with the reply form on comment cards.
 * Tests the display, validation, and submission of replies.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.postId - The post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowReplyFormAction(page, context = {}) {
    try {
        const { postId } = context;

        if (!postId) {
            return { success: false, errorMessage: 'postId is required' };
        }

        // Navigate to post detail page
        await page.goto(`/post/${postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for comments to load
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        const outcome = await Promise.race([
            commentCard.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            page.getByText('No comments yet').waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'no_comments' })),
            page.getByText('Post not found').waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'not_found' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'not_found') {
            return { success: false, errorMessage: 'Post not found' };
        }

        if (outcome.type === 'no_comments') {
            return { success: false, errorMessage: 'No comments on this post' };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for comments to load' };
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
 * Click Reply button on a comment and verify form appears
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, replyFormVisible, formElements }
 */
async function clickReplyButton(page, commentIndex = 0) {
    try {
        // Get top-level comment cards only (not inside nested containers)
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);
        await commentCard.waitFor({ state: 'visible', timeout: 5000 });

        // Click Reply button
        const replyButton = commentCard.getByRole('button', { name: 'Reply' });
        await replyButton.click();

        // Wait for reply form to appear
        const textarea = commentCard.locator('textarea[placeholder="Share your thoughts..."]');
        const outcome = await Promise.race([
            textarea.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'timeout') {
            return { success: true, replyFormVisible: false };
        }

        // Check for form elements
        const cancelButton = commentCard.getByRole('button', { name: 'Cancel' });
        const postReplyButton = commentCard.getByRole('button', { name: 'Post Reply' });

        const hasCancelButton = await cancelButton.isVisible().catch(() => false);
        const hasPostReplyButton = await postReplyButton.isVisible().catch(() => false);

        return {
            success: true,
            replyFormVisible: true,
            formElements: {
                textarea: true,
                cancelButton: hasCancelButton,
                postReplyButton: hasPostReplyButton
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if textarea is focused in reply form
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, isFocused }
 */
async function checkTextareaFocused(page, commentIndex = 0) {
    try {
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);
        const textarea = commentCard.locator('textarea[placeholder="Share your thoughts..."]');

        await textarea.waitFor({ state: 'visible', timeout: 3000 });

        // Check if textarea is focused
        const isFocused = await textarea.evaluate((el) => document.activeElement === el);

        return {
            success: true,
            isFocused: isFocused
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click Cancel button to close reply form
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, formClosed, replyButtonVisible }
 */
async function clickCancelButton(page, commentIndex = 0) {
    try {
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);

        // Click Cancel button
        const cancelButton = commentCard.getByRole('button', { name: 'Cancel' });
        await cancelButton.click();

        // Wait for form to disappear
        const textarea = commentCard.locator('textarea[placeholder="Share your thoughts..."]');
        await textarea.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

        const isFormVisible = await textarea.isVisible().catch(() => false);

        // Check if Reply button is visible again
        const replyButton = commentCard.getByRole('button', { name: 'Reply' });
        const isReplyButtonVisible = await replyButton.isVisible().catch(() => false);

        return {
            success: true,
            formClosed: !isFormVisible,
            replyButtonVisible: isReplyButtonVisible
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Enter text in reply textarea
 *
 * @param {Object} page - Playwright page object
 * @param {string} text - Text to enter
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage }
 */
async function enterReplyText(page, text, commentIndex = 0) {
    try {
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);
        const textarea = commentCard.locator('textarea[placeholder="Share your thoughts..."]');

        await textarea.waitFor({ state: 'visible', timeout: 3000 });
        await textarea.fill(text);

        return { success: true };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click Post Reply button to submit
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, validationError, isLoading }
 */
async function clickPostReplyButton(page, commentIndex = 0) {
    try {
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);

        // Click Post Reply button
        const postReplyButton = commentCard.getByRole('button', { name: 'Post Reply' });
        await postReplyButton.click();

        // Check for validation error
        const errorMessage = page.getByText(/Comment is required|Comment must be at least/);
        const hasError = await errorMessage.isVisible().catch(() => false);

        let validationError = null;
        if (hasError) {
            validationError = await errorMessage.textContent().catch(() => null);
        }

        // Check if button is disabled (loading state)
        const isDisabled = await postReplyButton.isDisabled().catch(() => false);

        return {
            success: true,
            validationError: validationError,
            isLoading: isDisabled
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if reply form is visible on a comment
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, isFormVisible }
 */
async function isReplyFormVisible(page, commentIndex = 0) {
    try {
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);
        const textarea = commentCard.locator('textarea[placeholder="Share your thoughts..."]');

        const isVisible = await textarea.isVisible().catch(() => false);

        return {
            success: true,
            isFormVisible: isVisible
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get textarea content
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, content }
 */
async function getTextareaContent(page, commentIndex = 0) {
    try {
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);
        const textarea = commentCard.locator('textarea[placeholder="Share your thoughts..."]');

        await textarea.waitFor({ state: 'visible', timeout: 3000 });
        const content = await textarea.inputValue();

        return {
            success: true,
            content: content
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if loading indicator is visible
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasLoadingIndicator, isButtonDisabled }
 */
async function checkLoadingState(page, commentIndex = 0) {
    try {
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const commentCard = topLevelComments.nth(commentIndex);

        // Check for loading indicator (spinner, "Posting..." text, etc.)
        const loadingIndicator = commentCard.getByText(/Posting|Loading|Submitting/i);
        const spinnerIndicator = commentCard.locator('[data-testid="loading-spinner"], .animate-spin');

        const hasLoadingText = await loadingIndicator.isVisible().catch(() => false);
        const hasSpinner = await spinnerIndicator.isVisible().catch(() => false);

        // Check if Post Reply button is disabled
        const postReplyButton = commentCard.getByRole('button', { name: 'Post Reply' });
        const isDisabled = await postReplyButton.isDisabled().catch(() => false);

        return {
            success: true,
            hasLoadingIndicator: hasLoadingText || hasSpinner,
            isButtonDisabled: isDisabled
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if nested comment has no Reply button
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, nestedHasNoReplyButton }
 */
async function checkNestedCommentNoReplyButton(page) {
    try {
        // Look for nested comments (inside ml-8 container)
        const nestedContainer = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        const hasNestedComments = await nestedContainer.first().isVisible().catch(() => false);

        if (!hasNestedComments) {
            return {
                success: true,
                nestedHasNoReplyButton: true,
                hasNestedComments: false
            };
        }

        // Get the nested comment card
        const nestedCommentCard = nestedContainer.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        const nestedCardVisible = await nestedCommentCard.isVisible().catch(() => false);

        if (!nestedCardVisible) {
            return {
                success: true,
                nestedHasNoReplyButton: true,
                hasNestedComments: false
            };
        }

        // Check if nested comment has NO reply button
        const nestedReplyButton = nestedCommentCard.getByRole('button', { name: 'Reply' });
        const hasReplyButton = await nestedReplyButton.isVisible().catch(() => false);

        return {
            success: true,
            nestedHasNoReplyButton: !hasReplyButton,
            hasNestedComments: true
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create test setup with post and comments
 *
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options
 * @param {boolean} options.withNestedReplies - Create nested replies
 * @param {number} options.commentCount - Number of top-level comments to create
 * @returns {Promise<Object>} - Returns { success, postId, comments, errorMessage }
 */
async function createTestSetup(page, options = {}) {
    try {
        const { withNestedReplies = false, commentCount = 1 } = options;

        // Create post with comments using the dependency action
        const result = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true,
            withNestedReplies: withNestedReplies
        });

        if (!result.success) {
            return { success: false, errorMessage: result.errorMessage };
        }

        // Create additional comments if needed
        const additionalComments = [];
        for (let i = 1; i < commentCount; i++) {
            const comment = await createTestComment(page, {
                postId: result.postId,
                content: `Additional comment ${i} - ${Date.now()}`
            });
            if (comment.success) {
                additionalComments.push(comment);
            }
        }

        return {
            success: true,
            postId: result.postId,
            comments: [...result.comments, ...additionalComments]
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowReplyFormAction,
    clickReplyButton,
    checkTextareaFocused,
    clickCancelButton,
    enterReplyText,
    clickPostReplyButton,
    isReplyFormVisible,
    getTextareaContent,
    checkLoadingState,
    checkNestedCommentNoReplyButton,
    createTestSetup,
    // Re-export dependencies for convenience
    createTestPostWithComments,
    createTestComment
};
