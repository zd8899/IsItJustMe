// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performValidateVoteInputAction,
    createTestPostForVoting,
    createTestCommentForVoting,
    generateVoterAnonymousId,
    getErrorFromResult
} = require('./validate-vote-input.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Validate Vote Input
 *   As a user
 *   I want the system to validate my vote input
 *   So that only valid votes are recorded in the system
 *
 * NOTE: Valid vote values are +1 (upvote) or -1 (downvote) only
 */

test.describe('Validate Vote Input', () => {

    // ==========================================
    // API TESTS - POST VOTING
    // ==========================================

    test('[API-196] Valid upvote value accepted for post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request to cast a post vote with value 1
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Assert: Vote should be recorded with value 1
        expect(result.voteValue).toBe(1);
        expect(result.voteId).toBeDefined();
    });

    test('[API-197] Valid downvote value accepted for post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request to cast a post vote with value -1
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Assert: Vote should be recorded with value -1
        expect(result.voteValue).toBe(-1);
        expect(result.voteId).toBeDefined();
    });

    // ==========================================
    // API TESTS - COMMENT VOTING
    // ==========================================

    test('[API-198] Valid upvote value accepted for comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request to cast a comment vote with value 1
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Assert: Vote should be recorded with value 1
        expect(result.voteValue).toBe(1);
        expect(result.voteId).toBeDefined();
    });

    test('[API-199] Valid downvote value accepted for comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request to cast a comment vote with value -1
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Assert: Vote should be recorded with value -1
        expect(result.voteValue).toBe(-1);
        expect(result.voteId).toBeDefined();
    });

    // ==========================================
    // API TESTS - INVALID VALUES FOR POST
    // ==========================================

    test('[API-200] Invalid vote value too high rejected for post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request with value 2 (invalid - too high)
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 2,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message should indicate value too high
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Number must be less than or equal to 1');
    });

    test('[API-201] Invalid vote value too low rejected for post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request with value -2 (invalid - too low)
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -2,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message should indicate value too low
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Number must be greater than or equal to -1');
    });

    // ==========================================
    // API TESTS - INVALID VALUES FOR COMMENT
    // ==========================================

    test('[API-202] Invalid vote value too high rejected for comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request with value 2 (invalid - too high)
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 2,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message should indicate value too high
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Number must be less than or equal to 1');
    });

    test('[API-203] Invalid vote value too low rejected for comment', async ({ page }) => {
        // Setup: Create a comment to vote on
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request with value -2 (invalid - too low)
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -2,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message should indicate value too low
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Number must be greater than or equal to -1');
    });

    // ==========================================
    // API TESTS - MISSING/INVALID TYPE VALUES
    // ==========================================

    test('[API-204] Missing vote value rejected for post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request without value field
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            omitValue: true,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message should indicate value is required
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Required');
    });

    test('[API-205] Non-numeric vote value rejected for post', async ({ page }) => {
        // Setup: Create a post to vote on
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        // Generate unique anonymous ID for this voter
        const voterAnonymousId = generateVoterAnonymousId();

        // Execute: Send POST request with string value "invalid"
        const result = await performValidateVoteInputAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 'invalid',
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message should indicate type error
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Expected number, received string');
    });

});
