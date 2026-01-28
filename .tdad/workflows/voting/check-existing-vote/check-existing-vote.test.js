// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performCheckExistingVoteAction,
    createTestPostForVoting,
    createTestCommentForVoting,
    generateVoterAnonymousId,
    castInitialVote,
    hasExistingVote,
    isNewVoteCreated,
    getErrorFromResult
} = require('./check-existing-vote.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Check Existing Vote
 *   As a user
 *   I want the system to check if I have already voted on a post or comment
 *   So that my vote can be properly created or updated
 *
 * NOTE: Users can be identified by userId (registered) or anonymousId (anonymous)
 * Unique constraints: [postId, userId], [postId, anonymousId], [commentId, userId], [commentId, anonymousId]
 */

test.describe('Check Existing Vote', () => {

    // ==========================================
    // API TESTS - EXISTING VOTES ON POSTS
    // ==========================================

    test('[API-206] Find existing upvote by registered user on post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID to simulate a registered user's session
        // Note: In this system, even registered users use anonymousId for vote tracking
        const voterAnonymousId = generateVoterAnonymousId();

        // Setup: Cast an initial upvote with value 1
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Execute: Try to cast another vote with the same anonymousId
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200 (per feature spec)
        expect(result.statusCode).toBe(200);

        // Assert: Should indicate existing vote was found (deleted/toggled off)
        expect(hasExistingVote(result)).toBe(true);
    });

    test('[API-207] Find existing downvote by registered user on post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID
        const voterAnonymousId = generateVoterAnonymousId();

        // Setup: Cast an initial downvote with value -1
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Execute: Try to cast another vote with the same anonymousId
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200 (per feature spec)
        expect(result.statusCode).toBe(200);

        // Assert: Should indicate existing vote was found (deleted/toggled off)
        expect(hasExistingVote(result)).toBe(true);
    });

    test('[API-208] Find existing vote by anonymous user on post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for anonymous user
        const anonymousUserId = generateVoterAnonymousId();

        // Setup: Anonymous user casts initial vote with value 1
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: anonymousUserId
        });
        expect(initialVote.success).toBe(true);

        // Execute: Anonymous user tries to vote again
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: anonymousUserId
        });

        // Assert: Response status should be 200 (per feature spec)
        expect(result.statusCode).toBe(200);

        // Assert: Should indicate existing vote was found (deleted/toggled off)
        expect(hasExistingVote(result)).toBe(true);
    });

    // ==========================================
    // API TESTS - EXISTING VOTES ON COMMENTS
    // ==========================================

    test('[API-209] Find existing vote by registered user on comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID
        const voterAnonymousId = generateVoterAnonymousId();

        // Setup: Cast an initial upvote on the comment
        const initialVote = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Execute: Try to cast another vote with the same anonymousId
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200 (per feature spec)
        expect(result.statusCode).toBe(200);

        // Assert: Should indicate existing vote was found (deleted/toggled off)
        expect(hasExistingVote(result)).toBe(true);
    });

    test('[API-210] Find existing vote by anonymous user on comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID for anonymous user
        const anonymousUserId = generateVoterAnonymousId();

        // Setup: Anonymous user casts initial vote on comment
        const initialVote = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: anonymousUserId
        });
        expect(initialVote.success).toBe(true);

        // Execute: Anonymous user tries to vote again on comment
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: anonymousUserId
        });

        // Assert: Response status should be 200 (per feature spec)
        expect(result.statusCode).toBe(200);

        // Assert: Should indicate existing vote was found (deleted/toggled off)
        expect(hasExistingVote(result)).toBe(true);
    });

    // ==========================================
    // API TESTS - NO EXISTING VOTE (NEW VOTE CREATION)
    // ==========================================

    test('[API-211] No existing vote found for registered user on post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID (first time voter)
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Cast vote on post (no existing vote)
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200 (success)
        expect(result.statusCode).toBe(200);

        // Assert: A new vote should be created
        expect(isNewVoteCreated(result)).toBe(true);

        // Assert: Vote ID should be returned
        expect(result.voteId).toBeDefined();
    });

    test('[API-212] No existing vote found for anonymous user on post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for new anonymous user
        const anonymousUserId = generateVoterAnonymousId();

        // Execute: Anonymous user casts first vote on post
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: anonymousUserId
        });

        // Assert: Response status should be 200 (success)
        expect(result.statusCode).toBe(200);

        // Assert: A new vote should be created
        expect(isNewVoteCreated(result)).toBe(true);

        // Assert: Vote ID should be returned
        expect(result.voteId).toBeDefined();
    });

    test('[API-213] No existing vote found for registered user on comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID (first time voter on this comment)
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Cast vote on comment (no existing vote)
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200 (success)
        expect(result.statusCode).toBe(200);

        // Assert: A new vote should be created
        expect(isNewVoteCreated(result)).toBe(true);

        // Assert: Vote ID should be returned
        expect(result.voteId).toBeDefined();
    });

    test('[API-214] No existing vote found for anonymous user on comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID for new anonymous user
        const anonymousUserId = generateVoterAnonymousId();

        // Execute: Anonymous user casts first vote on comment
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: anonymousUserId
        });

        // Assert: Response status should be 200 (success)
        expect(result.statusCode).toBe(200);

        // Assert: A new vote should be created
        expect(isNewVoteCreated(result)).toBe(true);

        // Assert: Vote ID should be returned
        expect(result.voteId).toBeDefined();
    });

    // ==========================================
    // API TESTS - NON-EXISTENT RESOURCES
    // ==========================================

    test('[API-215] Check vote on non-existent post', async ({ page }) => {
        // Generate unique anonymous ID
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Try to vote on a non-existent post
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: 'non-existent-id',
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 404
        expect(result.statusCode).toBe(404);

        // Assert: Error message should indicate post not found
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Post not found');
    });

    test('[API-216] Check vote on non-existent comment', async ({ page }) => {
        // Generate unique anonymous ID
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Try to vote on a non-existent comment
        const result = await performCheckExistingVoteAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: 'non-existent-id',
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 404
        expect(result.statusCode).toBe(404);

        // Assert: Error message should indicate comment not found
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Comment not found');
    });

});
