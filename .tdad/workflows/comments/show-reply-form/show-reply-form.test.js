// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowReplyFormAction,
    clickReplyButton,
    checkTextareaFocused,
    clickCancelButton,
    enterReplyText,
    clickPostReplyButton,
    isReplyFormVisible,
    getTextareaContent,
    checkLoadingState,
    checkNestedCommentNoReplyButton,
    createTestSetup,
    createTestPostWithComments
} = require('./show-reply-form.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Reply Form
 *   As a user
 *   I want to see a reply form under a comment
 *   So that I can respond to other users' comments
 */

test.describe('Show Reply Form', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-090] Reply form appears when clicking Reply button', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // When the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);

        // Then the user should see the reply form below the comment
        expect(clickResult.replyFormVisible).toBe(true);

        // And the user should see a text area for entering the reply
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.locator('textarea[placeholder="Share your thoughts..."]')).toBeVisible();

        // And the user should see a "Post Reply" button
        await expect(commentCard.getByRole('button', { name: 'Post Reply' })).toBeVisible();

        // And the user should see a "Cancel" button
        await expect(commentCard.getByRole('button', { name: 'Cancel' })).toBeVisible();
    });

    test('[UI-091] Reply form has focus on text area when opened', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // When the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // Then the reply text area should be focused
        const focusResult = await checkTextareaFocused(page, 0);
        expect(focusResult.success).toBe(true);
        expect(focusResult.isFocused).toBe(true);

        // Verify with Playwright assertion
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.locator('textarea[placeholder="Share your thoughts..."]')).toBeFocused();
    });

    test('[UI-092] Reply form closes when clicking Cancel', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // And the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // When the user clicks the "Cancel" button
        const cancelResult = await clickCancelButton(page, 0);
        expect(cancelResult.success).toBe(true);

        // Then the reply form should not be visible
        expect(cancelResult.formClosed).toBe(true);

        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.locator('textarea[placeholder="Share your thoughts..."]')).not.toBeVisible();

        // And the "Reply" button should be visible on the comment
        expect(cancelResult.replyButtonVisible).toBe(true);
        await expect(commentCard.getByRole('button', { name: 'Reply' })).toBeVisible();
    });

    test('[UI-093] Only one reply form is open at a time', async ({ page }) => {
        // Given multiple top-level comments exist on a post
        const setup = await createTestSetup(page, { withNestedReplies: false, commentCount: 2 });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // And the user clicks the "Reply" button on the first comment
        const firstClickResult = await clickReplyButton(page, 0);
        expect(firstClickResult.success).toBe(true);
        expect(firstClickResult.replyFormVisible).toBe(true);

        // When the user clicks the "Reply" button on the second comment
        const secondClickResult = await clickReplyButton(page, 1);
        expect(secondClickResult.success).toBe(true);

        // Then the reply form should be visible below the second comment
        const secondFormResult = await isReplyFormVisible(page, 1);
        expect(secondFormResult.success).toBe(true);
        expect(secondFormResult.isFormVisible).toBe(true);

        // And the reply form should not be visible below the first comment
        const firstFormResult = await isReplyFormVisible(page, 0);
        expect(firstFormResult.success).toBe(true);
        expect(firstFormResult.isFormVisible).toBe(false);

        // Playwright assertions
        const topLevelComments = page.locator('.space-y-4 > div:not(.ml-8) .bg-white.border.border-primary-200.rounded-lg');
        const firstComment = topLevelComments.nth(0);
        const secondComment = topLevelComments.nth(1);

        await expect(firstComment.locator('textarea[placeholder="Share your thoughts..."]')).not.toBeVisible();
        await expect(secondComment.locator('textarea[placeholder="Share your thoughts..."]')).toBeVisible();
    });

    test('[UI-094] Reply form shows validation error for empty content', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // And the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // When the user clicks the "Post Reply" button without entering text
        const submitResult = await clickPostReplyButton(page, 0);
        expect(submitResult.success).toBe(true);

        // Then the user should see an error message "Comment is required"
        await expect(page.getByText('Comment is required')).toBeVisible();
    });

    test('[UI-095] Reply form shows validation error for content too short', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // And the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // When the user enters "ab" in the reply text area
        const enterResult = await enterReplyText(page, 'ab', 0);
        expect(enterResult.success).toBe(true);

        // And the user clicks the "Post Reply" button
        const submitResult = await clickPostReplyButton(page, 0);
        expect(submitResult.success).toBe(true);

        // Then the user should see an error message "Comment must be at least 3 characters"
        await expect(page.getByText('Comment must be at least 3 characters')).toBeVisible();
    });

    test('[UI-096] Reply form shows loading state during submission', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // And the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // And the user enters "This is my reply to your comment" in the reply text area
        const enterResult = await enterReplyText(page, 'This is my reply to your comment', 0);
        expect(enterResult.success).toBe(true);

        // When the user clicks the "Post Reply" button
        // We need to check loading state during submission
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        const postReplyButton = commentCard.getByRole('button', { name: 'Post Reply' });

        // Click and immediately check for loading state
        await postReplyButton.click();

        // Then the "Post Reply" button should be disabled
        // Note: This may happen very quickly, so we check immediately after click
        const loadingResult = await checkLoadingState(page, 0);
        expect(loadingResult.success).toBe(true);
        // The button should be disabled during loading
        expect(loadingResult.isButtonDisabled).toBe(true);

        // And the user should see a loading indicator
        expect(loadingResult.hasLoadingIndicator).toBe(true);
    });

    test('[UI-097] Reply form closes after successful submission', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // And the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // And the user enters "This is my reply to your comment" in the reply text area
        const replyContent = `This is my reply to your comment ${Date.now()}`;
        const enterResult = await enterReplyText(page, replyContent, 0);
        expect(enterResult.success).toBe(true);

        // When the user clicks the "Post Reply" button
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        const postReplyButton = commentCard.getByRole('button', { name: 'Post Reply' });
        await postReplyButton.click();

        // And the reply is successfully submitted
        // Wait for the form to close (indicating success)
        await page.waitForLoadState('networkidle');

        // Then the reply form should not be visible
        await expect(commentCard.locator('textarea[placeholder="Share your thoughts..."]')).not.toBeVisible();

        // And the user should see the new reply below the parent comment
        const nestedContainer = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        await expect(nestedContainer.first()).toBeVisible();

        // Verify the reply content is visible
        await expect(page.getByText(replyContent)).toBeVisible();
    });

    test('[UI-098] Reply form clears content when reopened after cancel', async ({ page }) => {
        // Given a top-level comment exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: false });
        expect(setup.success).toBe(true);

        // And the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // And the user clicks the "Reply" button on the comment
        const clickResult = await clickReplyButton(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // And the user enters "Draft reply content" in the reply text area
        const draftContent = 'Draft reply content';
        const enterResult = await enterReplyText(page, draftContent, 0);
        expect(enterResult.success).toBe(true);

        // Verify the content was entered
        const contentBefore = await getTextareaContent(page, 0);
        expect(contentBefore.success).toBe(true);
        expect(contentBefore.content).toBe(draftContent);

        // When the user clicks the "Cancel" button
        const cancelResult = await clickCancelButton(page, 0);
        expect(cancelResult.success).toBe(true);
        expect(cancelResult.formClosed).toBe(true);

        // And the user clicks the "Reply" button on the same comment
        const reopenResult = await clickReplyButton(page, 0);
        expect(reopenResult.success).toBe(true);
        expect(reopenResult.replyFormVisible).toBe(true);

        // Then the reply text area should be empty
        const contentAfter = await getTextareaContent(page, 0);
        expect(contentAfter.success).toBe(true);
        expect(contentAfter.content).toBe('');

        // Playwright assertion
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.locator('textarea[placeholder="Share your thoughts..."]')).toHaveValue('');
    });

    test('[UI-099] Reply form is not available on nested replies', async ({ page }) => {
        // Given a second-level reply exists on a post
        const setup = await createTestSetup(page, { withNestedReplies: true });
        expect(setup.success).toBe(true);

        // When the user views the post detail page
        const result = await performShowReplyFormAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Then the user should not see the "Reply" button on the nested reply
        const nestedResult = await checkNestedCommentNoReplyButton(page);
        expect(nestedResult.success).toBe(true);
        expect(nestedResult.hasNestedComments).toBe(true);
        expect(nestedResult.nestedHasNoReplyButton).toBe(true);

        // Playwright assertion: verify nested comment exists but has no Reply button
        const nestedContainer = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        await expect(nestedContainer.first()).toBeVisible();

        const nestedCommentCard = nestedContainer.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(nestedCommentCard).toBeVisible();

        // Verify no Reply button on nested comment
        const nestedReplyButton = nestedCommentCard.getByRole('button', { name: 'Reply' });
        await expect(nestedReplyButton).toHaveCount(0);
    });

});
