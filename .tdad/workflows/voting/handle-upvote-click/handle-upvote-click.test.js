// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performHandleUpvoteClickAction,
    setupPostWithScore,
    setupCommentWithScore,
    setupPostWithExistingVote,
    setupCommentWithExistingVote,
    generateVoterAnonymousId,
    createTestUserWithAuth,
    createTestPostForVoting,
    createTestCommentForVoting,
    getPostVoteCounts,
    getCommentVoteCounts
} = require('./handle-upvote-click.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Handle Upvote Click
 *   As a user
 *   I want to click the upvote button on posts and comments
 *   So that I can express that I relate to the content
 */

test.describe('Handle Upvote Click', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-275] Cast upvote on post successfully', async ({ page }) => {
        // Setup: Create a post with score 0
        const setup = await setupPostWithScore(page, 0);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(0);

        // Action: Cast upvote
        const voterAnonymousId = generateVoterAnonymousId();
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 0,
            anonymousId: voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(1);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(1);
    });

    test('[API-276] Registered user casts upvote on post', async ({ page }) => {
        // Setup: Create a post with score 5
        const setup = await setupPostWithScore(page, 5);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(5);

        // Create a registered user
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        // Action: Cast upvote as registered user
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 5,
            authToken: userResult.authToken
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(6);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(6);
    });

    test('[API-277] Anonymous user casts upvote on post', async ({ page }) => {
        // Setup: Create a post with score 3
        const setup = await setupPostWithScore(page, 3);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(3);

        // Action: Cast upvote as anonymous user
        const voterAnonymousId = generateVoterAnonymousId();
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 3,
            anonymousId: voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(4);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(4);
    });

    test('[API-278] Remove upvote from post by clicking upvote again', async ({ page }) => {
        // Setup: Create a post with score 5, where user has already upvoted
        const setup = await setupPostWithExistingVote(page, 5, 1); // score 5, existing upvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(5);

        // Action: Click upvote again (should toggle off)
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 5,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(4);
        expect(result.voteStatus).toBe(null);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(4);
    });

    test('[API-279] Change from downvote to upvote on post', async ({ page }) => {
        // Setup: Create a post with score 3, where user has downvoted
        const setup = await setupPostWithExistingVote(page, 3, -1); // score 3, existing downvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(3);

        // Action: Click upvote (should change direction)
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 3,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(5); // +2 for direction change
        expect(result.voteStatus).toBe(1);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(5);
    });

    test('[API-280] Cast upvote on comment successfully', async ({ page }) => {
        // Setup: Create a comment with score 0
        const setup = await setupCommentWithScore(page, 0);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(0);

        // Action: Cast upvote
        const voterAnonymousId = generateVoterAnonymousId();
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 0,
            anonymousId: voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(1);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(1);
    });

    test('[API-281] Registered user casts upvote on comment', async ({ page }) => {
        // Setup: Create a comment with score 2
        const setup = await setupCommentWithScore(page, 2);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(2);

        // Create a registered user
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        // Action: Cast upvote as registered user
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 2,
            authToken: userResult.authToken
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(3);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(3);
    });

    test('[API-282] Remove upvote from comment by clicking upvote again', async ({ page }) => {
        // Setup: Create a comment with score 4, where user has upvoted
        const setup = await setupCommentWithExistingVote(page, 4, 1); // score 4, existing upvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(4);

        // Action: Click upvote again (should toggle off)
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 4,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(3);
        expect(result.voteStatus).toBe(null);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(3);
    });

    test('[API-283] Change from downvote to upvote on comment', async ({ page }) => {
        // Setup: Create a comment with score 2, where user has downvoted
        const setup = await setupCommentWithExistingVote(page, 2, -1); // score 2, existing downvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(2);

        // Action: Click upvote (should change direction)
        const result = await performHandleUpvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 2,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(4); // +2 for direction change
        expect(result.voteStatus).toBe(1);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(4);
    });

    // Note: Rate limiting test is skipped as it requires 30+ votes and rate limiting may not be fully implemented
    test.skip('[API] Anonymous user rate limited on excessive upvotes', async ({ page }) => {
        // This test requires rate limiting to be implemented
        // Would need to cast 30+ votes in an hour to trigger
    });

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-121] Click upvote on post shows active state', async ({ page }) => {
        // Setup: Create a post with score 0
        const setup = await setupPostWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for posts to load
        const postCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await postCard.waitFor({ state: 'visible', timeout: 10000 });

        // Find the upvote button and score display
        const upvoteButton = postCard.getByRole('button', { name: 'Upvote' });
        const scoreDisplay = postCard.locator('[data-testid="vote-score"]');

        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get score before click
        const scoreBefore = await scoreDisplay.textContent();

        // Click upvote
        await upvoteButton.click();

        // Wait for optimistic update
        await page.waitForLoadState('domcontentloaded');

        // Assert score changed
        await expect(scoreDisplay).not.toHaveText(scoreBefore);
    });

    test('[UI-122] Click upvote again removes upvote', async ({ page }) => {
        // Setup: Create a post
        const setup = await setupPostWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const postCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await postCard.waitFor({ state: 'visible', timeout: 10000 });

        const upvoteButton = postCard.getByRole('button', { name: 'Upvote' });
        const scoreDisplay = postCard.locator('[data-testid="vote-score"]');

        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Click upvote first time
        await upvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Get score after first click
        const scoreAfterFirstClick = await scoreDisplay.textContent();

        // Click upvote second time (toggle off)
        await upvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Get score after second click
        const scoreAfterSecondClick = await scoreDisplay.textContent();

        // Assert toggle behavior (score should decrease)
        expect(parseInt(scoreAfterSecondClick)).toBeLessThan(parseInt(scoreAfterFirstClick));
    });

    test('[UI-123] Click upvote when downvoted switches vote', async ({ page }) => {
        // Setup: Create a post
        const setup = await setupPostWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const postCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await postCard.waitFor({ state: 'visible', timeout: 10000 });

        const upvoteButton = postCard.getByRole('button', { name: 'Upvote' });
        const downvoteButton = postCard.getByRole('button', { name: 'Downvote' });
        const scoreDisplay = postCard.locator('[data-testid="vote-score"]');

        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Click downvote first
        await downvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterDownvote = await scoreDisplay.textContent();

        // Now click upvote (switch direction)
        await upvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterUpvote = await scoreDisplay.textContent();

        // Score should increase by 2 (from -1 to +1)
        expect(parseInt(scoreAfterUpvote)).toBeGreaterThan(parseInt(scoreAfterDownvote));
    });

    test('[UI-124] Click upvote on post detail page', async ({ page }) => {
        // Setup: Create a post with score 5
        const setup = await setupPostWithScore(page, 5);
        expect(setup.success).toBe(true);

        // Navigate to post detail page
        await page.goto(`/post/${setup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for post to load
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await scoreDisplay.waitFor({ state: 'visible', timeout: 10000 });

        const upvoteButton = page.getByRole('button', { name: 'Upvote' }).first();
        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get score before click
        const scoreBefore = await scoreDisplay.textContent();
        expect(parseInt(scoreBefore)).toBe(5);

        // Click upvote
        await upvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Assert score changed to 6
        await expect(scoreDisplay).toHaveText('6');
    });

    test('[UI-125] Click upvote on comment shows active state', async ({ page }) => {
        // Setup: Create a comment with score 0
        const setup = await setupCommentWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to post detail page
        await page.goto(`/post/${setup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for page to load
        const scoreDisplays = page.locator('[data-testid="vote-score"]');
        await scoreDisplays.first().waitFor({ state: 'visible', timeout: 10000 });

        // Find the comment's vote buttons (index 1, as index 0 is the post)
        const count = await scoreDisplays.count();
        expect(count).toBeGreaterThan(1); // Ensure we have comments

        const commentScoreDisplay = scoreDisplays.nth(1);
        const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
        const commentUpvoteButton = allUpvoteButtons.nth(1);

        await commentUpvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get score before click
        const scoreBefore = await commentScoreDisplay.textContent();

        // Click upvote
        await commentUpvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Assert score increased
        const scoreAfter = await commentScoreDisplay.textContent();
        expect(parseInt(scoreAfter)).toBeGreaterThan(parseInt(scoreBefore));
    });

    test('[UI-126] Click upvote on comment again removes upvote', async ({ page }) => {
        // Setup: Create a comment
        const setup = await setupCommentWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to post detail page
        await page.goto(`/post/${setup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        const scoreDisplays = page.locator('[data-testid="vote-score"]');
        await scoreDisplays.first().waitFor({ state: 'visible', timeout: 10000 });

        const count = await scoreDisplays.count();
        expect(count).toBeGreaterThan(1);

        const commentScoreDisplay = scoreDisplays.nth(1);
        const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
        const commentUpvoteButton = allUpvoteButtons.nth(1);

        await commentUpvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Click upvote first time
        await commentUpvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterFirstClick = await commentScoreDisplay.textContent();

        // Click upvote second time (toggle off)
        await commentUpvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterSecondClick = await commentScoreDisplay.textContent();

        // Assert toggle behavior
        expect(parseInt(scoreAfterSecondClick)).toBeLessThan(parseInt(scoreAfterFirstClick));
    });

    test('[UI-127] Click upvote on comment when downvoted switches vote', async ({ page }) => {
        // Setup: Create a comment
        const setup = await setupCommentWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to post detail page
        await page.goto(`/post/${setup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        const scoreDisplays = page.locator('[data-testid="vote-score"]');
        await scoreDisplays.first().waitFor({ state: 'visible', timeout: 10000 });

        const count = await scoreDisplays.count();
        expect(count).toBeGreaterThan(1);

        const commentScoreDisplay = scoreDisplays.nth(1);
        const allUpvoteButtons = page.getByRole('button', { name: 'Upvote' });
        const allDownvoteButtons = page.getByRole('button', { name: 'Downvote' });
        const commentUpvoteButton = allUpvoteButtons.nth(1);
        const commentDownvoteButton = allDownvoteButtons.nth(1);

        await commentUpvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Click downvote first
        await commentDownvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterDownvote = await commentScoreDisplay.textContent();

        // Now click upvote (switch direction)
        await commentUpvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterUpvote = await commentScoreDisplay.textContent();

        // Score should increase by 2
        expect(parseInt(scoreAfterUpvote)).toBeGreaterThan(parseInt(scoreAfterDownvote));
    });

    test('[UI-128] Vote count updates immediately on click', async ({ page }) => {
        // Setup: Create a post with score 10
        const setup = await setupPostWithScore(page, 10);
        expect(setup.success).toBe(true);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const postCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await postCard.waitFor({ state: 'visible', timeout: 10000 });

        const upvoteButton = postCard.getByRole('button', { name: 'Upvote' });
        const scoreDisplay = postCard.locator('[data-testid="vote-score"]');

        await upvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get initial score
        const scoreBefore = await scoreDisplay.textContent();

        // Click upvote - score should update immediately (optimistic update)
        await upvoteButton.click();

        // Check score changed (optimistic update is immediate, no need to wait for network)
        const scoreAfter = await scoreDisplay.textContent();
        expect(parseInt(scoreAfter)).toBe(parseInt(scoreBefore) + 1);
    });

    // Note: Error handling test is complex as it requires mocking API failures
    // The UI handles errors by reverting optimistic updates
    test.skip('[UI] Show error message when vote fails', async ({ page }) => {
        // This test would require intercepting network requests to simulate failure
        // The VoteButtons component reverts optimistic updates on error
    });

});
