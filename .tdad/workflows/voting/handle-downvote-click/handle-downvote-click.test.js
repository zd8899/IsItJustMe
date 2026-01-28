// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performHandleDownvoteClickAction,
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
} = require('./handle-downvote-click.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Handle Downvote Click
 *   As a user
 *   I want to click the downvote button on posts and comments
 *   So that I can express that I do not relate to the content
 */

test.describe('Handle Downvote Click', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-284] Downvote post successfully as logged-in user', async ({ page }) => {
        // Setup: Create a user and a post with score 5
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        const setup = await setupPostWithScore(page, 5);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(5);

        // Action: Cast downvote as logged-in user
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 5,
            authToken: userResult.authToken
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

    test('[API-285] Downvote post successfully as anonymous user', async ({ page }) => {
        // Setup: Create a post with score 10
        const setup = await setupPostWithScore(page, 10);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(10);

        // Action: Cast downvote as anonymous user
        const voterAnonymousId = generateVoterAnonymousId();
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 10,
            anonymousId: voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(9);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(9);
    });

    test('[API-286] Remove downvote from post when clicking downvote again', async ({ page }) => {
        // Setup: Create a post with score 3, where user has downvoted
        const setup = await setupPostWithExistingVote(page, 3, -1); // score 3, existing downvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(3);

        // Action: Click downvote again (should toggle off)
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 3,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(4); // +1 for removing downvote
        expect(result.voteStatus).toBe(null);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(4);
    });

    test('[API-287] Change upvote to downvote on post', async ({ page }) => {
        // Setup: Create a post with score 5, where user has upvoted
        const setup = await setupPostWithExistingVote(page, 5, 1); // score 5, existing upvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(5);

        // Action: Click downvote (should change direction)
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            initialScore: 5,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(3); // -2 for direction change
        expect(result.voteStatus).toBe(-1);

        // Round-trip verification
        const counts = await getPostVoteCounts(page, setup.postId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(3);
    });

    test('[API-288] Downvote comment successfully as logged-in user', async ({ page }) => {
        // Setup: Create a user and a comment with score 3
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        const setup = await setupCommentWithScore(page, 3);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(3);

        // Action: Cast downvote as logged-in user
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 3,
            authToken: userResult.authToken
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(2);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(2);
    });

    test('[API-289] Downvote comment successfully as anonymous user', async ({ page }) => {
        // Setup: Create a comment with score 5
        const setup = await setupCommentWithScore(page, 5);
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(5);

        // Action: Cast downvote as anonymous user
        const voterAnonymousId = generateVoterAnonymousId();
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 5,
            anonymousId: voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(4);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(4);
    });

    test('[API-290] Remove downvote from comment when clicking downvote again', async ({ page }) => {
        // Setup: Create a comment with score 2, where user has downvoted
        const setup = await setupCommentWithExistingVote(page, 2, -1); // score 2, existing downvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(2);

        // Action: Click downvote again (should toggle off)
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 2,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(3); // +1 for removing downvote
        expect(result.voteStatus).toBe(null);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(3);
    });

    test('[API-291] Change upvote to downvote on comment', async ({ page }) => {
        // Setup: Create a comment with score 4, where user has upvoted
        const setup = await setupCommentWithExistingVote(page, 4, 1); // score 4, existing upvote
        expect(setup.success).toBe(true);
        expect(setup.score).toBe(4);

        // Action: Click downvote (should change direction)
        const result = await performHandleDownvoteClickAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            initialScore: 4,
            anonymousId: setup.voterAnonymousId
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.newScore).toBe(2); // -2 for direction change
        expect(result.voteStatus).toBe(-1);

        // Round-trip verification
        const counts = await getCommentVoteCounts(page, setup.commentId);
        expect(counts.success).toBe(true);
        expect(counts.score).toBe(2);
    });

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-129] User downvotes a post in the feed', async ({ page }) => {
        // Setup: Create a post with score 0
        const setup = await setupPostWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for posts to load
        const postCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await postCard.waitFor({ state: 'visible', timeout: 10000 });

        // Find the downvote button and score display
        const downvoteButton = postCard.getByRole('button', { name: 'Downvote' });
        const scoreDisplay = postCard.locator('[data-testid="vote-score"]');

        await downvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get score before click
        const scoreBefore = await scoreDisplay.textContent();

        // Click downvote
        await downvoteButton.click();

        // Wait for optimistic update
        await page.waitForLoadState('domcontentloaded');

        // Assert score changed (decreased)
        const scoreAfter = await scoreDisplay.textContent();
        expect(parseInt(scoreAfter)).toBeLessThan(parseInt(scoreBefore));
    });

    test('[UI-130] User removes downvote by clicking downvote again on post', async ({ page }) => {
        // Setup: Create a post
        const setup = await setupPostWithScore(page, 0);
        expect(setup.success).toBe(true);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const postCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await postCard.waitFor({ state: 'visible', timeout: 10000 });

        const downvoteButton = postCard.getByRole('button', { name: 'Downvote' });
        const scoreDisplay = postCard.locator('[data-testid="vote-score"]');

        await downvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Click downvote first time
        await downvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Get score after first click
        const scoreAfterFirstClick = await scoreDisplay.textContent();

        // Click downvote second time (toggle off)
        await downvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Get score after second click
        const scoreAfterSecondClick = await scoreDisplay.textContent();

        // Assert toggle behavior (score should increase)
        expect(parseInt(scoreAfterSecondClick)).toBeGreaterThan(parseInt(scoreAfterFirstClick));
    });

    test('[UI-131] User switches from upvote to downvote on post', async ({ page }) => {
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

        // Click upvote first
        await upvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterUpvote = await scoreDisplay.textContent();

        // Now click downvote (switch direction)
        await downvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterDownvote = await scoreDisplay.textContent();

        // Score should decrease by 2 (from +1 to -1)
        expect(parseInt(scoreAfterDownvote)).toBeLessThan(parseInt(scoreAfterUpvote));
    });

    test('[UI-132] User downvotes a post on detail page', async ({ page }) => {
        // Setup: Create a post with score 5
        const setup = await setupPostWithScore(page, 5);
        expect(setup.success).toBe(true);

        // Navigate to post detail page
        await page.goto(`/post/${setup.postId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for post to load
        const scoreDisplay = page.locator('[data-testid="vote-score"]').first();
        await scoreDisplay.waitFor({ state: 'visible', timeout: 10000 });

        const downvoteButton = page.getByRole('button', { name: 'Downvote' }).first();
        await downvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get score before click
        const scoreBefore = await scoreDisplay.textContent();
        expect(parseInt(scoreBefore)).toBe(5);

        // Click downvote
        await downvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Assert score changed to 4
        await expect(scoreDisplay).toHaveText('4');
    });

    test('[UI-133] User downvotes a comment', async ({ page }) => {
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
        const allDownvoteButtons = page.getByRole('button', { name: 'Downvote' });
        const commentDownvoteButton = allDownvoteButtons.nth(1);

        await commentDownvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get score before click
        const scoreBefore = await commentScoreDisplay.textContent();

        // Click downvote
        await commentDownvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Assert score decreased
        const scoreAfter = await commentScoreDisplay.textContent();
        expect(parseInt(scoreAfter)).toBeLessThan(parseInt(scoreBefore));
    });

    test('[UI-134] User removes downvote by clicking downvote again on comment', async ({ page }) => {
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
        const allDownvoteButtons = page.getByRole('button', { name: 'Downvote' });
        const commentDownvoteButton = allDownvoteButtons.nth(1);

        await commentDownvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Click downvote first time
        await commentDownvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterFirstClick = await commentScoreDisplay.textContent();

        // Click downvote second time (toggle off)
        await commentDownvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterSecondClick = await commentScoreDisplay.textContent();

        // Assert toggle behavior
        expect(parseInt(scoreAfterSecondClick)).toBeGreaterThan(parseInt(scoreAfterFirstClick));
    });

    test('[UI-135] User switches from upvote to downvote on comment', async ({ page }) => {
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

        // Click upvote first
        await commentUpvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterUpvote = await commentScoreDisplay.textContent();

        // Now click downvote (switch direction)
        await commentDownvoteButton.click();
        await page.waitForLoadState('domcontentloaded');

        const scoreAfterDownvote = await commentScoreDisplay.textContent();

        // Score should decrease by 2
        expect(parseInt(scoreAfterDownvote)).toBeLessThan(parseInt(scoreAfterUpvote));
    });

    test('[UI-136] Vote count updates optimistically when downvoting', async ({ page }) => {
        // Setup: Create a post with score 5
        const setup = await setupPostWithScore(page, 5);
        expect(setup.success).toBe(true);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const postCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await postCard.waitFor({ state: 'visible', timeout: 10000 });

        const downvoteButton = postCard.getByRole('button', { name: 'Downvote' });
        const scoreDisplay = postCard.locator('[data-testid="vote-score"]');

        await downvoteButton.waitFor({ state: 'visible', timeout: 5000 });

        // Get initial score
        const scoreBefore = await scoreDisplay.textContent();

        // Click downvote - score should update immediately (optimistic update)
        await downvoteButton.click();

        // Check score changed (optimistic update is immediate, no need to wait for network)
        const scoreAfter = await scoreDisplay.textContent();
        expect(parseInt(scoreAfter)).toBe(parseInt(scoreBefore) - 1);
    });

});
