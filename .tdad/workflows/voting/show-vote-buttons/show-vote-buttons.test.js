// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowVoteButtonsAction,
    checkVoteButtonsOnFeed,
    checkVoteButtonsOnDetail,
    checkVoteButtonsOnComment,
    checkVoteButtonsNeutralState,
    checkZeroVoteCount,
    createTestPostForVoteButtons,
    createTestCommentForVoteButtons,
    getVoteButtonState
} = require('./show-vote-buttons.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Vote Buttons
 *   As a user
 *   I want to see upvote and downvote buttons on posts and comments
 *   So that I can express whether I relate to the content
 */

test.describe('Show Vote Buttons', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-107] Vote buttons displayed on post card in feed', async ({ page }) => {
        // Create a test post to ensure there is at least one post in the feed
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Navigate to feed and check vote buttons
        const result = await checkVoteButtonsOnFeed(page);
        expect(result.success).toBe(true);
        expect(result.hasUpvote).toBe(true);
        expect(result.hasDownvote).toBe(true);
        expect(result.hasScore).toBe(true);

        // Verify with Playwright assertions - check specific elements are visible
        const firstCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();

        // Upvote arrow button should be visible
        await expect(firstCard.getByRole('button', { name: 'Upvote' })).toBeVisible();

        // Downvote arrow button should be visible
        await expect(firstCard.getByRole('button', { name: 'Downvote' })).toBeVisible();

        // Vote count should be visible between the arrows
        await expect(firstCard.locator('[data-testid="vote-score"]')).toBeVisible();

        // Round-trip verification: the score should be a number
        const scoreText = await firstCard.locator('[data-testid="vote-score"]').textContent();
        expect(parseInt(scoreText, 10)).not.toBeNaN();
    });

    test('[UI-108] Vote buttons displayed on post detail page', async ({ page }) => {
        // Create a test post to ensure we have a valid post to view
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Navigate to the post detail page and check vote buttons
        const result = await checkVoteButtonsOnDetail(page, postSetup.postId);
        expect(result.success).toBe(true);
        expect(result.hasUpvote).toBe(true);
        expect(result.hasDownvote).toBe(true);
        expect(result.hasScore).toBe(true);

        // Verify with Playwright assertions
        // Upvote arrow button should be visible on the post
        await expect(page.getByRole('button', { name: 'Upvote' }).first()).toBeVisible();

        // Downvote arrow button should be visible on the post
        await expect(page.getByRole('button', { name: 'Downvote' }).first()).toBeVisible();

        // Vote count should be visible between the arrows
        await expect(page.locator('[data-testid="vote-score"]').first()).toBeVisible();

        // Verify we are on the correct detail page (round-trip)
        await expect(page).toHaveURL(new RegExp(`/post/${postSetup.postId}`));
        await expect(page.locator('h1').filter({ hasText: 'Why is it so hard to' })).toBeVisible();
    });

    test('[UI-109] Vote buttons displayed on comments', async ({ page }) => {
        // Create a test post first
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Create a comment on the post
        const commentSetup = await createTestCommentForVoteButtons(page, postSetup.postId);
        expect(commentSetup.success).toBe(true);

        // Navigate to post detail and check vote buttons on comments
        const result = await checkVoteButtonsOnComment(page, postSetup.postId);
        expect(result.success).toBe(true);
        expect(result.hasUpvote).toBe(true);
        expect(result.hasDownvote).toBe(true);
        expect(result.hasScore).toBe(true);

        // Verify with Playwright assertions
        // There should be multiple vote score elements (at least 2: post + comment)
        const voteScores = page.locator('[data-testid="vote-score"]');
        const scoreCount = await voteScores.count();
        expect(scoreCount).toBeGreaterThanOrEqual(2);

        // Verify comment has upvote button (second instance)
        const upvoteButtons = page.getByRole('button', { name: 'Upvote' });
        const upvoteCount = await upvoteButtons.count();
        expect(upvoteCount).toBeGreaterThanOrEqual(2);

        // Verify comment has downvote button (second instance)
        const downvoteButtons = page.getByRole('button', { name: 'Downvote' });
        const downvoteCount = await downvoteButtons.count();
        expect(downvoteCount).toBeGreaterThanOrEqual(2);

        // Round-trip: verify the comment content is visible
        await expect(page.getByText(commentSetup.content)).toBeVisible();
    });

    test('[UI-110] Vote buttons show neutral state by default', async ({ page }) => {
        // Create a fresh test post to ensure neutral state
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Check neutral state on vote buttons
        const result = await checkVoteButtonsNeutralState(page);
        expect(result.success).toBe(true);
        expect(result.upvoteNeutral).toBe(true);
        expect(result.downvoteNeutral).toBe(true);

        // Verify with Playwright assertions
        const firstCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();

        // Upvote arrow should be visible and not have active state classes
        const upvoteButton = firstCard.getByRole('button', { name: 'Upvote' });
        await expect(upvoteButton).toBeVisible();

        // Downvote arrow should be visible and not have active state classes
        const downvoteButton = firstCard.getByRole('button', { name: 'Downvote' });
        await expect(downvoteButton).toBeVisible();

        // Check aria-pressed is not true (if implemented)
        // This is an additional verification for accessibility compliance
        const upvotePressed = await upvoteButton.getAttribute('aria-pressed');
        const downvotePressed = await downvoteButton.getAttribute('aria-pressed');

        // Neutral means not pressed (null or "false")
        expect(upvotePressed).not.toBe('true');
        expect(downvotePressed).not.toBe('true');
    });

    test('[UI-111] Vote count displays zero for new post', async ({ page }) => {
        // Create a new post - it should have zero votes by default
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Navigate to the new post's detail page and check the vote count
        const result = await checkZeroVoteCount(page, postSetup.postId);
        expect(result.success).toBe(true);
        expect(result.scoreIsZero).toBe(true);
        expect(result.scoreValue).toBe(0);

        // Verify with Playwright assertions
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await expect(scoreDisplay).toBeVisible();
        await expect(scoreDisplay).toContainText('0');

        // Round-trip: verify we're on the correct page
        await expect(page).toHaveURL(new RegExp(`/post/${postSetup.postId}`));
    });

});
