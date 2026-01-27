// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performFetchCommentsByPostAction,
    createTestPost,
    createTestComment,
    getTestCategory,
    createPostWithComments,
    getCommentsFromResult,
    getErrorFromResult,
    validateCommentFields
} = require('./fetch-comments-by-post.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Fetch Comments By Post
 *
 *   As a user
 *   I want to retrieve comments for a specific post
 *   So that I can read the discussion and responses
 */

test.describe('Fetch Comments By Post', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-168] Fetch comments by post ID success', async ({ page }) => {
        // Setup: Create a post with comments
        const setupResult = await createPostWithComments(page, { commentCount: 2 });
        expect(setupResult.success).toBe(true);
        expect(setupResult.postId).toBeDefined();
        expect(setupResult.commentIds.length).toBeGreaterThan(0);

        // Execute: Fetch comments for the post
        const result = await performFetchCommentsByPostAction(page, {
            mode: 'api',
            postId: setupResult.postId
        });

        // Assert: API returns 200 with comments array
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.comments)).toBe(true);
        expect(result.comments.length).toBeGreaterThan(0);

        // Assert: Each comment has required fields
        const firstComment = result.comments[0];
        expect(firstComment.id).toBeDefined();
        expect(firstComment.content).toBeDefined();
        expect(firstComment.postId).toBeDefined();
        expect(firstComment.createdAt).toBeDefined();
    });

    test('[API-169] Fetch comments returns vote counts', async ({ page }) => {
        // Setup: Create a post with comments
        const setupResult = await createPostWithComments(page, { commentCount: 1 });
        expect(setupResult.success).toBe(true);
        expect(setupResult.postId).toBeDefined();

        // Execute: Fetch comments for the post
        const result = await performFetchCommentsByPostAction(page, {
            mode: 'api',
            postId: setupResult.postId
        });

        // Assert: API returns 200
        expect(result.statusCode).toBe(200);
        expect(result.comments.length).toBeGreaterThan(0);

        // Assert: Each comment contains vote fields
        const firstComment = result.comments[0];
        expect(firstComment.upvotes).toBeDefined();
        expect(firstComment.downvotes).toBeDefined();
        expect(firstComment.score).toBeDefined();

        // Assert: Vote counts are numbers
        expect(typeof firstComment.upvotes).toBe('number');
        expect(typeof firstComment.downvotes).toBe('number');
        expect(typeof firstComment.score).toBe('number');
    });

    test('[API-170] Fetch comments returns nested replies', async ({ page }) => {
        // Setup: Create a post with comments and replies
        const setupResult = await createPostWithComments(page, {
            commentCount: 1,
            withReplies: true
        });
        expect(setupResult.success).toBe(true);
        expect(setupResult.postId).toBeDefined();
        expect(setupResult.replyIds.length).toBeGreaterThan(0);

        // Execute: Fetch comments for the post
        const result = await performFetchCommentsByPostAction(page, {
            mode: 'api',
            postId: setupResult.postId
        });

        // Assert: API returns 200
        expect(result.statusCode).toBe(200);
        expect(result.comments.length).toBeGreaterThan(0);

        // Assert: Response includes parent comments with nested replies
        // The API may return comments flat or nested - check for either structure
        const hasReplies = result.comments.some(comment =>
            comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0
        );
        const hasParentIdField = result.comments.some(comment =>
            comment.parentId !== null && comment.parentId !== undefined
        );

        // Either replies are nested OR comments have parentId indicating parent-child relationship
        expect(hasReplies || hasParentIdField).toBe(true);
    });

    test('[API-171] Fetch comments for post with no comments', async ({ page }) => {
        // Setup: Get a valid category
        const categoryResult = await getTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Create a post WITHOUT any comments
        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        expect(postResult.success).toBe(true);
        expect(postResult.postId).toBeDefined();

        // Execute: Fetch comments for the post
        const result = await performFetchCommentsByPostAction(page, {
            mode: 'api',
            postId: postResult.postId
        });

        // Assert: API returns 200 with empty array
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.comments)).toBe(true);
        expect(result.comments.length).toBe(0);
    });

    test('[API-172] Fetch comments failure - post not found', async ({ page }) => {
        // Execute: Attempt to fetch comments for non-existent post
        const result = await performFetchCommentsByPostAction(page, {
            mode: 'api',
            nonExistent: true
        });

        // Assert: API returns 404
        expect(result.statusCode).toBe(404);

        // Assert: Error message is "Post not found"
        const error = getErrorFromResult(result);
        expect(error).toBe('Post not found');
    });

    test('[API-173] Fetch comments failure - invalid post ID format', async ({ page }) => {
        // Execute: Attempt to fetch comments with invalid ID format
        const result = await performFetchCommentsByPostAction(page, {
            mode: 'api',
            invalidFormat: true
        });

        // Assert: API returns 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message is "Invalid post ID"
        const error = getErrorFromResult(result);
        expect(error).toBe('Invalid post ID');
    });

    test('[API-174] Fetch comments failure - missing post ID parameter', async ({ page }) => {
        // Execute: Attempt to fetch comments without postId parameter
        const result = await performFetchCommentsByPostAction(page, {
            mode: 'api',
            missingPostId: true
        });

        // Assert: API returns 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message is "Post ID is required"
        const error = getErrorFromResult(result);
        expect(error).toBe('Post ID is required');
    });

});
