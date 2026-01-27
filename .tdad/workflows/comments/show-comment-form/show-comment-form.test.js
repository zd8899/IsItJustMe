// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowCommentFormAction,
    navigateToPostDetailForComment,
    typeInCommentTextarea,
    getCommentTextareaPlaceholder,
    checkReplyButtonEnabled,
    verifyCommentFormElements,
    createTestPostForDetail
} = require('./show-comment-form.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Comment Form
 *   As a user
 *   I want to see a comment input form on the post detail page
 *   So that I can write and submit comments on posts
 */

test.describe('Show Comment Form', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-069] Comment form is displayed on post detail page', async ({ page }) => {
        // Given the user is on the post detail page
        const result = await performShowCommentFormAction(page);

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see a comment textarea
        await expect(page.locator('textarea[placeholder="Share your thoughts..."]')).toBeVisible();

        // And the user should see a "Reply" button
        await expect(page.getByRole('button', { name: 'Reply' })).toBeVisible();

        // Round-trip verification: verify the form section heading is also visible
        await expect(page.locator('h2').filter({ hasText: 'Add a Comment' })).toBeVisible();
    });

    test('[UI-070] Comment textarea accepts text input', async ({ page }) => {
        // Given the user is on the post detail page
        const navResult = await navigateToPostDetailForComment(page);
        expect(navResult.success).toBe(true);

        // When the user types "This is my comment" in the comment textarea
        const typeResult = await typeInCommentTextarea(page, 'This is my comment');
        expect(typeResult.success).toBe(true);

        // Then the comment textarea should contain "This is my comment"
        const commentTextarea = page.locator('textarea[placeholder="Share your thoughts..."]');
        await expect(commentTextarea).toHaveValue('This is my comment');

        // Verify with the returned typed text as well
        expect(typeResult.typedText).toBe('This is my comment');
    });

    test('[UI-071] Comment form placeholder text is visible', async ({ page }) => {
        // Given the user is on the post detail page
        const navResult = await navigateToPostDetailForComment(page);
        expect(navResult.success).toBe(true);

        // Then the comment textarea should display placeholder text
        const placeholderResult = await getCommentTextareaPlaceholder(page);
        expect(placeholderResult.success).toBe(true);
        expect(placeholderResult.placeholder).toBe('Share your thoughts...');

        // Playwright assertion to verify placeholder attribute
        const commentTextarea = page.locator('textarea[placeholder="Share your thoughts..."]');
        await expect(commentTextarea).toHaveAttribute('placeholder', 'Share your thoughts...');
    });

    test('[UI-072] Reply button is visible and clickable', async ({ page }) => {
        // Given the user is on the post detail page
        const navResult = await navigateToPostDetailForComment(page);
        expect(navResult.success).toBe(true);

        // When the user types "Test comment" in the comment textarea
        const typeResult = await typeInCommentTextarea(page, 'Test comment');
        expect(typeResult.success).toBe(true);

        // Then the "Reply" button should be enabled
        const buttonResult = await checkReplyButtonEnabled(page);
        expect(buttonResult.success).toBe(true);
        expect(buttonResult.isEnabled).toBe(true);

        // Playwright assertion to verify button is visible and enabled
        const replyButton = page.getByRole('button', { name: 'Reply' });
        await expect(replyButton).toBeVisible();
        await expect(replyButton).toBeEnabled();
    });

    test('[UI-073] Comment form allows anonymous users to comment', async ({ page }) => {
        // Given the user is not logged in (default state - no auth actions taken)
        // And the user is on the post detail page
        const navResult = await navigateToPostDetailForComment(page);
        expect(navResult.success).toBe(true);

        // Then the user should see a comment textarea
        const formResult = await verifyCommentFormElements(page);
        expect(formResult.success).toBe(true);
        expect(formResult.elements.textareaVisible).toBe(true);

        // And the user should see a "Reply" button
        expect(formResult.elements.replyButtonVisible).toBe(true);

        // Playwright assertions
        await expect(page.locator('textarea[placeholder="Share your thoughts..."]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Reply' })).toBeVisible();

        // Round-trip verification: Verify we can actually type in the form (not blocked for anonymous users)
        const typeResult = await typeInCommentTextarea(page, 'Anonymous user comment');
        expect(typeResult.success).toBe(true);
        expect(typeResult.typedText).toBe('Anonymous user comment');
    });

});
