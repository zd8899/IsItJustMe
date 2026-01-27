// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowPostDetailAction,
    viewPostDetailContent,
    viewPostDetailVotes,
    viewPostDetailComments,
    viewNestedComments,
    checkLoadingState,
    viewEmptyCommentsState,
    navigateBackToFeed,
    createTestPostForDetail
} = require('./show-post-detail.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Post Detail
 *   As a user
 *   I want to view the full details of a post
 *   So that I can read the complete frustration and see all comments
 */

test.describe('Show Post Detail', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-051] Display post detail page with all content', async ({ page }) => {
        // Create a test post first (self-containment)
        const setup = await createTestPostForDetail(page, {
            frustration: 'find a work-life balance',
            identity: 'a software engineer'
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowPostDetailAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify all content elements are visible
        const contentResult = await viewPostDetailContent(page);
        expect(contentResult.success).toBe(true);
        expect(contentResult.hasAllElements).toBe(true);

        // Verify frustration text is visible with correct format
        await expect(page.locator('h1').filter({ hasText: 'Why is it so hard to' })).toBeVisible();
        await expect(page.locator('h1')).toContainText('find a work-life balance');

        // Verify identity text is visible
        await expect(page.locator('p.text-lg.text-primary-600')).toBeVisible();
        await expect(page.locator('p.text-lg.text-primary-600')).toContainText('I am');

        // Verify category badge is visible
        await expect(page.locator('.px-2.py-1.bg-primary-100.rounded')).toBeVisible();

        // Verify date is visible
        await expect(page.locator('.text-sm.text-primary-500 span').last()).toBeVisible();
    });

    test('[UI-052] Display vote counts on post detail', async ({ page }) => {
        // Create a test post first
        const setup = await createTestPostForDetail(page);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowPostDetailAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify vote elements
        const voteResult = await viewPostDetailVotes(page);
        expect(voteResult.success).toBe(true);
        expect(voteResult.hasAllVoteElements).toBe(true);

        // Verify upvote button is visible (use first() since there are multiple vote buttons on page)
        await expect(page.getByRole('button', { name: 'Upvote' }).first()).toBeVisible();

        // Verify downvote button is visible (use first() since there are multiple vote buttons on page)
        await expect(page.getByRole('button', { name: 'Downvote' }).first()).toBeVisible();

        // Verify vote score display is visible
        await expect(page.locator('.text-sm.font-medium.text-primary-700').first()).toBeVisible();
    });

    test('[UI-053] Display comments section on post detail', async ({ page }) => {
        // Create a test post first
        const setup = await createTestPostForDetail(page);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowPostDetailAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify comments section
        const commentsResult = await viewPostDetailComments(page);
        expect(commentsResult.success).toBe(true);
        expect(commentsResult.hasCommentsSection).toBe(true);

        // Verify comments heading is visible
        await expect(page.locator('h2').filter({ hasText: /Comments/ })).toBeVisible();

        // Verify comment count in post metadata
        await expect(page.locator('.text-sm.text-primary-500').getByText(/\d+ comments/)).toBeVisible();
    });

    test('[UI-054] Display nested comments', async ({ page }) => {
        // Create a test post first
        const setup = await createTestPostForDetail(page);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowPostDetailAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Check for nested comments structure
        const nestedResult = await viewNestedComments(page);
        expect(nestedResult.success).toBe(true);

        // The page should have comments section visible
        await expect(page.locator('h2').filter({ hasText: /Comments/ })).toBeVisible();

        // If nested comments exist, verify indentation structure
        if (nestedResult.hasNestedComments) {
            // Verify reply comments have indentation (ml-8 class)
            await expect(page.locator('.ml-8.border-l-2.border-primary-100.pl-4').first()).toBeVisible();
        }
    });

    test('[UI-055] Display post detail loading state', async ({ page }) => {
        // Create a test post first
        const setup = await createTestPostForDetail(page);
        expect(setup.success).toBe(true);

        // Check loading state behavior
        const loadingResult = await checkLoadingState(page, setup.postId);
        expect(loadingResult.success).toBe(true);

        // Wait for content to be visible (content should load after loading state)
        await expect(page.locator('h1').filter({ hasText: 'Why is it so hard to' })).toBeVisible();

        // Round-trip: verify the post actually loaded
        const contentResult = await viewPostDetailContent(page);
        expect(contentResult.success).toBe(true);
    });

    test('[UI-056] Display post not found error', async ({ page }) => {
        // Navigate to a non-existent post
        const result = await performShowPostDetailAction(page, { nonExistentId: true });

        // Should show error
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Post not found');

        // Verify error message is visible on the page
        await expect(page.getByText('Post not found')).toBeVisible();
    });

    test('[UI-057] Display invalid post ID error', async ({ page }) => {
        // Navigate with an invalid ID format
        const result = await performShowPostDetailAction(page, { invalidId: true });

        // Should show error
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Invalid post ID');

        // Verify error message is visible on the page
        await expect(page.getByText('Invalid post ID')).toBeVisible();
    });

    test('[UI-058] Display empty comments state', async ({ page }) => {
        // Create a fresh test post (will have no comments)
        const setup = await createTestPostForDetail(page);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowPostDetailAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Check for empty comments state
        const emptyResult = await viewEmptyCommentsState(page);
        expect(emptyResult.success).toBe(true);

        // Verify comment form is visible regardless of comment count
        expect(emptyResult.hasCommentForm).toBe(true);

        // Verify Add a Comment section is visible
        await expect(page.locator('h2').filter({ hasText: 'Add a Comment' })).toBeVisible();

        // Verify textarea for comments is present
        await expect(page.locator('textarea[placeholder="Share your thoughts..."]')).toBeVisible();

        // If no comments, should show "No comments yet" message
        if (emptyResult.hasNoCommentsMessage) {
            await expect(page.getByText('No comments yet')).toBeVisible();
        }
    });

    test('[UI-059] Navigate back to feed from post detail', async ({ page }) => {
        // Create a test post first
        const setup = await createTestPostForDetail(page);
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const detailResult = await performShowPostDetailAction(page, { postId: setup.postId });
        expect(detailResult.success).toBe(true);

        // Verify we're on the detail page
        await expect(page).toHaveURL(/\/post\/.+/);
        await expect(page.locator('h1').filter({ hasText: 'Why is it so hard to' })).toBeVisible();

        // Navigate back to feed
        const backResult = await navigateBackToFeed(page);
        expect(backResult.success).toBe(true);
        expect(backResult.navigatedToFeed).toBe(true);

        // Verify we're back on the feed page (round-trip verification)
        await expect(page).toHaveURL(/\/$/);

        // Verify feed content is visible
        const feedContent = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        await expect(feedContent.first()).toBeVisible();
    });

});
