// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performValidateCommentInputAction,
    createTestPostForComment,
    getCommentIdFromResult,
    getErrorFromResult
} = require('./validate-comment-input.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Validate Comment Input
 *   As a user
 *   I want to receive validation feedback on my comment input
 *   So that I can submit properly formatted comments
 *
 *   # NOTE: Comment content must be 3-2000 characters
 */

test.describe('Validate Comment Input', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-163] Create Comment API Success with valid content', async ({ page }) => {
        // Given a post exists in the system
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // When the client sends POST request to "/api/comments" with content "This is a valid comment"
        const result = await performValidateCommentInputAction(page, {
            mode: 'api',
            content: 'This is a valid comment',
            postId: postSetup.postId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body should contain "id"
        expect(result.body.id).toBeDefined();

        // And the response body should contain "content"
        expect(result.body.content).toBeDefined();
        expect(result.body.content).toBe('This is a valid comment');
    });

    test('[API-164] Create Comment API Failure (Empty content)', async ({ page }) => {
        // Given a post exists in the system
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // When the client sends POST request to "/api/comments" with empty content
        const result = await performValidateCommentInputAction(page, {
            mode: 'api',
            emptyContent: true,
            postId: postSetup.postId
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "Comment is required"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Comment is required');
    });

    test('[API-165] Create Comment API Failure (Content exceeds maximum length)', async ({ page }) => {
        // Given a post exists in the system
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // When the client sends POST request to "/api/comments" with content exceeding 2000 characters
        const result = await performValidateCommentInputAction(page, {
            mode: 'api',
            overMaxContent: true,
            postId: postSetup.postId
        });

        // Then the response status should be 400
        expect(result.statusCode).toBe(400);

        // And the response error should be "Comment must be less than 2000 characters"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Comment must be less than 2000 characters');
    });

    test('[API-166] Create Comment API Success with minimum valid content', async ({ page }) => {
        // Given a post exists in the system
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // When the client sends POST request to "/api/comments" with content "Yes"
        const result = await performValidateCommentInputAction(page, {
            mode: 'api',
            content: 'Yes',
            postId: postSetup.postId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body should contain "id"
        expect(result.body.id).toBeDefined();
    });

    test('[API-167] Create Comment API Success with maximum valid content', async ({ page }) => {
        // Given a post exists in the system
        const postSetup = await createTestPostForComment(page);
        expect(postSetup.success).toBe(true);
        expect(postSetup.postId).toBeDefined();

        // When the client sends POST request to "/api/comments" with content of exactly 2000 characters
        const result = await performValidateCommentInputAction(page, {
            mode: 'api',
            exactContentLength: 2000,
            postId: postSetup.postId
        });

        // Then the response status should be 201
        expect(result.statusCode).toBe(201);

        // And the response body should contain "id"
        expect(result.body.id).toBeDefined();
    });

});
