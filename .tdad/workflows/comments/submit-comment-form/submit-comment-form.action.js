const { performShowCommentFormAction, createTestPostForDetail, typeInCommentTextarea } = require('../show-comment-form/show-comment-form.action.js');
const { performCreateCommentRecordAction, createParentComment, getPostDetails, createTestPostForComment } = require('../create-comment-record/create-comment-record.action.js');

/**
 * Submit Comment Form Action
 *
 * Handles comment form submission for both API and UI testing scenarios.
 * Supports creating comments and replies with validation.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing, 'ui' for UI testing
 * @param {string} context.postId - Post ID to add comment to
 * @param {string} context.content - Comment content to submit
 * @param {string} context.parentId - Optional parent comment ID for replies
 * @param {boolean} context.emptyContent - If true, submit without content
 * @param {boolean} context.overMaxContent - If true, submit content exceeding 2000 chars
 * @param {boolean} context.useNonExistentPost - If true, use non-existent post ID
 * @param {boolean} context.useNonExistentParent - If true, use non-existent parent ID
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, commentId }
 */
async function performSubmitCommentFormAction(page, context = {}) {
    try {
        const {
            mode,
            postId,
            content,
            parentId,
            emptyContent,
            overMaxContent,
            useNonExistentPost,
            useNonExistentParent
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            // Build request data
            const requestData = {
                postId: useNonExistentPost ? 'cnonexistentpostid12345' : postId
            };

            // Handle content
            if (overMaxContent) {
                requestData.content = 'x'.repeat(2001);
            } else if (emptyContent) {
                requestData.content = '';
            } else if (content !== undefined) {
                requestData.content = content;
            }

            // Add parentId if provided
            if (parentId !== undefined) {
                requestData.parentId = useNonExistentParent ? 'cnonexistentparent12345' : parentId;
            }

            const response = await page.request.post('/api/comments', {
                data: requestData
            });

            const status = response.status();
            let body = null;

            try {
                body = await response.json();
            } catch (e) {
                body = await response.text();
            }

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                commentId: body?.id || null,
                content: body?.content || null,
                postId: body?.postId || null,
                parentId: body?.parentId || null,
                upvotes: body?.upvotes,
                downvotes: body?.downvotes,
                score: body?.score,
                createdAt: body?.createdAt || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Comment submission failed') : null
            };
        }

        // ==========================================
        // UI MODE - Browser interaction
        // ==========================================
        // Ensure we're on a post detail page with comment form
        let targetPostId = postId;

        if (!targetPostId) {
            // Create a test post and navigate to it
            const showFormResult = await performShowCommentFormAction(page, {});
            if (!showFormResult.success) {
                return { success: false, errorMessage: `Failed to show comment form: ${showFormResult.errorMessage}` };
            }
            targetPostId = showFormResult.postId;
        } else {
            // Navigate to the specific post
            await page.goto(`/post/${targetPostId}`);
            await page.waitForLoadState('domcontentloaded');
        }

        // Determine which textarea and button to use (main form vs reply form)
        let textareaLocator;
        let replyButton;

        if (parentId) {
            // For replies, we need to click the Reply button on the parent comment first
            const parentComment = page.locator(`[data-comment-id="${parentId}"]`).first();
            const parentExists = await parentComment.count() > 0;

            if (!parentExists) {
                // Try to find comment by content instead
                const replyButtonOnComment = page.getByRole('button', { name: 'Reply' }).first();
                await replyButtonOnComment.click();
                await page.waitForLoadState('domcontentloaded');
            }

            // Use the reply form textarea
            textareaLocator = page.locator('textarea[placeholder="Share your thoughts..."]').last();
            replyButton = page.getByRole('button', { name: /Reply|Post Reply/ }).last();
        } else {
            // Use the main comment form
            textareaLocator = page.locator('textarea[placeholder="Share your thoughts..."]').first();
            replyButton = page.getByRole('button', { name: 'Reply' }).first();
        }

        // Handle content input
        if (!emptyContent && content !== undefined) {
            const textToType = overMaxContent ? 'x'.repeat(2001) : content;
            await textareaLocator.fill(textToType);
        }

        // Click the Reply button
        await replyButton.click();

        // Wait for response using Promise.race
        const errorLocator = page.locator('.text-red-500');
        const outcome = await Promise.race([
            // Success: comment appears in the list
            page.locator('.bg-white.border').filter({ hasText: content || '' }).first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            // Loading spinner disappears (form submission complete)
            replyButton.waitFor({ state: 'visible', timeout: 5000 }).then(async () => {
                // Check if there's an error message
                const hasError = await errorLocator.first().isVisible().catch(() => false);
                if (hasError) {
                    return { type: 'error' };
                }
                // Check if textarea is cleared (success indicator)
                const textareaValue = await textareaLocator.inputValue().catch(() => '');
                if (textareaValue === '') {
                    return { type: 'success' };
                }
                return { type: 'pending' };
            })
        ]).catch(() => ({ type: 'timeout' }));

        // Handle error outcome
        if (outcome.type === 'error') {
            const errorMsg = await errorLocator.first().textContent().catch(() => 'Unknown error');
            return {
                success: false,
                errorMessage: errorMsg,
                postId: targetPostId
            };
        }

        if (outcome.type === 'timeout') {
            return {
                success: false,
                errorMessage: 'Timeout waiting for comment submission',
                postId: targetPostId
            };
        }

        // Verify textarea is cleared (indicates successful submission)
        await page.waitForLoadState('domcontentloaded');
        const textareaValue = await textareaLocator.inputValue().catch(() => null);
        const textareaCleared = textareaValue === '';

        return {
            success: textareaCleared,
            postId: targetPostId,
            content: content,
            textareaCleared: textareaCleared,
            errorMessage: textareaCleared ? null : 'Comment form was not cleared after submission'
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Submit comment via UI and verify it appears in the list
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with postId and content
 * @returns {Promise<Object>} - Returns { success, errorMessage, commentVisible }
 */
async function submitCommentAndVerifyInList(page, context = {}) {
    try {
        const { postId, content } = context;
        const uniqueContent = content || `Test comment ${Date.now()}`;

        // First ensure we're on the post detail page
        const showFormResult = await performShowCommentFormAction(page, { postId });
        if (!showFormResult.success) {
            return { success: false, errorMessage: showFormResult.errorMessage };
        }

        // Fill in the comment
        const textarea = page.locator('textarea[placeholder="Share your thoughts..."]').first();
        await textarea.fill(uniqueContent);

        // Click Reply
        const replyButton = page.getByRole('button', { name: 'Reply' }).first();
        await replyButton.click();

        // Wait for the comment to appear in the list
        const commentInList = page.locator('.bg-white.border').filter({ hasText: uniqueContent });

        try {
            await commentInList.first().waitFor({ state: 'visible', timeout: 10000 });
        } catch (e) {
            // Check for error message
            const errorMsg = await page.locator('.text-red-500').first().textContent().catch(() => null);
            if (errorMsg) {
                return { success: false, errorMessage: errorMsg };
            }
            return { success: false, errorMessage: 'Comment did not appear in the list' };
        }

        return {
            success: true,
            postId: showFormResult.postId,
            content: uniqueContent,
            commentVisible: true
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if the Reply button shows loading state
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, hasLoadingState }
 */
async function checkReplyButtonLoadingState(page) {
    try {
        const replyButton = page.getByRole('button', { name: 'Reply' }).first();
        const loadingSpinner = page.locator('[data-testid="loading-spinner"]');

        // Check if loading spinner is visible when button is clicked
        const hasSpinner = await loadingSpinner.isVisible().catch(() => false);

        return {
            success: true,
            hasLoadingState: hasSpinner
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Submit reply to an existing comment via UI
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with postId, parentCommentContent, and replyContent
 * @returns {Promise<Object>} - Returns { success, errorMessage, replyVisible }
 */
async function submitReplyToComment(page, context = {}) {
    try {
        const { postId, replyContent } = context;
        const uniqueReply = replyContent || `Test reply ${Date.now()}`;

        // Ensure we're on a post detail page
        const showFormResult = await performShowCommentFormAction(page, { postId });
        if (!showFormResult.success) {
            return { success: false, errorMessage: showFormResult.errorMessage };
        }

        // First, create a parent comment via API to reply to
        const parentResult = await performCreateCommentRecordAction(page, {
            mode: 'api',
            postId: showFormResult.postId,
            content: `Parent comment for reply test ${Date.now()}`
        });

        if (!parentResult.success) {
            return { success: false, errorMessage: `Failed to create parent comment: ${parentResult.errorMessage}` };
        }

        // Refresh the page to see the new comment
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // Find and click the Reply button on the comment
        const replyButtonOnComment = page.getByRole('button', { name: 'Reply' }).filter({ hasNotText: /Post Reply/ });
        const replyButtons = await replyButtonOnComment.all();

        if (replyButtons.length === 0) {
            return { success: false, errorMessage: 'No Reply button found on comments' };
        }

        // Click the first Reply button (on the comment, not the main form)
        // The comment card reply buttons are smaller/ghost variant
        const commentReplyButton = page.locator('button').filter({ hasText: 'Reply' }).last();
        await commentReplyButton.click();

        // Wait for reply form to appear
        await page.waitForLoadState('domcontentloaded');

        // Find the reply textarea (should be the second one now)
        const replyTextarea = page.locator('textarea[placeholder="Share your thoughts..."]').last();
        await replyTextarea.fill(uniqueReply);

        // Click Post Reply button
        const postReplyButton = page.getByRole('button', { name: /Post Reply/ });
        await postReplyButton.click();

        // Wait for the reply to appear
        const replyInList = page.locator('.ml-8').filter({ hasText: uniqueReply });

        try {
            await replyInList.first().waitFor({ state: 'visible', timeout: 10000 });
        } catch (e) {
            const errorMsg = await page.locator('.text-red-500').last().textContent().catch(() => null);
            if (errorMsg) {
                return { success: false, errorMessage: errorMsg };
            }
            return { success: false, errorMessage: 'Reply did not appear under parent comment' };
        }

        return {
            success: true,
            postId: showFormResult.postId,
            parentCommentId: parentResult.commentId,
            replyContent: uniqueReply,
            replyVisible: true
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get validation error message from the form
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, validationError }
 */
async function getValidationError(page) {
    try {
        const errorLocator = page.locator('.text-red-500');

        try {
            await errorLocator.first().waitFor({ state: 'visible', timeout: 3000 });
            const errorText = await errorLocator.first().textContent();
            return {
                success: true,
                validationError: errorText
            };
        } catch (e) {
            return {
                success: true,
                validationError: null
            };
        }

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get comment ID from action result
 * @param {Object} result - Result from performSubmitCommentFormAction
 * @returns {string|null} - Comment ID or null
 */
function getCommentIdFromResult(result) {
    return result?.commentId || result?.body?.id || null;
}

/**
 * Helper to get error message from action result
 * @param {Object} result - Result from performSubmitCommentFormAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

module.exports = {
    performSubmitCommentFormAction,
    submitCommentAndVerifyInList,
    checkReplyButtonLoadingState,
    submitReplyToComment,
    getValidationError,
    getCommentIdFromResult,
    getErrorFromResult,
    // Re-export dependency helpers for convenience
    performShowCommentFormAction,
    createTestPostForDetail,
    performCreateCommentRecordAction,
    createParentComment,
    getPostDetails,
    createTestPostForComment
};
