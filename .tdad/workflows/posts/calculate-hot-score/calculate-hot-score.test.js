// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performCalculateHotScoreAction,
    calculateExpectedHotScore,
    getVoteComponent,
    getHotScoreFromResult,
    getErrorFromResult
} = require('./calculate-hot-score.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Calculate Hot Score
 *   As the system
 *   I want to compute a ranking score for each post
 *   So that posts can be sorted by relevance in the hot feed
 *
 * NOTE: Hot score formula combines vote difference (logarithmic) with time decay
 * Formula: sign * log10(max(|score|, 1)) + seconds_since_epoch / 45000
 * where score = upvotes - downvotes, epoch = 2024-01-01
 */

test.describe('Calculate Hot Score', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-125] Calculate hot score for post with positive votes', async ({ page }) => {
        // Given a post exists with 10 upvotes and 2 downvotes
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 10,
            downvotes: 2,
            createdAt: createdAt
        });

        // Then the response status should be 200
        expect(result.statusCode).toBe(200);

        // And the response body should contain "hotScore"
        const hotScore = getHotScoreFromResult(result);
        expect(hotScore).toBeDefined();
        expect(hotScore).not.toBeNull();

        // And the hot score should be greater than 0
        expect(hotScore).toBeGreaterThan(0);
    });

    test('[API-126] Calculate hot score for post with zero votes', async ({ page }) => {
        // Given a post exists with 0 upvotes and 0 downvotes
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 0,
            downvotes: 0,
            createdAt: createdAt
        });

        // Then the response status should be 200
        expect(result.statusCode).toBe(200);

        // And the response body should contain "hotScore"
        const hotScore = getHotScoreFromResult(result);
        expect(hotScore).toBeDefined();
        expect(hotScore).not.toBeNull();

        // And the hot score should be based only on time factor
        // With zero votes, the vote component is 0, so hotScore = seconds / 45000
        const voteComponent = getVoteComponent(0, 0);
        expect(voteComponent).toBe(0);

        // The hot score should be positive (time factor only) since we're past the epoch (2024-01-01)
        expect(hotScore).toBeGreaterThan(0);
    });

    test('[API-127] Calculate hot score for post with negative votes', async ({ page }) => {
        // Given a post exists with 2 upvotes and 10 downvotes
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 2,
            downvotes: 10,
            createdAt: createdAt
        });

        // Then the response status should be 200
        expect(result.statusCode).toBe(200);

        // And the response body should contain "hotScore"
        const hotScore = getHotScoreFromResult(result);
        expect(hotScore).toBeDefined();
        expect(hotScore).not.toBeNull();

        // And the hot score vote component should be negative
        const voteComponent = getVoteComponent(2, 10);
        expect(voteComponent).toBeLessThan(0);
    });

    test('[API-128] Calculate hot score for post with equal votes', async ({ page }) => {
        // Given a post exists with 5 upvotes and 5 downvotes
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 5,
            downvotes: 5,
            createdAt: createdAt
        });

        // Then the response status should be 200
        expect(result.statusCode).toBe(200);

        // And the response body should contain "hotScore"
        const hotScore = getHotScoreFromResult(result);
        expect(hotScore).toBeDefined();
        expect(hotScore).not.toBeNull();

        // And the hot score vote component should be zero
        const voteComponent = getVoteComponent(5, 5);
        expect(voteComponent).toBe(0);
    });

    test('[API-129] Newer posts rank higher than older posts with same votes', async ({ page }) => {
        // Given a post created now with 5 upvotes and 0 downvotes
        const newerCreatedAt = new Date().toISOString();

        // And a post created 1 hour ago with 5 upvotes and 0 downvotes
        const olderCreatedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // When the client calculates hot scores for both posts
        const newerResult = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 5,
            downvotes: 0,
            createdAt: newerCreatedAt
        });

        const olderResult = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 5,
            downvotes: 0,
            createdAt: olderCreatedAt
        });

        // Assert both requests succeeded
        expect(newerResult.statusCode).toBe(200);
        expect(olderResult.statusCode).toBe(200);

        const newerHotScore = getHotScoreFromResult(newerResult);
        const olderHotScore = getHotScoreFromResult(olderResult);

        expect(newerHotScore).toBeDefined();
        expect(olderHotScore).toBeDefined();

        // Then the newer post should have a higher hot score than the older post
        expect(newerHotScore).toBeGreaterThan(olderHotScore);
    });

    test('[API-130] Calculate hot score with missing upvotes field', async ({ page }) => {
        // Given a post data without upvotes field
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            omitUpvotes: true,
            downvotes: 0,
            createdAt: createdAt
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "upvotes is required"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('upvotes is required');
    });

    test('[API-131] Calculate hot score with missing downvotes field', async ({ page }) => {
        // Given a post data without downvotes field
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            omitDownvotes: true,
            upvotes: 0,
            createdAt: createdAt
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "downvotes is required"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('downvotes is required');
    });

    test('[API-132] Calculate hot score with missing createdAt field', async ({ page }) => {
        // Given a post data without createdAt field

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            omitCreatedAt: true,
            upvotes: 0,
            downvotes: 0
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "createdAt is required"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('createdAt is required');
    });

    test('[API-133] Calculate hot score with negative upvotes value', async ({ page }) => {
        // Given a post data with upvotes set to -1
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: -1,
            downvotes: 0,
            createdAt: createdAt
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "upvotes must be a non-negative integer"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('upvotes must be a non-negative integer');
    });

    test('[API-134] Calculate hot score with negative downvotes value', async ({ page }) => {
        // Given a post data with downvotes set to -1
        const createdAt = new Date().toISOString();

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 0,
            downvotes: -1,
            createdAt: createdAt
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "downvotes must be a non-negative integer"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('downvotes must be a non-negative integer');
    });

    test('[API-135] Calculate hot score with invalid createdAt format', async ({ page }) => {
        // Given a post data with createdAt set to "invalid-date"

        // When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
        const result = await performCalculateHotScoreAction(page, {
            mode: 'api',
            upvotes: 0,
            downvotes: 0,
            createdAt: 'invalid-date'
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "createdAt must be a valid ISO date string"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('createdAt must be a valid ISO date string');
    });

});
