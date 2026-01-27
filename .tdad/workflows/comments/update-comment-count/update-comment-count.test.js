// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performUpdateCommentCountAction,
    getPostCommentCount,
    createMultipleCommentsAndVerifyCount,
    verifyCommentCountIsolation,
    createTestPostForComment,
    createParentComment,
    performCreateCommentRecordAction
} = require('./update-comment-count.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Update Comment Count
 *   As a user
 *   I want the post comment count to be incremented when a comment is created
 *   So that I can see how many comments a post has received
 */

test.describe('Update Comment Count', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-183] Comment count increments by 1 for new top-level comment', async ({ page }) => {
        // Setup: Create a test post
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);

        // Get initial comment count (should be 0 for new post)
        const initialCount = await getPostCommentCount(page, postSetup.postId);
        expect(initialCount.success).toBe(true);

        // Create a new top-level comment
        const result = await performUpdateCommentCountAction(page, {
            mode: 'api',
            postId: postSetup.postId,
            content: `First comment ${Date.now()}`
        });

        // Verify comment was created successfully
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(201);

        // Verify comment count incremented by 1
        expect(result.finalCount).toBe(result.initialCount + 1);
        expect(result.countIncremented).toBe(true);
    });

    test('[API-184] Comment count increments by 1 for reply comment', async ({ page }) => {
        // Setup: Create a test post
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);

        // Create a parent comment first
        const parentComment = await createParentComment(page, postSetup.postId);
        expect(parentComment.success).toBe(true);

        // Get comment count after parent comment
        const countAfterParent = await getPostCommentCount(page, postSetup.postId);
        expect(countAfterParent.success).toBe(true);

        // Create a reply comment
        const result = await performUpdateCommentCountAction(page, {
            mode: 'api',
            postId: postSetup.postId,
            parentId: parentComment.commentId,
            content: `This is a reply ${Date.now()}`
        });

        // Verify reply was created successfully
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(201);

        // Verify comment count incremented by 1
        expect(result.finalCount).toBe(result.initialCount + 1);
        expect(result.countIncremented).toBe(true);
    });

    test('[API-185] Comment count accumulates correctly with multiple comments', async ({ page }) => {
        // Setup: Create a test post
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);

        // Create first comment and verify count
        const firstResult = await performCreateCommentRecordAction(page, {
            mode: 'api',
            postId: postSetup.postId,
            content: `Comment eleven ${Date.now()}`
        });
        expect(firstResult.success).toBe(true);
        expect(firstResult.statusCode).toBe(201);

        // Get count after first comment
        const countAfterFirst = await getPostCommentCount(page, postSetup.postId);
        expect(countAfterFirst.success).toBe(true);
        expect(countAfterFirst.commentCount).toBe(1);

        // Create second comment and verify count
        const secondResult = await performCreateCommentRecordAction(page, {
            mode: 'api',
            postId: postSetup.postId,
            content: `Comment twelve ${Date.now()}`
        });
        expect(secondResult.success).toBe(true);
        expect(secondResult.statusCode).toBe(201);

        // Get count after second comment
        const countAfterSecond = await getPostCommentCount(page, postSetup.postId);
        expect(countAfterSecond.success).toBe(true);
        expect(countAfterSecond.commentCount).toBe(2);
    });

    test('[API-186] Comment count is reflected when fetching post details', async ({ page }) => {
        // Setup: Create a test post
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);

        // Get initial count
        const initialCount = await getPostCommentCount(page, postSetup.postId);
        expect(initialCount.success).toBe(true);

        // Create a new comment
        const createResult = await performCreateCommentRecordAction(page, {
            mode: 'api',
            postId: postSetup.postId,
            content: `New comment ${Date.now()}`
        });
        expect(createResult.success).toBe(true);
        expect(createResult.statusCode).toBe(201);

        // Fetch post details and verify comment count is incremented
        const response = await page.request.get('/api/posts');
        expect(response.status()).toBe(200);

        const posts = await response.json();
        const post = posts.find(p => p.id === postSetup.postId);

        expect(post).toBeDefined();
        expect(post.commentCount).toBe(initialCount.commentCount + 1);
    });

    test('[API-187] Comment count only updates for the target post', async ({ page }) => {
        // Setup: Create two test posts
        const postSetup1 = await createTestPostForComment(page);
        expect(postSetup1.success).toBe(true);

        const postSetup2 = await createTestPostForComment(page);
        expect(postSetup2.success).toBe(true);

        // Verify isolation: comment on post1 should not affect post2
        const isolationResult = await verifyCommentCountIsolation(
            page,
            postSetup1.postId,
            postSetup2.postId
        );

        expect(isolationResult.success).toBe(true);

        // Target post should have incremented by 1
        expect(isolationResult.targetIncremented).toBe(true);
        expect(isolationResult.targetFinalCount).toBe(isolationResult.targetInitialCount + 1);

        // Other post should remain unchanged
        expect(isolationResult.otherUnchanged).toBe(true);
        expect(isolationResult.otherFinalCount).toBe(isolationResult.otherInitialCount);
    });

});
