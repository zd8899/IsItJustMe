// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowScoreDisplayAction,
    checkScoreDisplayOnFeed,
    checkScoreDisplayOnDetail,
    checkScoreDisplayOnComment,
    getScoreFromFeedCard,
    clickUpvoteAndGetScore,
    clickDownvoteAndGetScore,
    clickCommentUpvoteAndGetScore,
    createPostWithScore,
    createPostWithEqualVotes,
    createCommentWithScore,
    findPostScoreOnFeed,
    createTestPostForVoteButtons,
    createTestCommentForVoteButtons
} = require('./show-score-display.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Score Display
 *   As a user
 *   I want to see the current vote count on posts and comments
 *   So that I can gauge how much others relate to the content
 */

test.describe('Show Score Display', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-112] Score displays between vote arrows on post card', async ({ page }) => {
        // Setup: Create a test post to ensure there is at least one post in the feed
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Navigate to feed and check score display
        const result = await checkScoreDisplayOnFeed(page);
        expect(result.success).toBe(true);
        expect(result.hasScoreBetweenArrows).toBe(true);

        // Verify with Playwright assertions - check specific elements are visible
        const firstCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();

        // Upvote arrow button should be visible
        await expect(firstCard.getByRole('button', { name: 'Upvote' })).toBeVisible();

        // Score display should be visible between the arrows
        await expect(firstCard.locator('[data-testid="vote-score"]')).toBeVisible();

        // Downvote arrow button should be visible
        await expect(firstCard.getByRole('button', { name: 'Downvote' })).toBeVisible();

        // Round-trip verification: the score should be a number
        const scoreText = await firstCard.locator('[data-testid="vote-score"]').textContent();
        expect(parseInt(scoreText, 10)).not.toBeNaN();
    });

    test('[UI-113] Score displays positive value for upvoted post', async ({ page }) => {
        // Setup: Create a post with a positive score (more upvotes than downvotes)
        const postSetup = await createPostWithScore(page, 3); // Score of +3
        expect(postSetup.success).toBe(true);

        // Navigate to feed and find the post's score
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Navigate to the specific post's detail page to verify score
        await page.goto(`/post/${postSetup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for score to be visible
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await expect(scoreDisplay).toBeVisible();

        // Verify the score is positive
        const scoreText = await scoreDisplay.textContent();
        const scoreValue = parseInt(scoreText, 10);
        expect(scoreValue).toBeGreaterThan(0);

        // Verify the score text does not have a negative sign
        expect(scoreText).not.toContain('-');
    });

    test('[UI-114] Score displays negative value for downvoted post', async ({ page }) => {
        // Setup: Create a post with a negative score (more downvotes than upvotes)
        const postSetup = await createPostWithScore(page, -3); // Score of -3
        expect(postSetup.success).toBe(true);

        // Navigate to the specific post's detail page to verify score
        await page.goto(`/post/${postSetup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for score to be visible
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await expect(scoreDisplay).toBeVisible();

        // Verify the score is negative
        const scoreText = await scoreDisplay.textContent();
        const scoreValue = parseInt(scoreText, 10);
        expect(scoreValue).toBeLessThan(0);
    });

    test('[UI-115] Score displays zero for post with equal votes', async ({ page }) => {
        // Setup: Create a post with equal upvotes and downvotes
        const postSetup = await createPostWithEqualVotes(page, 2); // 2 upvotes, 2 downvotes = 0
        expect(postSetup.success).toBe(true);

        // Navigate to the specific post's detail page to verify score
        await page.goto(`/post/${postSetup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for score to be visible
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await expect(scoreDisplay).toBeVisible();

        // Verify the score is zero
        await expect(scoreDisplay).toContainText('0');
    });

    test('[UI-116] Score updates immediately after user upvotes', async ({ page }) => {
        // Setup: Create a test post with a known score
        const postSetup = await createPostWithScore(page, 5); // Score of 5
        expect(postSetup.success).toBe(true);

        // Navigate to feed
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Navigate to post detail to ensure we're voting on our specific post
        await page.goto(`/post/${postSetup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Get the current score
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await expect(scoreDisplay).toBeVisible();
        const initialScoreText = await scoreDisplay.textContent();
        const initialScore = parseInt(initialScoreText, 10);

        // Click the upvote button
        const upvoteButton = page.getByRole('button', { name: 'Upvote' }).first();
        await upvoteButton.click();

        // Wait for the score to update
        await page.waitForLoadState('domcontentloaded');

        // Verify the score has increased by 1
        const newScoreText = await scoreDisplay.textContent();
        const newScore = parseInt(newScoreText, 10);
        expect(newScore).toBe(initialScore + 1);
    });

    test('[UI-117] Score updates immediately after user downvotes', async ({ page }) => {
        // Setup: Create a test post with a known score
        const postSetup = await createPostWithScore(page, 5); // Score of 5
        expect(postSetup.success).toBe(true);

        // Navigate to post detail
        await page.goto(`/post/${postSetup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Get the current score
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await expect(scoreDisplay).toBeVisible();
        const initialScoreText = await scoreDisplay.textContent();
        const initialScore = parseInt(initialScoreText, 10);

        // Click the downvote button
        const downvoteButton = page.getByRole('button', { name: 'Downvote' }).first();
        await downvoteButton.click();

        // Wait for the score to update
        await page.waitForLoadState('domcontentloaded');

        // Verify the score has decreased by 1
        const newScoreText = await scoreDisplay.textContent();
        const newScore = parseInt(newScoreText, 10);
        expect(newScore).toBe(initialScore - 1);
    });

    test('[UI-118] Score displays on post detail page', async ({ page }) => {
        // Setup: Create a test post
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Navigate to the post detail page
        const result = await checkScoreDisplayOnDetail(page, postSetup.postId);
        expect(result.success).toBe(true);
        expect(result.hasScoreBetweenArrows).toBe(true);

        // Verify with Playwright assertions
        // Upvote arrow button should be visible
        await expect(page.getByRole('button', { name: 'Upvote' }).first()).toBeVisible();

        // Score display should be visible between the arrows
        await expect(page.locator('[data-testid="vote-score"]').first()).toBeVisible();

        // Downvote arrow button should be visible
        await expect(page.getByRole('button', { name: 'Downvote' }).first()).toBeVisible();

        // Verify we are on the correct detail page (round-trip)
        await expect(page).toHaveURL(new RegExp(`/post/${postSetup.postId}`));
    });

    test('[UI-119] Score displays on comments', async ({ page }) => {
        // Setup: Create a test post with a comment
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Create a comment on the post
        const commentSetup = await createTestCommentForVoteButtons(page, postSetup.postId);
        expect(commentSetup.success).toBe(true);

        // Navigate to post detail and check score on comments
        const result = await checkScoreDisplayOnComment(page, postSetup.postId);
        expect(result.success).toBe(true);
        expect(result.hasCommentScore).toBe(true);

        // Verify with Playwright assertions
        // There should be multiple vote score elements (post + comment)
        const voteScores = page.locator('[data-testid="vote-score"]');
        const scoreCount = await voteScores.count();
        expect(scoreCount).toBeGreaterThanOrEqual(2);

        // The second score display should be on the comment
        await expect(voteScores.nth(1)).toBeVisible();

        // Round-trip: verify the comment content is visible
        await expect(page.getByText(commentSetup.content)).toBeVisible();
    });

    test('[UI-120] Comment score updates after user votes', async ({ page }) => {
        // Setup: Create a test post with a comment that has a known score
        const postSetup = await createTestPostForVoteButtons(page);
        expect(postSetup.success).toBe(true);

        // Create a comment with a score of 3
        const commentSetup = await createCommentWithScore(page, postSetup.postId, 3);
        expect(commentSetup.success).toBe(true);

        // Navigate to post detail
        await page.goto(`/post/${postSetup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for comment to be visible
        await expect(page.getByText(commentSetup.content)).toBeVisible();

        // Get the comment's score display (second score display on the page)
        const allScoreDisplays = page.locator('[data-testid="vote-score"]');
        const commentScoreDisplay = allScoreDisplays.nth(1);
        await expect(commentScoreDisplay).toBeVisible();

        // Get initial score
        const initialScoreText = await commentScoreDisplay.textContent();
        const initialScore = parseInt(initialScoreText, 10);

        // Click the upvote button on the comment (second upvote button on the page)
        const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
        const commentUpvoteButton = allUpvoteButtons.nth(1);
        await commentUpvoteButton.click();

        // Wait for the score to update
        await page.waitForLoadState('domcontentloaded');

        // Verify the comment score has increased by 1
        const newScoreText = await commentScoreDisplay.textContent();
        const newScore = parseInt(newScoreText, 10);
        expect(newScore).toBe(initialScore + 1);
    });

});
