// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const { performUpdateCommentScoreAction, setupCommentWithVotes, castVoteAndGetCounts } = require('./update-comment-score.action.js');
const { generateVoterAnonymousId, createTestUserWithAuth } = require('../create-vote-record/create-vote-record.action.js');

/**
 * Test suite for Update Comment Score
 *
 * Feature: Update Comment Score
 *   As a system
 *   I want to recalculate comment vote totals after voting actions
 *   So that comment scores accurately reflect the current votes
 *
 * NOTE: Score = upvotes - downvotes
 * Vote counts and score are updated atomically with vote record changes
 */

test.describe('Update Comment Score', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    // --- Score Calculation After New Vote ---

    test('[API-247] Comment score increases after new upvote', async ({ page }) => {
        // Given a comment exists with score 0, upvotes 0, downvotes 0
        // And the user is logged in
        // And the user has not voted on the comment
        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
        const result = await performUpdateCommentScoreAction(page, {
            mode: 'api',
            voteValue: 1,
            isAuthenticated: true
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 1
        expect(result.upvotes).toBe(1);

        // And the comment downvotes should be 0
        expect(result.downvotes).toBe(0);

        // And the comment score should be 1
        expect(result.score).toBe(1);
    });

    test('[API-248] Comment score decreases after new downvote', async ({ page }) => {
        // Given a comment exists with score 0, upvotes 0, downvotes 0
        // And the user is logged in
        // And the user has not voted on the comment
        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
        const result = await performUpdateCommentScoreAction(page, {
            mode: 'api',
            voteValue: -1,
            isAuthenticated: true
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 0
        expect(result.upvotes).toBe(0);

        // And the comment downvotes should be 1
        expect(result.downvotes).toBe(1);

        // And the comment score should be -1
        expect(result.score).toBe(-1);
    });

    // --- Score Calculation After Vote Direction Change ---

    test('[API-249] Comment score decreases by 2 when upvote changes to downvote', async ({ page }) => {
        // Given a comment exists with score 5, upvotes 7, downvotes 2
        // Set up initial votes: 7 upvotes, 2 downvotes
        const setup = await setupCommentWithVotes(page, {
            upvotesToAdd: 7,
            downvotesToAdd: 2
        });
        expect(setup.success).toBe(true);
        expect(setup.upvotes).toBe(7);
        expect(setup.downvotes).toBe(2);
        expect(setup.score).toBe(5);

        // And the user is logged in
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        // And the user has previously upvoted the comment with value 1
        const initialVote = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: 1,
            authToken: userResult.authToken
        });
        expect(initialVote.success).toBe(true);
        expect(initialVote.upvotes).toBe(8);
        expect(initialVote.downvotes).toBe(2);
        expect(initialVote.score).toBe(6);

        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
        const result = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: -1,
            authToken: userResult.authToken
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 7 (was 8, decreased by 1)
        expect(result.upvotes).toBe(7);

        // And the comment downvotes should be 3 (was 2, increased by 1)
        expect(result.downvotes).toBe(3);

        // And the comment score should be 4 (was 6, decreased by 2)
        expect(result.score).toBe(4);
    });

    test('[API-250] Comment score increases by 2 when downvote changes to upvote', async ({ page }) => {
        // Given a comment exists with score -3, upvotes 2, downvotes 5
        const setup = await setupCommentWithVotes(page, {
            upvotesToAdd: 2,
            downvotesToAdd: 5
        });
        expect(setup.success).toBe(true);
        expect(setup.upvotes).toBe(2);
        expect(setup.downvotes).toBe(5);
        expect(setup.score).toBe(-3);

        // And the user is logged in
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        // And the user has previously downvoted the comment with value -1
        const initialVote = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: -1,
            authToken: userResult.authToken
        });
        expect(initialVote.success).toBe(true);
        expect(initialVote.upvotes).toBe(2);
        expect(initialVote.downvotes).toBe(6);
        expect(initialVote.score).toBe(-4);

        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
        const result = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: 1,
            authToken: userResult.authToken
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 3 (was 2, increased by 1)
        expect(result.upvotes).toBe(3);

        // And the comment downvotes should be 5 (was 6, decreased by 1)
        expect(result.downvotes).toBe(5);

        // And the comment score should be -2 (was -4, increased by 2)
        expect(result.score).toBe(-2);
    });

    // --- Score Calculation After Vote Removal ---

    test('[API-251] Comment score decreases when upvote is removed', async ({ page }) => {
        // Given a comment exists with score 10, upvotes 12, downvotes 2
        const setup = await setupCommentWithVotes(page, {
            upvotesToAdd: 12,
            downvotesToAdd: 2
        });
        expect(setup.success).toBe(true);
        expect(setup.upvotes).toBe(12);
        expect(setup.downvotes).toBe(2);
        expect(setup.score).toBe(10);

        // And the user is logged in
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        // And the user has previously upvoted the comment with value 1
        const initialVote = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: 1,
            authToken: userResult.authToken
        });
        expect(initialVote.success).toBe(true);
        expect(initialVote.upvotes).toBe(13);
        expect(initialVote.downvotes).toBe(2);
        expect(initialVote.score).toBe(11);

        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1 (toggle off)
        const result = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: 1,
            authToken: userResult.authToken
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 12 (was 13, decreased by 1)
        expect(result.upvotes).toBe(12);

        // And the comment downvotes should be 2
        expect(result.downvotes).toBe(2);

        // And the comment score should be 10 (was 11, decreased by 1)
        expect(result.score).toBe(10);
    });

    test('[API-252] Comment score increases when downvote is removed', async ({ page }) => {
        // Given a comment exists with score -5, upvotes 3, downvotes 8
        const setup = await setupCommentWithVotes(page, {
            upvotesToAdd: 3,
            downvotesToAdd: 8
        });
        expect(setup.success).toBe(true);
        expect(setup.upvotes).toBe(3);
        expect(setup.downvotes).toBe(8);
        expect(setup.score).toBe(-5);

        // And the user is logged in
        const userResult = await createTestUserWithAuth(page);
        expect(userResult.success).toBe(true);

        // And the user has previously downvoted the comment with value -1
        const initialVote = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: -1,
            authToken: userResult.authToken
        });
        expect(initialVote.success).toBe(true);
        expect(initialVote.upvotes).toBe(3);
        expect(initialVote.downvotes).toBe(9);
        expect(initialVote.score).toBe(-6);

        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1 (toggle off)
        const result = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: -1,
            authToken: userResult.authToken
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 3
        expect(result.upvotes).toBe(3);

        // And the comment downvotes should be 8 (was 9, decreased by 1)
        expect(result.downvotes).toBe(8);

        // And the comment score should be -5 (was -6, increased by 1)
        expect(result.score).toBe(-5);
    });

    // --- Anonymous User Score Updates ---

    test('[API-253] Comment score updates correctly for anonymous upvote', async ({ page }) => {
        // Given a comment exists with score 3, upvotes 5, downvotes 2
        const setup = await setupCommentWithVotes(page, {
            upvotesToAdd: 5,
            downvotesToAdd: 2
        });
        expect(setup.success).toBe(true);
        expect(setup.upvotes).toBe(5);
        expect(setup.downvotes).toBe(2);
        expect(setup.score).toBe(3);

        // And the user has an anonymous session
        const anonymousId = generateVoterAnonymousId();

        // And the anonymous user has not voted on the comment
        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
        const result = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: 1,
            anonymousId: anonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 6
        expect(result.upvotes).toBe(6);

        // And the comment downvotes should be 2
        expect(result.downvotes).toBe(2);

        // And the comment score should be 4
        expect(result.score).toBe(4);
    });

    test('[API-254] Comment score updates correctly for anonymous downvote', async ({ page }) => {
        // Given a comment exists with score 3, upvotes 5, downvotes 2
        const setup = await setupCommentWithVotes(page, {
            upvotesToAdd: 5,
            downvotesToAdd: 2
        });
        expect(setup.success).toBe(true);
        expect(setup.upvotes).toBe(5);
        expect(setup.downvotes).toBe(2);
        expect(setup.score).toBe(3);

        // And the user has an anonymous session
        const anonymousId = generateVoterAnonymousId();

        // And the anonymous user has not voted on the comment
        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
        const result = await castVoteAndGetCounts(page, {
            commentId: setup.commentId,
            value: -1,
            anonymousId: anonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 5
        expect(result.upvotes).toBe(5);

        // And the comment downvotes should be 3
        expect(result.downvotes).toBe(3);

        // And the comment score should be 2
        expect(result.score).toBe(2);
    });

    // --- Edge Cases ---

    test('[API-255] Comment score can become negative', async ({ page }) => {
        // Given a comment exists with score 0, upvotes 0, downvotes 0
        // And the user is logged in
        // And the user has not voted on the comment
        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
        const result = await performUpdateCommentScoreAction(page, {
            mode: 'api',
            voteValue: -1,
            isAuthenticated: true
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment score should be -1
        expect(result.score).toBe(-1);
    });

    test('[API-256] Comment upvotes count never goes below zero', async ({ page }) => {
        // Given a comment exists with score 0, upvotes 0, downvotes 0
        // And the user is logged in
        // And the user has not voted on the comment
        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
        const result = await performUpdateCommentScoreAction(page, {
            mode: 'api',
            voteValue: -1,
            isAuthenticated: true
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 0 (cannot go below zero)
        expect(result.upvotes).toBe(0);
        expect(result.upvotes).toBeGreaterThanOrEqual(0);
    });

    test('[API-257] Comment downvotes count never goes below zero', async ({ page }) => {
        // Given a comment exists with score 0, upvotes 0, downvotes 0
        // And the user is logged in
        // And the user has not voted on the comment
        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
        const result = await performUpdateCommentScoreAction(page, {
            mode: 'api',
            voteValue: 1,
            isAuthenticated: true
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment downvotes should be 0 (cannot go below zero)
        expect(result.downvotes).toBe(0);
        expect(result.downvotes).toBeGreaterThanOrEqual(0);
    });

});
