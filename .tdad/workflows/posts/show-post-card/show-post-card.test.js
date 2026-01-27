// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowPostCardAction,
    viewPostCardEssentialInfo,
    viewPostCardVoteButtons,
    viewAnonymousPostCard,
    viewRegisteredUserPostCard,
    clickPostCardAndNavigate,
    viewPostCardCommentCount,
    getPostCardData
} = require('./show-post-card.action.js');

test.describe('Show Post Card', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-045] Post card displays all essential information', async ({ page }) => {
        // First verify feed loads with posts
        const feedResult = await performShowPostCardAction(page);
        expect(feedResult.success).toBe(true);
        expect(feedResult.postCount).toBeGreaterThan(0);

        // Now check essential info on a post card
        const result = await viewPostCardEssentialInfo(page);
        expect(result.success).toBe(true);
        expect(result.allElementsPresent).toBe(true);

        // Verify specific elements are visible using Playwright assertions
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().locator('h3')).toBeVisible();
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().locator('h3')).toContainText('Why is it so hard to');

        // Verify identity text
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().locator('p.text-sm.text-primary-600')).toBeVisible();
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().locator('p.text-sm.text-primary-600')).toContainText('I am');

        // Verify category badge
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().locator('.bg-primary-100.rounded')).toBeVisible();

        // Verify vote score (use span to avoid matching buttons which also have these classes)
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().locator('span.text-sm.font-medium.text-primary-700')).toBeVisible();

        // Verify comment count
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().getByText(/\d+ comments/)).toBeVisible();

        // Verify date (last span in the metadata section)
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().locator('.text-xs.text-primary-500 span').last()).toBeVisible();
    });

    test('[UI-046] Post card shows vote buttons', async ({ page }) => {
        // Navigate to feed
        const feedResult = await performShowPostCardAction(page);
        expect(feedResult.success).toBe(true);

        // Check vote buttons
        const result = await viewPostCardVoteButtons(page);
        expect(result.success).toBe(true);
        expect(result.allVoteElementsPresent).toBe(true);

        // Verify using Playwright assertions
        const firstCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();

        // Upvote button
        await expect(firstCard.getByRole('button', { name: 'Upvote' })).toBeVisible();

        // Downvote button
        await expect(firstCard.getByRole('button', { name: 'Downvote' })).toBeVisible();

        // Current score (use span to avoid matching buttons which also have these classes)
        await expect(firstCard.locator('span.text-sm.font-medium.text-primary-700')).toBeVisible();
    });

    test('[UI-047] Post card shows anonymous author', async ({ page }) => {
        // Navigate to feed
        const feedResult = await performShowPostCardAction(page);
        expect(feedResult.success).toBe(true);

        // Check for anonymous author
        const result = await viewAnonymousPostCard(page);
        expect(result.success).toBe(true);
        expect(result.hasAnonymousAuthor).toBe(true);

        // Verify "Anonymous" text is visible in the feed
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').filter({ hasText: 'Anonymous' }).first()).toBeVisible();
    });

    test('[UI-048] Post card shows username for registered user posts', async ({ page }) => {
        // Navigate to feed
        const feedResult = await performShowPostCardAction(page);
        expect(feedResult.success).toBe(true);

        // Check for registered user author
        const result = await viewRegisteredUserPostCard(page);
        expect(result.success).toBe(true);
        expect(result.hasUsernameAuthor).toBe(true);

        // Verify "by [username]" pattern is visible
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').filter({ hasText: /by \w+/ }).first()).toBeVisible();
    });

    test('[UI-049] Post card is clickable and navigates to detail page', async ({ page }) => {
        // Click on post card and navigate
        const result = await clickPostCardAndNavigate(page);
        expect(result.success).toBe(true);
        expect(result.navigatedToDetail).toBe(true);
        expect(result.postId).toBeDefined();

        // Verify we're on the detail page using Playwright assertions
        await expect(page).toHaveURL(/\/post\/.+/);

        // Verify detail page content is visible (round-trip verification)
        await expect(page.locator('h1').filter({ hasText: 'Why is it so hard to' })).toBeVisible();
    });

    test('[UI-050] Post card displays comment count correctly', async ({ page }) => {
        // Navigate to feed
        const feedResult = await performShowPostCardAction(page);
        expect(feedResult.success).toBe(true);

        // Check comment count display
        const result = await viewPostCardCommentCount(page);
        expect(result.success).toBe(true);
        expect(result.commentCountVisible).toBe(true);
        expect(result.commentCountText).toMatch(/\d+ comments/);
        expect(result.commentCount).toBeGreaterThanOrEqual(0);

        // Verify using Playwright assertion
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first().getByText(/\d+ comments/)).toBeVisible();
    });

});
