// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performCreateCommentRecordAction,
    createTestPostForComment,
    getPostDetails,
    createParentComment,
    createTestUserAndLogin,
    getCommentIdFromResult,
    getErrorFromResult,
    generateAnonymousId
} = require('./create-comment-record.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Create Comment Record
 *   As a user
 *   I want my validated comment to be saved to the database
 *   So that it becomes part of the post's discussion
 *
 *   # NOTE: This feature handles database insertion after comment validation passes
 *   # Upstream: Validate Comment Input (comment content is 1-2000 characters)
 */

test.describe('Create Comment Record', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-175] Create Comment Record Success for existing post', async ({ page }) => {
        // Given the comment content has passed validation
        // And a post exists with id "post-123"
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // When the client sends POST request to "/api/comments" with postId and content
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'This is my comment',
            postId: postSetup.postId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body should contain "id"
        expect(result.body.id).toBeDefined();

        // And the response body should contain "content"
        expect(result.body.content).toBeDefined();
        expect(result.body.content).toBe('This is my comment');

        // And the response body should contain "postId"
        expect(result.body.postId).toBeDefined();
        expect(result.body.postId).toBe(postSetup.postId);

        // And the response body should contain "createdAt"
        expect(result.body.createdAt).toBeDefined();
    });

    test('[API-176] Create Comment Record Failure (Post not found)', async ({ page }) => {
        // Given the comment content has passed validation
        // And no post exists with id "non-existent-post"

        // When the client sends POST request to "/api/comments" with postId "non-existent-post"
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'This is my comment',
            useNonExistentPost: true
        });

        // Then the response status should be 404
        expect(result.statusCode).toBe(404);

        // And the response error should be "Post not found"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Post not found');
    });

    test('[API-177] Create Comment Record Success with authenticated user', async ({ page }) => {
        // Given the comment content has passed validation
        // And a post exists
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // And the user is authenticated with userId "user-456"
        const userSetup = await createTestUserAndLogin(page, 'authcomment');
        expect(userSetup.success).toBe(true);
        expect(userSetup.userId).toBeDefined();

        // When the client sends POST request to "/api/comments" with authenticated user
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'Authenticated user comment',
            postId: postSetup.postId,
            userId: userSetup.userId,
            authToken: userSetup.token
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body should contain "id"
        expect(result.body.id).toBeDefined();

        // And the response body should contain "userId"
        expect(result.body.userId).toBeDefined();
    });

    test('[API-178] Create Comment Record Success with anonymous user', async ({ page }) => {
        // Given the comment content has passed validation
        // And a post exists
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // And the user is anonymous with anonymousId "anon-789"
        const anonymousId = generateAnonymousId();

        // When the client sends POST request to "/api/comments" with anonymous user
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'Anonymous user comment',
            postId: postSetup.postId,
            anonymousId: anonymousId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body should contain "id"
        expect(result.body.id).toBeDefined();

        // And the response body should contain "anonymousId"
        expect(result.body.anonymousId).toBeDefined();
    });

    test('[API-179] Create Reply Comment Record Success (nested comment)', async ({ page }) => {
        // Given the comment content has passed validation
        // And a post exists
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // And a comment exists with id "parent-comment-456" on post
        const parentCommentSetup = await createParentComment(page, postSetup.postId);
        expect(parentCommentSetup.success).toBe(true);
        expect(parentCommentSetup.commentId).toBeDefined();

        // When the client sends POST request to "/api/comments" with parentId
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'This is a reply',
            postId: postSetup.postId,
            parentId: parentCommentSetup.commentId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body should contain "id"
        expect(result.body.id).toBeDefined();

        // And the response body should contain "parentId"
        expect(result.body.parentId).toBeDefined();
        expect(result.body.parentId).toBe(parentCommentSetup.commentId);
    });

    test('[API-180] Create Reply Comment Record Failure (Parent comment not found)', async ({ page }) => {
        // Given the comment content has passed validation
        // And a post exists
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // And no comment exists with id "non-existent-parent"

        // When the client sends POST request to "/api/comments" with non-existent parentId
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'This is a reply',
            postId: postSetup.postId,
            parentId: 'non-existent-parent-comment-id',
            useNonExistentParent: true
        });

        // Then the response status should be 404
        expect(result.statusCode).toBe(404);

        // And the response error should be "Parent comment not found"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Parent comment not found');
    });

    test('[API-181] Create Comment Record increments post comment count', async ({ page }) => {
        // Given the comment content has passed validation
        // And a post exists with commentCount
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // Get initial comment count
        const initialPostDetails = await getPostDetails(page, postSetup.postId);
        expect(initialPostDetails.success).toBe(true);
        const initialCommentCount = initialPostDetails.commentCount;

        // When the client sends POST request to "/api/comments"
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'New comment',
            postId: postSetup.postId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the post commentCount should be incremented by 1
        const updatedPostDetails = await getPostDetails(page, postSetup.postId);
        expect(updatedPostDetails.success).toBe(true);
        expect(updatedPostDetails.commentCount).toBe(initialCommentCount + 1);
    });

    test('[API-182] Create Comment Record initializes vote counts to zero', async ({ page }) => {
        // Given the comment content has passed validation
        // And a post exists
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // When the client sends POST request to "/api/comments"
        const result = await performCreateCommentRecordAction(page, {
            mode: 'api',
            content: 'Fresh comment',
            postId: postSetup.postId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body "upvotes" should be 0
        expect(result.body.upvotes).toBe(0);

        // And the response body "downvotes" should be 0
        expect(result.body.downvotes).toBe(0);

        // And the response body "score" should be 0
        expect(result.body.score).toBe(0);
    });

});
