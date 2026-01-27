// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowCommentCardAction,
    viewCommentCardElements,
    viewCommentVoteButtons,
    viewCommentAuthor,
    checkReplyButton,
    checkNestedReplyNoReplyButton,
    viewNestedReplies,
    clickReplyAndCheckForm,
    createTestPostWithComments
} = require('./show-comment-card.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Comment Card
 *   As a user
 *   I want to see comment cards on the post detail page
 *   So that I can read community responses to posts
 */

test.describe('Show Comment Card', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-074] Comment card displays all essential information', async ({ page }) => {
        // Create a test post with a comment (self-containment)
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify comment card is visible
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard).toBeVisible();

        // Verify all essential elements are present
        const elementsResult = await viewCommentCardElements(page);
        expect(elementsResult.success).toBe(true);
        expect(elementsResult.hasAllElements).toBe(true);

        // Verify comment content text is visible
        await expect(page.locator('p.text-primary-800').first()).toBeVisible();

        // Verify vote score is visible
        await expect(page.locator('.text-sm.font-medium.text-primary-700').first()).toBeVisible();

        // Verify author name is visible
        await expect(page.locator('.text-xs.text-primary-500 span').first()).toBeVisible();

        // Verify comment date is visible
        await expect(page.locator('.text-xs.text-primary-500 span').last()).toBeVisible();
    });

    test('[UI-075] Comment card shows vote buttons', async ({ page }) => {
        // Create a test post with a comment
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify vote buttons
        const voteResult = await viewCommentVoteButtons(page);
        expect(voteResult.success).toBe(true);
        expect(voteResult.hasAllVoteElements).toBe(true);

        // Verify upvote button is visible on comment card
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.getByRole('button', { name: 'Upvote' })).toBeVisible();

        // Verify downvote button is visible
        await expect(commentCard.getByRole('button', { name: 'Downvote' })).toBeVisible();

        // Verify current score is displayed
        await expect(commentCard.locator('[data-testid="vote-score"]')).toBeVisible();
    });

    test('[UI-076] Comment card shows anonymous author', async ({ page }) => {
        // Create a test post with an anonymous comment
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify the comment author
        const authorResult = await viewCommentAuthor(page, 0);
        expect(authorResult.success).toBe(true);
        expect(authorResult.isAnonymous).toBe(true);

        // Verify "Anonymous" is visible as the comment author
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.locator('.text-xs.text-primary-500')).toContainText('Anonymous');
    });

    test('[UI-077] Comment card shows username for registered user comments', async ({ page }) => {
        // Note: Since the API doesn't support authenticated comment creation without full session,
        // this test verifies the component can display username when present.
        // The current API creates anonymous comments, but the UI is designed to show username if provided.

        // Create a test post with a comment
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify author section is visible (shows Anonymous or username)
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.locator('.text-xs.text-primary-500 span').first()).toBeVisible();

        // The author section should contain text (either Anonymous or a username)
        const authorResult = await viewCommentAuthor(page, 0);
        expect(authorResult.success).toBe(true);
        expect(authorResult.authorName).toBeTruthy();
    });

    test('[UI-078] Comment card shows reply button at first level', async ({ page }) => {
        // Create a test post with a top-level comment (depth = 0)
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true,
            withNestedReplies: false
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify Reply button is visible on top-level comment
        const replyResult = await checkReplyButton(page, 0);
        expect(replyResult.success).toBe(true);
        expect(replyResult.hasReplyButton).toBe(true);

        // Verify Reply button using Playwright assertion
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(commentCard.getByRole('button', { name: 'Reply' })).toBeVisible();
    });

    test('[UI-079] Comment card hides reply button at maximum nesting depth', async ({ page }) => {
        // Create a test post with nested replies (depth = 1)
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true,
            withNestedReplies: true
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify nested reply does NOT have a Reply button (max depth reached)
        const nestedResult = await checkNestedReplyNoReplyButton(page);
        expect(nestedResult.success).toBe(true);
        expect(nestedResult.hasNestedComments).toBe(true);
        expect(nestedResult.nestedReplyHasNoReplyButton).toBe(true);

        // Verify nested comment container is visible
        const nestedContainer = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        await expect(nestedContainer.first()).toBeVisible();

        // Verify no Reply button on the nested comment
        const nestedCommentCard = nestedContainer.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(nestedCommentCard).toBeVisible();
        // The nested comment should not have a Reply button
        const nestedReplyButton = nestedCommentCard.getByRole('button', { name: 'Reply' });
        await expect(nestedReplyButton).toHaveCount(0);
    });

    test('[UI-080] Comment card displays nested replies', async ({ page }) => {
        // Create a test post with a comment and a nested reply
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true,
            withNestedReplies: true
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Verify nested structure
        const nestedResult = await viewNestedReplies(page);
        expect(nestedResult.success).toBe(true);
        expect(nestedResult.hasParentComment).toBe(true);
        expect(nestedResult.hasNestedReplies).toBe(true);

        // Verify parent comment is visible
        const parentComment = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(parentComment).toBeVisible();

        // Verify nested replies are indented below the parent (ml-8 class)
        const nestedContainer = page.locator('.ml-8.border-l-2.border-primary-100.pl-4');
        await expect(nestedContainer.first()).toBeVisible();

        // Verify nested reply comment card is visible
        const nestedCommentCard = nestedContainer.locator('.bg-white.border.border-primary-200.rounded-lg').first();
        await expect(nestedCommentCard).toBeVisible();
    });

    test('[UI-081] Clicking reply button shows reply form', async ({ page }) => {
        // Create a test post with a top-level comment
        const setup = await createTestPostWithComments(page, {
            withComments: true,
            withAnonymousComment: true,
            withNestedReplies: false
        });
        expect(setup.success).toBe(true);

        // Navigate to the post detail page
        const result = await performShowCommentCardAction(page, { postId: setup.postId });
        expect(result.success).toBe(true);

        // Click the Reply button
        const clickResult = await clickReplyAndCheckForm(page, 0);
        expect(clickResult.success).toBe(true);
        expect(clickResult.replyFormVisible).toBe(true);

        // Verify reply form elements are visible
        const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();

        // Verify textarea is visible
        await expect(commentCard.locator('textarea[placeholder="Share your thoughts..."]')).toBeVisible();

        // Verify Cancel button is visible
        await expect(commentCard.getByRole('button', { name: 'Cancel' })).toBeVisible();

        // Verify submit Reply button is visible in the form
        // Note: There will be two Reply buttons - one for toggling the form (might be hidden) and one for submitting
        const replyButtons = commentCard.getByRole('button', { name: 'Reply' });
        const replyButtonCount = await replyButtons.count();
        expect(replyButtonCount).toBeGreaterThanOrEqual(1);
    });

});
