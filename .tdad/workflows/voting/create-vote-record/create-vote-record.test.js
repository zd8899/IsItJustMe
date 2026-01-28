// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performCreateVoteRecordAction,
    createTestPostForVoting,
    createTestCommentForVoting,
    generateVoterAnonymousId,
    getPostVoteCounts,
    getCommentVoteCounts,
    castInitialVote,
    createTestUserWithAuth
} = require('./create-vote-record.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Create Vote Record
 *   As a user
 *   I want the system to create or update my vote in the database
 *   So that my voting intention is persisted and reflected in vote counts
 *
 * NOTE: Vote values are +1 (upvote) or -1 (downvote)
 * Creates new vote if none exists, updates if changing direction, removes if same value
 */

test.describe('Create Vote Record', () => {

    // ==========================================
    // API TESTS - NEW VOTE CREATION (POST)
    // ==========================================

    test('[API-217] Create new upvote by registered user on post', async ({ page }) => {
        // Setup: Create a post and a registered user
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const userSetup = await createTestUserWithAuth(page);
        expect(userSetup.success).toBe(true);

        // Get initial vote counts
        const initialCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast upvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            authToken: userSetup.authToken
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value 1
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(1);

        // Verify vote counts increased
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(initialCounts.upvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score + 1);
    });

    test('[API-218] Create new downvote by registered user on post', async ({ page }) => {
        // Setup: Create a post and a registered user
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const userSetup = await createTestUserWithAuth(page);
        expect(userSetup.success).toBe(true);

        // Get initial vote counts
        const initialCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast downvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            authToken: userSetup.authToken
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value -1
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(-1);

        // Verify vote counts
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(initialCounts.downvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score - 1);
    });

    test('[API-219] Create new upvote by anonymous user on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Get initial vote counts
        const initialCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast upvote as anonymous user
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value 1 and anonymousId
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(1);

        // Verify vote counts increased
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(initialCounts.upvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score + 1);
    });

    test('[API-220] Create new downvote by anonymous user on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Get initial vote counts
        const initialCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast downvote as anonymous user
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value -1 and anonymousId
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(-1);

        // Verify vote counts
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(initialCounts.downvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score - 1);
    });

    // ==========================================
    // API TESTS - NEW VOTE CREATION (COMMENT)
    // ==========================================

    test('[API-221] Create new upvote by registered user on comment', async ({ page }) => {
        // Setup: Create a comment and a registered user
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const userSetup = await createTestUserWithAuth(page);
        expect(userSetup.success).toBe(true);

        // Get initial vote counts
        const initialCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast upvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            authToken: userSetup.authToken
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value 1
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(1);

        // Verify vote counts increased
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(initialCounts.upvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score + 1);
    });

    test('[API-222] Create new downvote by registered user on comment', async ({ page }) => {
        // Setup: Create a comment and a registered user
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const userSetup = await createTestUserWithAuth(page);
        expect(userSetup.success).toBe(true);

        // Get initial vote counts
        const initialCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast downvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            authToken: userSetup.authToken
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value -1
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(-1);

        // Verify vote counts
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(initialCounts.downvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score - 1);
    });

    test('[API-223] Create new upvote by anonymous user on comment', async ({ page }) => {
        // Setup: Create a comment
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Get initial vote counts
        const initialCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast upvote as anonymous user
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value 1 and anonymousId
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(1);

        // Verify vote counts increased
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(initialCounts.upvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score + 1);
    });

    test('[API-224] Create new downvote by anonymous user on comment', async ({ page }) => {
        // Setup: Create a comment
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Get initial vote counts
        const initialCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(initialCounts.success).toBe(true);

        // Execute: Cast downvote as anonymous user
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);
        expect(result.success).toBe(true);

        // Assert: Vote record should be created with value -1 and anonymousId
        expect(result.voteId).toBeDefined();
        expect(result.voteValue).toBe(-1);

        // Verify vote counts
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(initialCounts.downvotes + 1);
        expect(finalCounts.score).toBe(initialCounts.score - 1);
    });

    // ==========================================
    // API TESTS - UPDATE EXISTING VOTE (POST)
    // ==========================================

    test('[API-225] Change upvote to downvote on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial upvote
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial upvote
        const afterUpvoteCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(afterUpvoteCounts.success).toBe(true);

        // Execute: Change to downvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote counts changed appropriately
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(afterUpvoteCounts.upvotes - 1);
        expect(finalCounts.downvotes).toBe(afterUpvoteCounts.downvotes + 1);
        expect(finalCounts.score).toBe(afterUpvoteCounts.score - 2);
    });

    test('[API-226] Change downvote to upvote on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial downvote
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial downvote
        const afterDownvoteCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(afterDownvoteCounts.success).toBe(true);

        // Execute: Change to upvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote counts changed appropriately
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(afterDownvoteCounts.downvotes - 1);
        expect(finalCounts.upvotes).toBe(afterDownvoteCounts.upvotes + 1);
        expect(finalCounts.score).toBe(afterDownvoteCounts.score + 2);
    });

    // ==========================================
    // API TESTS - UPDATE EXISTING VOTE (COMMENT)
    // ==========================================

    test('[API-227] Change upvote to downvote on comment', async ({ page }) => {
        // Setup: Create a comment
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial upvote
        const initialVote = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial upvote
        const afterUpvoteCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(afterUpvoteCounts.success).toBe(true);

        // Execute: Change to downvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote counts changed appropriately
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(afterUpvoteCounts.upvotes - 1);
        expect(finalCounts.downvotes).toBe(afterUpvoteCounts.downvotes + 1);
        expect(finalCounts.score).toBe(afterUpvoteCounts.score - 2);
    });

    test('[API-228] Change downvote to upvote on comment', async ({ page }) => {
        // Setup: Create a comment
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial downvote
        const initialVote = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial downvote
        const afterDownvoteCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(afterDownvoteCounts.success).toBe(true);

        // Execute: Change to upvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote counts changed appropriately
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(afterDownvoteCounts.downvotes - 1);
        expect(finalCounts.upvotes).toBe(afterDownvoteCounts.upvotes + 1);
        expect(finalCounts.score).toBe(afterDownvoteCounts.score + 2);
    });

    // ==========================================
    // API TESTS - REMOVE VOTE (POST)
    // ==========================================

    test('[API-229] Remove upvote by voting same value on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial upvote
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial upvote
        const afterUpvoteCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(afterUpvoteCounts.success).toBe(true);

        // Execute: Vote with same value (should remove vote)
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote was removed
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(afterUpvoteCounts.upvotes - 1);
        expect(finalCounts.score).toBe(afterUpvoteCounts.score - 1);
    });

    test('[API-230] Remove downvote by voting same value on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial downvote
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial downvote
        const afterDownvoteCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(afterDownvoteCounts.success).toBe(true);

        // Execute: Vote with same value (should remove vote)
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote was removed
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(afterDownvoteCounts.downvotes - 1);
        expect(finalCounts.score).toBe(afterDownvoteCounts.score + 1);
    });

    // ==========================================
    // API TESTS - REMOVE VOTE (COMMENT)
    // ==========================================

    test('[API-231] Remove upvote by voting same value on comment', async ({ page }) => {
        // Setup: Create a comment
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial upvote
        const initialVote = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial upvote
        const afterUpvoteCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(afterUpvoteCounts.success).toBe(true);

        // Execute: Vote with same value (should remove vote)
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote was removed
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(afterUpvoteCounts.upvotes - 1);
        expect(finalCounts.score).toBe(afterUpvoteCounts.score - 1);
    });

    test('[API-232] Remove downvote by voting same value on comment', async ({ page }) => {
        // Setup: Create a comment
        const commentSetup = await createTestCommentForVoting(page);
        expect(commentSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial downvote
        const initialVote = await castInitialVote(page, {
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial downvote
        const afterDownvoteCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(afterDownvoteCounts.success).toBe(true);

        // Execute: Vote with same value (should remove vote)
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'comment',
            commentId: commentSetup.commentId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote was removed
        const finalCounts = await getCommentVoteCounts(page, commentSetup.commentId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.downvotes).toBe(afterDownvoteCounts.downvotes - 1);
        expect(finalCounts.score).toBe(afterDownvoteCounts.score + 1);
    });

    // ==========================================
    // API TESTS - ANONYMOUS USER VOTE CHANGES
    // ==========================================

    test('[API-233] Anonymous user changes upvote to downvote on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial upvote
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial upvote
        const afterUpvoteCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(afterUpvoteCounts.success).toBe(true);

        // Execute: Change to downvote
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: -1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote counts changed appropriately
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(afterUpvoteCounts.upvotes - 1);
        expect(finalCounts.downvotes).toBe(afterUpvoteCounts.downvotes + 1);
        expect(finalCounts.score).toBe(afterUpvoteCounts.score - 2);
    });

    test('[API-234] Anonymous user removes vote on post', async ({ page }) => {
        // Setup: Create a post
        const postSetup = await createTestPostForVoting(page);
        expect(postSetup.success).toBe(true);

        const voterAnonymousId = generateVoterAnonymousId();

        // Cast initial upvote
        const initialVote = await castInitialVote(page, {
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });
        expect(initialVote.success).toBe(true);

        // Get counts after initial upvote
        const afterUpvoteCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(afterUpvoteCounts.success).toBe(true);

        // Execute: Vote with same value (should remove vote)
        const result = await performCreateVoteRecordAction(page, {
            mode: 'api',
            targetType: 'post',
            postId: postSetup.postId,
            value: 1,
            anonymousId: voterAnonymousId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Verify vote was removed
        const finalCounts = await getPostVoteCounts(page, postSetup.postId);
        expect(finalCounts.success).toBe(true);
        expect(finalCounts.upvotes).toBe(afterUpvoteCounts.upvotes - 1);
        expect(finalCounts.score).toBe(afterUpvoteCounts.score - 1);
    });

});
