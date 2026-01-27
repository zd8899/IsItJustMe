const { createTestPost, getTestCategory } = require('../../posts/fetch-post-by-id/fetch-post-by-id.action.js');

/**
 * Show Comment Card Action
 *
 * Handles viewing and interacting with comment cards on post detail pages.
 * Verifies comment card elements like content, vote score, author, date, and reply buttons.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.postId - The post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowCommentCardAction(page, context = {}) {
    try {
        const { postId } = context;

        if (!postId) {
            return { success: false, errorMessage: 'postId is required' };
        }

        // Navigate to post detail page
        await page.goto(`/post/${postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for the post detail to load
        const postHeading = page.locator('h1').filter({ hasText: 'Why is it so hard to' });
        const outcome = await Promise.race([
            postHeading.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            page.getByText('Post not found').waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'not_found' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'not_found') {
            return { success: false, errorMessage: 'Post not found' };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for post to load' };
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
 * View comment card elements (content, score, author, date)
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasAllElements, elements }
 */
async function viewCommentCardElements(page) {
    try {
        // Wait for at least one comment card to be visible
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await commentCard.waitFor({ state: 'visible', timeout: 5000 });

        // Check for comment content
        const contentLocator = commentCard.locator('p.text-primary-800');
        const hasContent = await contentLocator.isVisible().catch(() => false);

        // Check for vote score (inside VoteButtons)
        const scoreLocator = commentCard.locator('.text-sm.font-medium.text-primary-700');
        const hasScore = await scoreLocator.isVisible().catch(() => false);

        // Check for author name
        const authorLocator = commentCard.locator('.text-xs.text-primary-500 span').first();
        const hasAuthor = await authorLocator.isVisible().catch(() => false);

        // Check for date
        const dateLocator = commentCard.locator('.text-xs.text-primary-500 span').last();
        const hasDate = await dateLocator.isVisible().catch(() => false);

        const elements = {
            content: hasContent,
            score: hasScore,
            author: hasAuthor,
            date: hasDate
        };

        const allPresent = Object.values(elements).every(v => v === true);

        // Extract content for verification
        const contentText = await contentLocator.textContent().catch(() => null);
        const scoreText = await scoreLocator.textContent().catch(() => null);
        const authorText = await authorLocator.textContent().catch(() => null);
        const dateText = await dateLocator.textContent().catch(() => null);

        return {
            success: true,
            hasAllElements: allPresent,
            elements: elements,
            content: {
                text: contentText,
                score: scoreText,
                author: authorText,
                date: dateText
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View comment card vote buttons
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasAllVoteElements, voteElements }
 */
async function viewCommentVoteButtons(page) {
    try {
        // Wait for at least one comment card to be visible
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await commentCard.waitFor({ state: 'visible', timeout: 5000 });

        // Check for upvote button
        const upvoteButton = commentCard.getByRole('button', { name: 'Upvote' });
        const hasUpvote = await upvoteButton.isVisible().catch(() => false);

        // Check for downvote button
        const downvoteButton = commentCard.getByRole('button', { name: 'Downvote' });
        const hasDownvote = await downvoteButton.isVisible().catch(() => false);

        // Check for score display
        const scoreLocator = commentCard.locator('.text-sm.font-medium.text-primary-700');
        const hasScore = await scoreLocator.isVisible().catch(() => false);

        const voteElements = {
            upvote: hasUpvote,
            downvote: hasDownvote,
            score: hasScore
        };

        const allPresent = Object.values(voteElements).every(v => v === true);

        // Extract score value
        const scoreText = await scoreLocator.textContent().catch(() => '0');
        const score = parseInt(scoreText, 10) || 0;

        return {
            success: true,
            hasAllVoteElements: allPresent,
            voteElements: voteElements,
            score: score
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View comment author name
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, authorName, isAnonymous }
 */
async function viewCommentAuthor(page, commentIndex = 0) {
    try {
        // Get comment card by index
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').nth(commentIndex);
        await commentCard.waitFor({ state: 'visible', timeout: 5000 });

        // Get author name from metadata section
        const authorLocator = commentCard.locator('.text-xs.text-primary-500 span').first();
        const authorName = await authorLocator.textContent().catch(() => null);

        return {
            success: true,
            authorName: authorName?.trim() || null,
            isAnonymous: authorName?.trim() === 'Anonymous'
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if reply button is visible on a comment
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasReplyButton }
 */
async function checkReplyButton(page, commentIndex = 0) {
    try {
        // Get comment card by index
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').nth(commentIndex);
        await commentCard.waitFor({ state: 'visible', timeout: 5000 });

        // Check for Reply button
        const replyButton = commentCard.getByRole('button', { name: 'Reply' });
        const hasReplyButton = await replyButton.isVisible().catch(() => false);

        return {
            success: true,
            hasReplyButton: hasReplyButton
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if nested reply does not have a reply button (max depth reached)
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, nestedReplyHasNoReplyButton }
 */
async function checkNestedReplyNoReplyButton(page) {
    try {
        // Look for nested comments (inside ml-8 container)
        const nestedContainer = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        const hasNestedComments = await nestedContainer.first().isVisible().catch(() => false);

        if (!hasNestedComments) {
            return {
                success: true,
                nestedReplyHasNoReplyButton: true, // No nested comments, so no reply buttons on nested
                hasNestedComments: false
            };
        }

        // Get the nested comment card
        const nestedCommentCard = nestedContainer.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        const nestedCardVisible = await nestedCommentCard.isVisible().catch(() => false);

        if (!nestedCardVisible) {
            return {
                success: true,
                nestedReplyHasNoReplyButton: true,
                hasNestedComments: false
            };
        }

        // Check if nested comment has NO reply button (depth >= 1)
        const nestedReplyButton = nestedCommentCard.getByRole('button', { name: 'Reply' });
        const hasReplyButton = await nestedReplyButton.isVisible().catch(() => false);

        return {
            success: true,
            nestedReplyHasNoReplyButton: !hasReplyButton,
            hasNestedComments: true
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View nested replies structure
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasParentComment, hasNestedReplies, nestedCount }
 */
async function viewNestedReplies(page) {
    try {
        // Check for parent comments (top-level)
        const parentComments = page.locator('.space-y-4 > div:not(.ml-8)').locator('.bg-white.border.border-primary-200.rounded-lg');
        const parentCount = await parentComments.count().catch(() => 0);

        // Check for nested replies (with ml-8 indentation)
        const nestedContainers = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        const nestedCount = await nestedContainers.count().catch(() => 0);

        return {
            success: true,
            hasParentComment: parentCount > 0,
            hasNestedReplies: nestedCount > 0,
            parentCount: parentCount,
            nestedCount: nestedCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click reply button and check for reply form
 *
 * @param {Object} page - Playwright page object
 * @param {number} commentIndex - Index of the comment (0-based)
 * @returns {Promise<Object>} - Returns { success, errorMessage, replyFormVisible }
 */
async function clickReplyAndCheckForm(page, commentIndex = 0) {
    try {
        // Get comment card by index
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').nth(commentIndex);
        await commentCard.waitFor({ state: 'visible', timeout: 5000 });

        // Click Reply button
        const replyButton = commentCard.getByRole('button', { name: 'Reply' });
        await replyButton.click();

        // Wait for reply form to appear (textarea with "Share your thoughts...")
        const replyForm = commentCard.locator('textarea[placeholder="Share your thoughts..."]');
        const outcome = await Promise.race([
            replyForm.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'timeout') {
            return { success: true, replyFormVisible: false };
        }

        // Also check for Cancel and Reply buttons in the form
        const cancelButton = commentCard.getByRole('button', { name: 'Cancel' });
        const submitButton = commentCard.getByRole('button', { name: 'Reply' }).nth(1); // Second Reply button is in the form

        const hasCancelButton = await cancelButton.isVisible().catch(() => false);
        const hasSubmitButton = await submitButton.isVisible().catch(() => false);

        return {
            success: true,
            replyFormVisible: true,
            formElements: {
                textarea: true,
                cancelButton: hasCancelButton,
                submitButton: hasSubmitButton
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a test comment on a post
 *
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the comment
 * @param {string} options.postId - Post ID to add comment to
 * @param {string} options.content - Comment content
 * @param {string} options.parentId - Parent comment ID for replies (optional)
 * @returns {Promise<Object>} - Returns { success, commentId, content, postId, parentId, errorMessage }
 */
async function createTestComment(page, options = {}) {
    try {
        const { postId, content, parentId } = options;

        if (!postId) {
            return { success: false, errorMessage: 'postId is required to create a test comment' };
        }

        const commentData = {
            postId: postId,
            content: content || `Test comment ${Date.now()}`,
            parentId: parentId || null
        };

        const response = await page.request.post('/api/comments', {
            data: commentData
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
            commentId: body?.id || null,
            content: body?.content || commentData.content,
            postId: body?.postId || postId,
            parentId: body?.parentId || parentId,
            createdAt: body?.createdAt || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Comment creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a test post with comments for testing comment cards
 *
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the post and comments
 * @param {boolean} options.withComments - If true, create comments (default: true)
 * @param {boolean} options.withNestedReplies - If true, create nested replies (default: false)
 * @param {boolean} options.withAnonymousComment - If true, include anonymous comment (default: true)
 * @param {string} options.username - Username for registered user comment (optional)
 * @returns {Promise<Object>} - Returns { success, postId, comments, errorMessage }
 */
async function createTestPostWithComments(page, options = {}) {
    try {
        const {
            withComments = true,
            withNestedReplies = false,
            withAnonymousComment = true,
            username = null
        } = options;

        // First get a valid category
        const categoryResult = await getTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        // Create a test post
        const timestamp = Date.now();
        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId,
            frustration: `Test frustration for comment card ${timestamp}`,
            identity: `TestUser_${timestamp}`
        });

        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        const comments = [];

        if (withComments && withAnonymousComment) {
            // Create an anonymous comment (no userId)
            const anonymousComment = await createTestComment(page, {
                postId: postResult.postId,
                content: `Anonymous comment ${timestamp}`
            });
            if (anonymousComment.success) {
                comments.push({ ...anonymousComment, type: 'anonymous' });

                // Create nested reply if requested
                if (withNestedReplies) {
                    const nestedReply = await createTestComment(page, {
                        postId: postResult.postId,
                        parentId: anonymousComment.commentId,
                        content: `Nested reply to anonymous ${timestamp}`
                    });
                    if (nestedReply.success) {
                        comments.push({ ...nestedReply, type: 'nested' });
                    }
                }
            }
        }

        return {
            success: true,
            postId: postResult.postId,
            frustration: postResult.frustration,
            identity: postResult.identity,
            categoryId: postResult.categoryId,
            categoryName: categoryResult.categoryName,
            comments: comments
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get comment ID from action result
 *
 * @param {Object} result - Result from createTestComment
 * @returns {string|null} - Comment ID or null
 */
function getCommentIdFromResult(result) {
    return result?.commentId || null;
}

/**
 * Helper to get post ID from action result
 *
 * @param {Object} result - Result from createTestPostWithComments
 * @returns {string|null} - Post ID or null
 */
function getPostIdFromResult(result) {
    return result?.postId || null;
}

module.exports = {
    performShowCommentCardAction,
    viewCommentCardElements,
    viewCommentVoteButtons,
    viewCommentAuthor,
    checkReplyButton,
    checkNestedReplyNoReplyButton,
    viewNestedReplies,
    clickReplyAndCheckForm,
    createTestComment,
    createTestPostWithComments,
    getCommentIdFromResult,
    getPostIdFromResult
};
