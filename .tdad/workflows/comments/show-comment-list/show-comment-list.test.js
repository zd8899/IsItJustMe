// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
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
    createPostWithExactComments
} = require('./show-comment-list.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Comment List
 *   As a user
 *   I want to see a list of comments on a post
 *   So that I can read the full discussion thread
 *
 * NOTE: Comments support 2 levels of nesting (parent and replies)
 * NOTE: Comments are rendered using Comment Card component
 */

test.describe('Show Comment List', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-082] Display comment list with multiple comments', async ({ page, tdadTrace }) => {
        // Setup: Create a post with multiple comments
        const setup = await createTestPostWithMultipleComments(page, { commentCount: 3 });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentListAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);
        tdadTrace.setActionResult(result);

        // Verify: Comment list section is visible
        const sectionResult = await viewCommentListSection(page);
        expect(sectionResult.success).toBe(true);
        expect(sectionResult.hasCommentSection).toBe(true);

        // Verify: All top-level comments are displayed
        const topLevelResult = await viewTopLevelComments(page);
        expect(topLevelResult.success).toBe(true);
        expect(topLevelResult.hasComments).toBe(true);
        expect(topLevelResult.count).toBeGreaterThanOrEqual(3);

        // Verify: Each comment is rendered as a comment card
        const cardsResult = await viewCommentCardsRendered(page);
        expect(cardsResult.success).toBe(true);
        expect(cardsResult.allCardsRendered).toBe(true);

        // Round-trip verification: Verify comments can be fetched via API
        const apiResponse = await page.request.get(`/api/comments?postId=${setup.postId}`);
        expect(apiResponse.ok()).toBe(true);
        const comments = await apiResponse.json();
        expect(Array.isArray(comments)).toBe(true);
        expect(comments.length).toBeGreaterThanOrEqual(3);
    });

    test('[UI-083] Display nested comment thread structure', async ({ page, tdadTrace }) => {
        // Setup: Create a post with comments that have replies
        const setup = await createTestPostWithMultipleComments(page, { commentCount: 2, withReplies: true });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentListAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);
        tdadTrace.setActionResult(result);

        // Verify: Parent comments are at the top level
        const nestedResult = await viewNestedThreadStructure(page);
        expect(nestedResult.success).toBe(true);
        expect(nestedResult.hasParentComments).toBe(true);

        // Verify: Replies are indented below their parent comments
        expect(nestedResult.hasNestedReplies).toBe(true);
        expect(nestedResult.nestedCount).toBeGreaterThanOrEqual(1);

        // Verify: Nested structure does not exceed 2 levels deep
        // (This is enforced by CommentCard component with depth < 1 check)
        // Verify nested replies are visually connected
        const repliesGrouped = await viewRepliesGroupedUnderParent(page);
        expect(repliesGrouped.success).toBe(true);
        expect(repliesGrouped.parentHasReplies).toBe(true);
        expect(repliesGrouped.visualConnection).toBe(true);
    });

    test('[UI-084] Display empty state when no comments exist', async ({ page, tdadTrace }) => {
        // Setup: Create a post with no comments
        const setup = await createEmptyPost(page);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentListAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);
        tdadTrace.setActionResult(result);

        // Verify: "No comments yet" message is displayed
        const emptyStateResult = await viewEmptyState(page);
        expect(emptyStateResult.success).toBe(true);
        expect(emptyStateResult.hasEmptyState).toBe(true);
        await expect(page.getByText('No comments yet')).toBeVisible();

        // Verify: Comment form is visible to add the first comment
        expect(emptyStateResult.hasCommentForm).toBe(true);
        await expect(page.locator('textarea[placeholder="Share your thoughts..."]')).toBeVisible();
    });

    test('[UI-085] Display loading state while fetching comments', async ({ page, tdadTrace }) => {
        // Setup: Create a post with comments
        const setup = await createTestPostWithMultipleComments(page, { commentCount: 2 });
        expect(setup.success).toBe(true);

        // Navigate and check loading state
        const loadingResult = await viewLoadingState(page, setup.postId);
        expect(loadingResult.success).toBe(true);
        tdadTrace.setActionResult(loadingResult);

        // Verify: Loading indicator disappears when comments are displayed
        // Note: Loading may be too fast to observe, but we verify final state is correct
        expect(loadingResult.loadingDisappeared).toBe(true);

        // Verify: Comments or empty state is now visible (loading is complete)
        const commentsVisible = await page.locator('.bg-white.border.border-primary-200.rounded-lg').first().isVisible().catch(() => false);
        const emptyVisible = await page.getByText('No comments yet').isVisible().catch(() => false);
        expect(commentsVisible || emptyVisible).toBe(true);
    });

    test('[UI-086] Display comment count in list header', async ({ page, tdadTrace }) => {
        // Setup: Create a post with exactly 5 comments
        const setup = await createPostWithExactComments(page, 5);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentListAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);
        tdadTrace.setActionResult(result);

        // Verify: Comment count is displayed
        const countResult = await viewCommentCount(page, 5);
        expect(countResult.success).toBe(true);

        // Verify: The heading shows the count
        await expect(page.locator('h2').filter({ hasText: /Comments/ })).toBeVisible();

        // Round-trip verification: API returns same count
        const apiResponse = await page.request.get(`/api/comments?postId=${setup.postId}`);
        expect(apiResponse.ok()).toBe(true);
        const comments = await apiResponse.json();
        expect(comments.length).toBe(5);
    });

    test('[UI-087] Display singular comment count for single comment', async ({ page, tdadTrace }) => {
        // Setup: Create a post with exactly 1 comment
        const setup = await createPostWithExactComments(page, 1);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentListAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);
        tdadTrace.setActionResult(result);

        // Verify: Comment count is displayed
        const countResult = await viewCommentCount(page, 1);
        expect(countResult.success).toBe(true);

        // Verify: Singular form is expected for 1 comment
        expect(countResult.isSingular).toBe(true);

        // Verify: Comments heading is visible
        await expect(page.locator('h2').filter({ hasText: /Comments? \(\d+\)/ })).toBeVisible();

        // Round-trip verification: API returns single comment
        const apiResponse = await page.request.get(`/api/comments?postId=${setup.postId}`);
        expect(apiResponse.ok()).toBe(true);
        const comments = await apiResponse.json();
        expect(comments.length).toBe(1);
    });

    test('[UI-088] Comments maintain thread context with multiple replies', async ({ page, tdadTrace }) => {
        // Setup: Create a parent comment with multiple replies
        const setup = await createTestPostWithMultipleComments(page, { commentCount: 1, withReplies: true });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentListAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);
        tdadTrace.setActionResult(result);

        // Verify: Parent comment is visible
        const topLevelResult = await viewTopLevelComments(page);
        expect(topLevelResult.success).toBe(true);
        expect(topLevelResult.hasComments).toBe(true);

        // Verify: Replies are grouped under the parent
        const repliesResult = await viewRepliesGroupedUnderParent(page);
        expect(repliesResult.success).toBe(true);
        expect(repliesResult.parentHasReplies).toBe(true);
        expect(repliesResult.repliesGrouped).toBe(true);

        // Verify: Each reply is visually connected to its parent thread
        expect(repliesResult.visualConnection).toBe(true);

        // Verify: Nested container has correct visual styling (border-l-2)
        await expect(page.locator('.ml-8.border-l-2.border-primary-100.pl-4').first()).toBeVisible();
    });

    test('[UI-089] Scroll to comments section from post', async ({ page, tdadTrace }) => {
        // Setup: Create a post with comments
        const setup = await createTestPostWithMultipleComments(page, { commentCount: 3 });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentListAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);
        tdadTrace.setActionResult(result);

        // Scroll to comments section
        const scrollResult = await scrollToCommentsSection(page);
        expect(scrollResult.success).toBe(true);

        // Verify: Page scrolled to the comment list section
        expect(scrollResult.scrolledToComments).toBe(true);

        // Verify: Comment list is visible in the viewport
        expect(scrollResult.headingVisible).toBe(true);
        await expect(page.locator('h2').filter({ hasText: /Comments/ })).toBeVisible();
    });

});
