const { createTestComment, createTestPostWithComments } = require('../show-comment-card/show-comment-card.action.js');
const { createTestPost, getTestCategory } = require('../fetch-comments-by-post/fetch-comments-by-post.action.js');

/**
 * Show Comment List Action
 *
 * Navigates to a post detail page and verifies the comment list section.
 * Supports UI testing for displaying comment threads including nested comments.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.postId - The post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowCommentListAction(page, context = {}) {
    try {
        const { postId } = context;

        if (!postId) {
            return { success: false, errorMessage: 'postId is required' };
        }

        // Navigate to post detail page
        await page.goto(`/post/${postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for the post detail to load or show error
        const postHeading = page.locator('h1').filter({ hasText: 'Why is it so hard to' });
        const outcome = await Promise.race([
            postHeading.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            page.getByText('Post not found').waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'not_found' })),
            page.getByText('Invalid post ID').waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'invalid' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'not_found') {
            return { success: false, errorMessage: 'Post not found' };
        }

        if (outcome.type === 'invalid') {
            return { success: false, errorMessage: 'Invalid post ID' };
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
 * View comment list section on post detail page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasCommentSection, commentCount }
 */
async function viewCommentListSection(page) {
    try {
        // Check for Comments heading
        const commentsHeading = page.locator('h2').filter({ hasText: /Comments/ });
        const hasHeading = await commentsHeading.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);

        if (!hasHeading) {
            return { success: true, hasCommentSection: false, commentCount: 0 };
        }

        // Get comment count from heading
        const headingText = await commentsHeading.textContent().catch(() => '');
        const countMatch = headingText.match(/\((\d+)\)/);
        const commentCount = countMatch ? parseInt(countMatch[1], 10) : 0;

        return {
            success: true,
            hasCommentSection: true,
            commentCount: commentCount,
            headingText: headingText
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View all top-level comments displayed
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, commentCards, count }
 */
async function viewTopLevelComments(page) {
    try {
        // Wait for comments to load (loading text should disappear)
        const loadingText = page.getByText('Loading comments...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Check for comment cards (top-level: direct children of space-y-4)
        const commentCards = page.locator('.space-y-4 > div > .bg-white.border.border-primary-200.rounded-lg');
        const count = await commentCards.count();

        return {
            success: true,
            commentCards: count,
            count: count,
            hasComments: count > 0
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View comment cards rendered
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, allCardsRendered, cardElements }
 */
async function viewCommentCardsRendered(page) {
    try {
        // Wait for comments to load
        const loadingText = page.getByText('Loading comments...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Check for all comment cards (including nested)
        const allCommentCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const count = await allCommentCards.count();

        if (count === 0) {
            return {
                success: true,
                allCardsRendered: false,
                cardCount: 0,
                cardElements: []
            };
        }

        // Verify each card has expected elements
        const cardElements = [];
        for (let i = 0; i < Math.min(count, 5); i++) { // Check up to 5 cards
            const card = allCommentCards.nth(i);
            const hasContent = await card.locator('p.text-primary-800').isVisible().catch(() => false);
            const hasScore = await card.locator('[data-testid="vote-score"]').isVisible().catch(() => false);
            const hasMetadata = await card.locator('.text-xs.text-primary-500').isVisible().catch(() => false);

            cardElements.push({
                index: i,
                hasContent: hasContent,
                hasScore: hasScore,
                hasMetadata: hasMetadata
            });
        }

        const allCardsRendered = cardElements.every(c => c.hasContent && c.hasScore && c.hasMetadata);

        return {
            success: true,
            allCardsRendered: allCardsRendered,
            cardCount: count,
            cardElements: cardElements
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View nested comment thread structure
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasParentComments, hasNestedReplies, nestedCount }
 */
async function viewNestedThreadStructure(page) {
    try {
        // Wait for comments to load
        const loadingText = page.getByText('Loading comments...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Check for parent comments (top-level - no ml-8)
        const topLevelCards = page.locator('.space-y-4 > div > .bg-white.border.border-primary-200.rounded-lg');
        const parentCount = await topLevelCards.count();

        // Check for nested replies (with ml-8 indentation indicating nested structure)
        const nestedContainers = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        const nestedCount = await nestedContainers.count();

        return {
            success: true,
            hasParentComments: parentCount > 0,
            hasNestedReplies: nestedCount > 0,
            parentCount: parentCount,
            nestedCount: nestedCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View empty state when no comments exist
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasEmptyState, emptyMessage, hasCommentForm }
 */
async function viewEmptyState(page) {
    try {
        // Wait for comments to load
        const loadingText = page.getByText('Loading comments...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Check for empty state message
        const emptyStateMessage = page.getByText('No comments yet');
        const hasEmptyState = await emptyStateMessage.isVisible().catch(() => false);

        // Check for comment form
        const commentForm = page.locator('textarea[placeholder="Share your thoughts..."]');
        const hasCommentForm = await commentForm.isVisible().catch(() => false);

        // Get empty message text
        let emptyMessage = null;
        if (hasEmptyState) {
            emptyMessage = await emptyStateMessage.textContent().catch(() => null);
        }

        return {
            success: true,
            hasEmptyState: hasEmptyState,
            emptyMessage: emptyMessage,
            hasCommentForm: hasCommentForm
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View loading state while fetching comments
 *
 * @param {Object} page - Playwright page object
 * @param {string} postId - The post ID to navigate to
 * @returns {Promise<Object>} - Returns { success, errorMessage, loadingStateVisible, loadingDisappeared }
 */
async function viewLoadingState(page, postId) {
    try {
        // Navigate to post detail page fresh
        await page.goto(`/post/${postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Try to catch the loading state (may be fast)
        const loadingText = page.getByText('Loading comments...');

        // Wait briefly to see if loading state appears
        const loadingStateVisible = await loadingText.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false);

        // Wait for loading to disappear (comments loaded)
        let loadingDisappeared = false;
        if (loadingStateVisible) {
            loadingDisappeared = await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).then(() => true).catch(() => false);
        } else {
            // Loading may have already finished - check if comments or empty state is visible
            const commentsVisible = await page.locator('.bg-white.border.border-primary-200.rounded-lg').first().isVisible().catch(() => false);
            const emptyVisible = await page.getByText('No comments yet').isVisible().catch(() => false);
            loadingDisappeared = commentsVisible || emptyVisible;
        }

        return {
            success: true,
            loadingStateVisible: loadingStateVisible,
            loadingDisappeared: loadingDisappeared
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View comment count displayed in heading
 *
 * @param {Object} page - Playwright page object
 * @param {number} expectedCount - Expected comment count
 * @returns {Promise<Object>} - Returns { success, errorMessage, displayedCount, countText, matchesExpected }
 */
async function viewCommentCount(page, expectedCount = null) {
    try {
        // Wait for comments to load
        const loadingText = page.getByText('Loading comments...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Find the Comments heading with count
        const commentsHeading = page.locator('h2').filter({ hasText: /Comments/ });
        await commentsHeading.waitFor({ state: 'visible', timeout: 5000 });

        const headingText = await commentsHeading.textContent().catch(() => '');

        // Extract count from "Comments (X)"
        const countMatch = headingText.match(/\((\d+)\)/);
        const displayedCount = countMatch ? parseInt(countMatch[1], 10) : 0;

        // Check for singular "Comment" vs plural "Comments" - based on current implementation
        // Note: Current implementation may not have dynamic singular/plural
        const isSingular = displayedCount === 1;
        const isPlural = displayedCount !== 1;

        return {
            success: true,
            displayedCount: displayedCount,
            countText: headingText.trim(),
            isSingular: isSingular,
            isPlural: isPlural,
            matchesExpected: expectedCount !== null ? displayedCount === expectedCount : true
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * View replies grouped under parent comment
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, parentHasReplies, repliesGrouped, visualConnection }
 */
async function viewRepliesGroupedUnderParent(page) {
    try {
        // Wait for comments to load
        const loadingText = page.getByText('Loading comments...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Find nested container (indicates replies are grouped)
        const nestedContainers = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        const nestedCount = await nestedContainers.count();

        if (nestedCount === 0) {
            return {
                success: true,
                parentHasReplies: false,
                repliesGrouped: false,
                visualConnection: false
            };
        }

        // Check for visual connection (border-l-2 class indicates visual connector)
        const firstNested = nestedContainers.first();
        const hasVisualConnector = await firstNested.isVisible();

        // Check that nested comments have comment cards
        const nestedCards = firstNested.locator('.bg-white.border.border-primary-200.rounded-lg');
        const nestedCardCount = await nestedCards.count();

        return {
            success: true,
            parentHasReplies: true,
            repliesGrouped: nestedCardCount > 0,
            visualConnection: hasVisualConnector,
            replyCount: nestedCardCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Scroll to comments section
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, scrolledToComments, commentsInViewport }
 */
async function scrollToCommentsSection(page) {
    try {
        // Find comments section heading
        const commentsHeading = page.locator('h2').filter({ hasText: /Comments/ });
        await commentsHeading.waitFor({ state: 'visible', timeout: 5000 });

        // Scroll to comments section
        await commentsHeading.scrollIntoViewIfNeeded();

        // Wait a moment for scroll to complete
        await page.waitForLoadState('domcontentloaded');

        // Check if comments section is in viewport
        const isVisible = await commentsHeading.isVisible();
        const boundingBox = await commentsHeading.boundingBox();
        const viewportSize = await page.viewportSize();

        let commentsInViewport = false;
        if (boundingBox && viewportSize) {
            commentsInViewport = boundingBox.y >= 0 && boundingBox.y < viewportSize.height;
        }

        return {
            success: true,
            scrolledToComments: true,
            commentsInViewport: commentsInViewport,
            headingVisible: isVisible
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a test post with multiple comments for testing
 *
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options
 * @param {number} options.commentCount - Number of comments to create
 * @param {boolean} options.withReplies - Include nested replies
 * @returns {Promise<Object>} - Returns { success, postId, commentIds, errorMessage }
 */
async function createTestPostWithMultipleComments(page, options = {}) {
    try {
        const { commentCount = 3, withReplies = false } = options;

        // Get a valid category
        const categoryResult = await getTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        // Create a test post
        const timestamp = Date.now();
        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId,
            frustration: `Test frustration for comment list ${timestamp}`,
            identity: `TestUser_${timestamp}`
        });

        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        const commentIds = [];
        const replyIds = [];

        // Create multiple comments
        for (let i = 0; i < commentCount; i++) {
            const commentResult = await createTestComment(page, {
                postId: postResult.postId,
                content: `Test comment ${i + 1} for list - ${timestamp}`
            });
            if (commentResult.success) {
                commentIds.push(commentResult.commentId);

                // Create a reply if requested (only for first comment to show nesting)
                if (withReplies && i === 0 && commentResult.commentId) {
                    const replyResult = await createTestComment(page, {
                        postId: postResult.postId,
                        content: `Reply to comment ${i + 1} - ${timestamp}`,
                        parentId: commentResult.commentId
                    });
                    if (replyResult.success) {
                        replyIds.push(replyResult.commentId);
                    }
                }
            }
        }

        return {
            success: true,
            postId: postResult.postId,
            categoryId: categoryResult.categoryId,
            commentIds: commentIds,
            replyIds: replyIds,
            totalComments: commentIds.length + replyIds.length
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a post with no comments (for empty state testing)
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, postId, errorMessage }
 */
async function createEmptyPost(page) {
    try {
        // Get a valid category
        const categoryResult = await getTestCategory(page);
        if (!categoryResult.success) {
            return { success: false, errorMessage: categoryResult.errorMessage };
        }

        // Create a test post without comments
        const timestamp = Date.now();
        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId,
            frustration: `Test frustration for empty state ${timestamp}`,
            identity: `TestUser_${timestamp}`
        });

        if (!postResult.success) {
            return { success: false, errorMessage: postResult.errorMessage };
        }

        return {
            success: true,
            postId: postResult.postId,
            categoryId: categoryResult.categoryId
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Create a post with exactly N comments (for count testing)
 *
 * @param {Object} page - Playwright page object
 * @param {number} count - Exact number of comments to create
 * @returns {Promise<Object>} - Returns { success, postId, commentIds, errorMessage }
 */
async function createPostWithExactComments(page, count) {
    try {
        const result = await createTestPostWithMultipleComments(page, {
            commentCount: count,
            withReplies: false
        });

        return result;

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get post ID from setup result
 *
 * @param {Object} result - Result from setup action
 * @returns {string|null} - Post ID or null
 */
function getPostId(result) {
    return result?.postId || null;
}

/**
 * Helper to get comment IDs from setup result
 *
 * @param {Object} result - Result from setup action
 * @returns {Array<string>} - Array of comment IDs
 */
function getCommentIds(result) {
    return result?.commentIds || [];
}

module.exports = {
    performShowCommentListAction,
    viewCommentListSection,
    viewTopLevelComments,
    viewCommentCardsRendered,
    viewNestedThreadStructure,
    viewEmptyState,
    viewLoadingState,
    viewCommentCount,
    viewRepliesGroupedUnderParent,
    scrollToCommentsSection,
    createTestPostWithMultipleComments,
    createEmptyPost,
    createPostWithExactComments,
    getPostId,
    getCommentIds
};
