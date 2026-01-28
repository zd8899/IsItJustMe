const { test, expect } = require('../../../tdad-fixtures');
const {
    performUpdatePostScoreAction,
    getPostById,
    setupPostWithVoteCounts,
    setupCommentWithVoteCounts,
    setupPostWithExistingVote,
    setupCommentWithExistingVote,
    createTestPostForVoting,
    createTestCommentForVoting,
    generateVoterAnonymousId,
    getPostVoteCounts,
    getCommentVoteCounts,
    createTestUserWithAuth
} = require('./update-post-score.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Update Post Score
 *   As a system
 *   I want to recalculate post vote totals after voting operations
 *   So that the post score accurately reflects all user votes
 *
 * NOTE: Score = upvotes - downvotes
 * Score updates happen atomically with vote operations
 */

test.describe('Update Post Score', () => {

    // ==========================================
    // API TESTS - Score Calculation After New Vote
    // ==========================================

    test('[API-235] Post score increases after new upvote', async ({ page }) => {
        // Given a post exists with upvotes 0, downvotes 0, and score 0
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // And the user has not voted on the post (new anonymous voter)
        const voterAnonymousId = generateVoterAnonymousId();

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 1
        expect(result.upvotes).toBe(1);

        // And the post downvotes should be 0
        expect(result.downvotes).toBe(0);

        // And the post score should be 1
        expect(result.score).toBe(1);
    });

    test('[API-236] Post score decreases after new downvote', async ({ page }) => {
        // Given a post exists with upvotes 0, downvotes 0, and score 0
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // And the user has not voted on the post (new anonymous voter)
        const voterAnonymousId = generateVoterAnonymousId();

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 0
        expect(result.upvotes).toBe(0);

        // And the post downvotes should be 1
        expect(result.downvotes).toBe(1);

        // And the post score should be -1
        expect(result.score).toBe(-1);
    });

    // ==========================================
    // API TESTS - Score Calculation After Vote Direction Change
    // ==========================================

    test('[API-237] Post score decreases by 2 when upvote changes to downvote', async ({ page }) => {
        // Given a post exists with upvotes 5, downvotes 2, and score 3
        // And the user has previously upvoted the post
        const setup = await setupPostWithExistingVote(page, 5, 2, 1);
        expect(setup.success).toBe(true);

        // Verify initial state
        const initialCounts = await getPostVoteCounts(page, setup.postId);
        expect(initialCounts.success).toBe(true);
        expect(initialCounts.upvotes).toBe(5);
        expect(initialCounts.downvotes).toBe(2);
        expect(initialCounts.score).toBe(3);

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            value: -1,
            anonymousId: setup.voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 4
        expect(result.upvotes).toBe(4);

        // And the post downvotes should be 3
        expect(result.downvotes).toBe(3);

        // And the post score should be 1
        expect(result.score).toBe(1);
    });

    test('[API-238] Post score increases by 2 when downvote changes to upvote', async ({ page }) => {
        // Given a post exists with upvotes 5, downvotes 2, and score 3
        // And the user has previously downvoted the post
        const setup = await setupPostWithExistingVote(page, 5, 2, -1);
        expect(setup.success).toBe(true);

        // Verify initial state
        const initialCounts = await getPostVoteCounts(page, setup.postId);
        expect(initialCounts.success).toBe(true);
        expect(initialCounts.upvotes).toBe(5);
        expect(initialCounts.downvotes).toBe(2);
        expect(initialCounts.score).toBe(3);

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            value: 1,
            anonymousId: setup.voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 6
        expect(result.upvotes).toBe(6);

        // And the post downvotes should be 1
        expect(result.downvotes).toBe(1);

        // And the post score should be 5
        expect(result.score).toBe(5);
    });

    // ==========================================
    // API TESTS - Score Calculation After Vote Removal
    // ==========================================

    test('[API-239] Post score decreases when upvote is removed', async ({ page }) => {
        // Given a post exists with upvotes 10, downvotes 3, and score 7
        // And the user has previously upvoted the post
        const setup = await setupPostWithExistingVote(page, 10, 3, 1);
        expect(setup.success).toBe(true);

        // Verify initial state
        const initialCounts = await getPostVoteCounts(page, setup.postId);
        expect(initialCounts.success).toBe(true);
        expect(initialCounts.upvotes).toBe(10);
        expect(initialCounts.downvotes).toBe(3);
        expect(initialCounts.score).toBe(7);

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1 (toggle off)
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            value: 1,
            anonymousId: setup.voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 9
        expect(result.upvotes).toBe(9);

        // And the post downvotes should be 3
        expect(result.downvotes).toBe(3);

        // And the post score should be 6
        expect(result.score).toBe(6);
    });

    test('[API-240] Post score increases when downvote is removed', async ({ page }) => {
        // Given a post exists with upvotes 10, downvotes 3, and score 7
        // And the user has previously downvoted the post
        const setup = await setupPostWithExistingVote(page, 10, 3, -1);
        expect(setup.success).toBe(true);

        // Verify initial state
        const initialCounts = await getPostVoteCounts(page, setup.postId);
        expect(initialCounts.success).toBe(true);
        expect(initialCounts.upvotes).toBe(10);
        expect(initialCounts.downvotes).toBe(3);
        expect(initialCounts.score).toBe(7);

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1 (toggle off)
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            value: -1,
            anonymousId: setup.voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 10
        expect(result.upvotes).toBe(10);

        // And the post downvotes should be 2
        expect(result.downvotes).toBe(2);

        // And the post score should be 8
        expect(result.score).toBe(8);
    });

    // ==========================================
    // API TESTS - Score Verification via GET Request
    // ==========================================

    test('[API-241] Post score is correctly returned in post details', async ({ page }) => {
        // Given a post exists with upvotes 15, downvotes 5, and score 10
        const setup = await setupPostWithVoteCounts(page, 15, 5);
        expect(setup.success).toBe(true);

        // When the client sends GET request to "/api/trpc/post.getById" with the post id
        const result = await getPostById(page, setup.postId);

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the response body should contain upvotes 15
        expect(result.upvotes).toBe(15);

        // And the response body should contain downvotes 5
        expect(result.downvotes).toBe(5);

        // And the response body should contain score 10
        expect(result.score).toBe(10);
    });

    // ==========================================
    // API TESTS - Anonymous User Score Updates
    // ==========================================

    test('[API-242] Post score updates correctly for anonymous user vote', async ({ page }) => {
        // Given a post exists with upvotes 3, downvotes 1, and score 2
        const setup = await setupPostWithVoteCounts(page, 3, 1);
        expect(setup.success).toBe(true);

        // Verify initial state
        const initialCounts = await getPostVoteCounts(page, setup.postId);
        expect(initialCounts.success).toBe(true);
        expect(initialCounts.upvotes).toBe(3);
        expect(initialCounts.downvotes).toBe(1);
        expect(initialCounts.score).toBe(2);

        // And the user has an anonymous session
        // And the anonymous user has not voted on the post
        const voterAnonymousId = generateVoterAnonymousId();

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 4
        expect(result.upvotes).toBe(4);

        // And the post downvotes should be 1
        expect(result.downvotes).toBe(1);

        // And the post score should be 3
        expect(result.score).toBe(3);
    });

    // ==========================================
    // API TESTS - Comment Score Updates
    // ==========================================

    test('[API-243] Comment score increases after new upvote', async ({ page }) => {
        // Given a comment exists with upvotes 0, downvotes 0, and score 0
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // And the user has not voted on the comment (new anonymous voter)
        const voterAnonymousId = generateVoterAnonymousId();

        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
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

    test('[API-244] Comment score decreases after new downvote', async ({ page }) => {
        // Given a comment exists with upvotes 0, downvotes 0, and score 0
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // And the user has not voted on the comment (new anonymous voter)
        const voterAnonymousId = generateVoterAnonymousId();

        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            anonymousId: voterAnonymousId
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

    test('[API-245] Comment score updates correctly when vote direction changes', async ({ page }) => {
        // Given a comment exists with upvotes 8, downvotes 2, and score 6
        // And the user has previously upvoted the comment
        const setup = await setupCommentWithExistingVote(page, 8, 2, 1);
        expect(setup.success).toBe(true);

        // Verify initial state
        const initialCounts = await getCommentVoteCounts(page, setup.commentId);
        expect(initialCounts.success).toBe(true);
        expect(initialCounts.upvotes).toBe(8);
        expect(initialCounts.downvotes).toBe(2);
        expect(initialCounts.score).toBe(6);

        // When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: setup.commentId,
            value: -1,
            anonymousId: setup.voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the comment upvotes should be 7
        expect(result.upvotes).toBe(7);

        // And the comment downvotes should be 3
        expect(result.downvotes).toBe(3);

        // And the comment score should be 4
        expect(result.score).toBe(4);
    });

    // ==========================================
    // API TESTS - Edge Case: Score Handles Negative Values
    // ==========================================

    test('[API-246] Post score correctly handles negative values', async ({ page }) => {
        // Given a post exists with upvotes 2, downvotes 5, and score -3
        const setup = await setupPostWithVoteCounts(page, 2, 5);
        expect(setup.success).toBe(true);

        // Verify initial state
        const initialCounts = await getPostVoteCounts(page, setup.postId);
        expect(initialCounts.success).toBe(true);
        expect(initialCounts.upvotes).toBe(2);
        expect(initialCounts.downvotes).toBe(5);
        expect(initialCounts.score).toBe(-3);

        // And the user has not voted on the post (new anonymous voter)
        const voterAnonymousId = generateVoterAnonymousId();

        // When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
        const result = await performUpdatePostScoreAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: setup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Then the response status should be 200
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // And the post upvotes should be 2
        expect(result.upvotes).toBe(2);

        // And the post downvotes should be 6
        expect(result.downvotes).toBe(6);

        // And the post score should be -4
        expect(result.score).toBe(-4);
    });

});
