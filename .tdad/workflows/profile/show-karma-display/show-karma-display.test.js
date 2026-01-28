// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const { performShowKarmaDisplayAction, refreshAndGetKarma, setupUserWithKarma } = require('./show-karma-display.action.js');
const { createTestUser, createTestPost, createTestComment, castMultiplePostVotes, castMultipleCommentVotes } = require('../fetch-user-karma/fetch-user-karma.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Karma Display
 *   As a registered user
 *   I want to see my karma score displayed on my profile
 *   So that I can understand my reputation in the community
 */

test.describe('Show Karma Display', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-179] Display karma score on profile page', async ({ page, tdadTrace }) => {
        // Given the user is logged in
        // And the user has a total karma of 25
        const setupResult = await setupUserWithKarma(page, 25);
        expect(setupResult.success).toBe(true);

        // When the user visits the profile page
        const result = await performShowKarmaDisplayAction(page, { userId: setupResult.userId });
        tdadTrace.setActionResult(result);

        // Then the user should see the karma badge
        expect(result.success).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);

        // And the karma badge should display "25"
        await expect(page.locator('text=/25\\s*karma/i')).toBeVisible();
        expect(result.karmaDisplayed).toBe(25);
    });

    test('[UI-180] Display zero karma for new user', async ({ page, tdadTrace }) => {
        // Given the user is logged in
        // And the user has a total karma of 0
        const userResult = await createTestUser(page, 'zero');
        expect(userResult.success).toBe(true);

        // When the user visits the profile page
        const result = await performShowKarmaDisplayAction(page, { userId: userResult.userId });
        tdadTrace.setActionResult(result);

        // Then the user should see the karma badge
        expect(result.success).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);

        // And the karma badge should display "0"
        await expect(page.locator('text=/0\\s*karma/i')).toBeVisible();
        expect(result.karmaDisplayed).toBe(0);
    });

    test('[UI-181] Display karma breakdown (post and comment karma)', async ({ page, tdadTrace }) => {
        // Given the user is logged in
        // And the user has post karma of 15
        // And the user has comment karma of 10

        // Create user
        const userResult = await createTestUser(page, 'breakdown');
        expect(userResult.success).toBe(true);

        // Create a post and add upvotes for post karma
        const postResult = await createTestPost(page, { userId: userResult.userId });
        expect(postResult.success).toBe(true);

        const postVotes = await castMultiplePostVotes(page, postResult.postId, 15, 0);
        expect(postVotes.success).toBe(true);

        // Create a comment and add upvotes for comment karma
        const commentResult = await createTestComment(page, { postId: postResult.postId, userId: userResult.userId });
        expect(commentResult.success).toBe(true);

        const commentVotes = await castMultipleCommentVotes(page, commentResult.commentId, 10, 0);
        expect(commentVotes.success).toBe(true);

        // When the user visits the profile page
        const result = await performShowKarmaDisplayAction(page, { userId: userResult.userId });
        tdadTrace.setActionResult(result);

        // Then the user should see the karma badge
        expect(result.success).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);

        // And the user should see "Post Karma: 15"
        await expect(page.getByText(/Post Karma:\s*15/i)).toBeVisible();
        expect(result.hasPostKarma).toBe(true);

        // And the user should see "Comment Karma: 10"
        await expect(page.getByText(/Comment Karma:\s*10/i)).toBeVisible();
        expect(result.hasCommentKarma).toBe(true);
    });

    test('[UI-182] Display negative karma score', async ({ page, tdadTrace }) => {
        // Given the user is logged in
        // And the user has a total karma of -5
        const setupResult = await setupUserWithKarma(page, -5);
        expect(setupResult.success).toBe(true);

        // When the user visits the profile page
        const result = await performShowKarmaDisplayAction(page, { userId: setupResult.userId });
        tdadTrace.setActionResult(result);

        // Then the user should see the karma badge
        expect(result.success).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);

        // And the karma badge should display "-5"
        await expect(page.locator('text=/-5\\s*karma/i')).toBeVisible();
        expect(result.karmaDisplayed).toBe(-5);
    });

    test('[UI-183] Karma display updates after receiving votes', async ({ page, tdadTrace }) => {
        // Given the user is logged in
        // And the user has a total karma of 10
        const userResult = await createTestUser(page, 'update');
        expect(userResult.success).toBe(true);

        // Create a post and add 10 upvotes
        const postResult = await createTestPost(page, { userId: userResult.userId });
        expect(postResult.success).toBe(true);

        const initialVotes = await castMultiplePostVotes(page, postResult.postId, 10, 0);
        expect(initialVotes.success).toBe(true);

        // When the user visits the profile page
        const result = await performShowKarmaDisplayAction(page, { userId: userResult.userId });
        tdadTrace.setActionResult(result);

        // Then the karma badge should display "10"
        expect(result.success).toBe(true);
        await expect(page.locator('text=/10\\s*karma/i')).toBeVisible();
        expect(result.karmaDisplayed).toBe(10);

        // When the user's karma increases to 11
        const additionalVote = await castMultiplePostVotes(page, postResult.postId, 1, 0);
        expect(additionalVote.success).toBe(true);

        // And the user refreshes the profile page
        const refreshResult = await refreshAndGetKarma(page);
        expect(refreshResult.success).toBe(true);

        // Then the karma badge should display "11"
        await expect(page.locator('text=/11\\s*karma/i')).toBeVisible();
        expect(refreshResult.karmaDisplayed).toBe(11);
    });

    test('[UI-184] Karma badge visible in profile header', async ({ page, tdadTrace }) => {
        // Given the user is logged in
        // And the user has a total karma of 50
        const setupResult = await setupUserWithKarma(page, 50);
        expect(setupResult.success).toBe(true);

        // When the user visits the profile page
        const result = await performShowKarmaDisplayAction(page, { userId: setupResult.userId });
        tdadTrace.setActionResult(result);

        // Then the karma badge should be visible in the profile header section
        expect(result.success).toBe(true);
        expect(result.karmaInHeader).toBe(true);

        // Verify karma is displayed alongside profile username in the header
        const profileHeader = page.getByTestId('profile-username').locator('..').locator('..');
        await expect(profileHeader).toBeVisible();
        await expect(profileHeader).toContainText(/50\s*karma/i);

        // And the karma badge should be styled as a badge element
        // The karma is shown in a span within the profile header's stats section
        await expect(page.locator('text=/50\\s*karma/i')).toBeVisible();
    });

});
