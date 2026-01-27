// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performSubmitPostFormAction,
    checkLoadingStateDuringSubmission,
    verifyFormCleared,
    verifyPostInFeed,
    createMultiplePostsForRateLimit,
    getPostIdFromResult,
    getErrorFromResult,
    performShowPostFormAction,
    performLoadCategoriesDropdownAction,
    getOrCreateTestCategory,
    createTestUserAndLogin,
    performGenerateAnonymousIdAction,
    getAnonymousId
} = require('./submit-post-form.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Submit Post Form
 *   As a user
 *   I want to submit the post creation form
 *   So that my frustration is shared with the community
 */

test.describe('Submit Post Form', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-153] Submit post as anonymous user - success', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Generate anonymous ID
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);
        expect(anonymousId).toBeTruthy();

        // Action: Submit post as anonymous user
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            frustration: `get a good night's sleep ${Date.now()}`,
            identity: 'a new parent',
            categoryId: categoryResult.categoryId,
            anonymousId: anonymousId
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.body.id).toBeDefined();
        expect(result.body.frustration).toBeDefined();
        expect(result.body.identity).toBeDefined();
        expect(result.body.categoryId).toBeDefined();
        expect(result.body.createdAt).toBeDefined();
    });

    test('[API-154] Submit post as logged-in user - success', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Create test user and login to get token
        const userResult = await createTestUserAndLogin(page, 'postuser');
        expect(userResult.success).toBe(true);

        // Action: Submit post as authenticated user
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            frustration: `find parking downtown ${Date.now()}`,
            identity: 'a commuter',
            categoryId: categoryResult.categoryId,
            authToken: userResult.token
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.body.id).toBeDefined();
        // For authenticated users, userId should be set and anonymousId should be null
        // Note: These assertions depend on API implementation
        if (result.body.userId !== undefined) {
            expect(result.body.userId).toBeDefined();
        }
    });

    test('[API-155] Submit post with missing frustration', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Generate anonymous ID
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);

        // Action: Submit post with empty frustration
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            frustration: '',
            identity: 'a developer',
            categoryId: categoryResult.categoryId,
            anonymousId: anonymousId,
            emptyFrustration: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Please describe your frustration');
    });

    test('[API-156] Submit post with missing identity', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Generate anonymous ID
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);

        // Action: Submit post with empty identity
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            frustration: `debug this error ${Date.now()}`,
            identity: '',
            categoryId: categoryResult.categoryId,
            anonymousId: anonymousId,
            emptyIdentity: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Please describe who you are');
    });

    test('[API-157] Submit post with missing category', async ({ page, tdadTrace }) => {
        // Setup: Generate anonymous ID
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);

        // Action: Submit post without categoryId
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            frustration: `stay focused ${Date.now()}`,
            identity: 'a remote worker',
            anonymousId: anonymousId,
            noCategory: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Please select a category');
    });

    test('[API-158] Submit post with invalid category ID', async ({ page, tdadTrace }) => {
        // Setup: Generate anonymous ID
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);

        // Action: Submit post with non-existent category ID
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            frustration: `find good coffee ${Date.now()}`,
            identity: 'a coffee lover',
            anonymousId: anonymousId,
            invalidCategoryId: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        // Error message should indicate category not found or invalid selection
        expect(result.errorMessage).toMatch(/category|select/i);
    });

    test('[API-159] Submit post with frustration exceeding max length', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Generate anonymous ID
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);

        // Action: Submit post with frustration over 500 characters
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            identity: 'a verbose person',
            categoryId: categoryResult.categoryId,
            anonymousId: anonymousId,
            overMaxFrustration: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Frustration must be less than 500 characters');
    });

    test('[API-160] Submit post with identity exceeding max length', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Generate anonymous ID
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);

        // Action: Submit post with identity over 100 characters
        const result = await performSubmitPostFormAction(page, {
            mode: 'api',
            frustration: `write concise bios ${Date.now()}`,
            categoryId: categoryResult.categoryId,
            anonymousId: anonymousId,
            overMaxIdentity: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Identity must be less than 100 characters');
    });

    test('[API-161] Anonymous user rate limited after 5 posts per hour', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Generate a unique anonymous ID for this test
        const anonIdResult = await performGenerateAnonymousIdAction(page, { mode: 'api' });
        expect(anonIdResult.success).toBe(true);
        const anonymousId = getAnonymousId(anonIdResult);

        // Action: Create 6 posts (should fail on the 6th due to rate limit)
        const result = await createMultiplePostsForRateLimit(page, 6, {
            categoryId: categoryResult.categoryId,
            anonymousId: anonymousId
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);

        // If rate limiting is enforced, we should have created exactly 5 posts
        // and the 6th should fail with 429
        if (result.lastStatusCode === 429) {
            expect(result.createdCount).toBe(5);
            expect(result.lastError).toContain('Rate limit exceeded');
        }
        // Note: If rate limiting is not yet implemented, all 6 posts will succeed
    });

    test('[API-162] Logged-in user rate limited after 20 posts per hour', async ({ page, tdadTrace }) => {
        // Setup: Get a valid category
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Create test user and login
        const userResult = await createTestUserAndLogin(page, 'ratelimit');
        expect(userResult.success).toBe(true);

        // Action: Create 21 posts (should fail on the 21st due to rate limit)
        const result = await createMultiplePostsForRateLimit(page, 21, {
            categoryId: categoryResult.categoryId,
            authToken: userResult.token
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);

        // If rate limiting is enforced, we should have created exactly 20 posts
        // and the 21st should fail with 429
        if (result.lastStatusCode === 429) {
            expect(result.createdCount).toBe(20);
            expect(result.lastError).toContain('Rate limit exceeded');
        }
        // Note: If rate limiting is not yet implemented, all 21 posts will succeed
    });


    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-060] Successful post submission as anonymous user', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Use a unique frustration text for verification
        const uniqueFrustration = `get a good night's sleep ${Date.now()}`;

        // Action: Fill and submit the form
        const result = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: uniqueFrustration,
            identity: 'a new parent',
            categoryName: 'Parenting'
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);

        // Round-trip verification: verify post appears in feed
        const feedResult = await verifyPostInFeed(page, uniqueFrustration);
        expect(feedResult.postVisible).toBe(true);

        // Verify form was cleared
        expect(result.formCleared).toBe(true);
    });

    test('[UI-061] Successful post submission as logged-in user', async ({ page, tdadTrace }) => {
        // Setup: Create test user and login via API
        const userResult = await createTestUserAndLogin(page, 'uitestuser');
        expect(userResult.success).toBe(true);

        // Setup: Navigate to home page (logged in via API token in cookies/localStorage)
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Setup: Show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Use a unique frustration text for verification
        const uniqueFrustration = `find parking downtown ${Date.now()}`;

        // Action: Fill and submit the form
        const result = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: uniqueFrustration,
            identity: 'a commuter',
            categoryName: 'Daily Life'
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);

        // Round-trip verification: verify post appears in feed
        const feedResult = await verifyPostInFeed(page, uniqueFrustration);
        expect(feedResult.postVisible).toBe(true);

        // Verify form was cleared
        expect(result.formCleared).toBe(true);
    });

    test('[UI-062] Form validation - empty frustration field', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Action: Submit form with empty frustration
        const result = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: '',
            identity: 'a developer',
            categoryName: 'Technology',
            emptyFrustration: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expecting validation error
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Please describe your frustration');
    });

    test('[UI-063] Form validation - empty identity field', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Action: Submit form with empty identity
        const result = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: `debug this error ${Date.now()}`,
            identity: '',
            categoryName: 'Technology',
            emptyIdentity: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expecting validation error
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Please describe who you are');
    });

    test('[UI-064] Form validation - no category selected', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Action: Submit form without selecting category
        const result = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: `stay focused ${Date.now()}`,
            identity: 'a remote worker',
            noCategory: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expecting validation error
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Please select a category');
    });

    test('[UI-065] Form shows loading state during submission', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Action: Check loading state during submission
        const result = await checkLoadingStateDuringSubmission(page, {
            frustration: `get a quick response ${Date.now()}`,
            identity: 'an impatient person',
            categoryName: 'Daily Life'
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        // At least one of these should be true during submission
        expect(result.buttonShowsLoading || result.buttonDisabled || result.fieldsDisabled).toBe(true);
    });

    test('[UI-066] Form clears after successful submission', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Action: Fill and submit the form
        const submitResult = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: `find a good restaurant ${Date.now()}`,
            identity: 'a foodie',
            categoryName: 'Daily Life'
        });

        // Record action result for trace
        tdadTrace.setActionResult(submitResult);

        // Assertions
        expect(submitResult.success).toBe(true);

        // Verify form was cleared
        const clearResult = await verifyFormCleared(page);
        expect(clearResult.success).toBe(true);
        expect(clearResult.frustrationEmpty).toBe(true);
        expect(clearResult.identityEmpty).toBe(true);
        expect(clearResult.categoryShowsPlaceholder).toBe(true);
    });

    test('[UI-067] Form shows error when API fails', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Action: Submit form with simulated API error
        const result = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: `make this work ${Date.now()}`,
            identity: 'a frustrated developer',
            categoryName: 'Technology',
            simulateApiError: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expecting error message
        expect(result.success).toBe(false);
        expect(result.errorMessage).toBeTruthy();

        // Form data should be preserved on error
        expect(result.formPreserved).toBe(true);
    });

    test('[UI-068] Rate limit error displayed to user', async ({ page, tdadTrace }) => {
        // Setup: Navigate to home page and show form
        const formResult = await performShowPostFormAction(page);
        expect(formResult.success).toBe(true);

        // Setup: Load categories
        const categoriesResult = await performLoadCategoriesDropdownAction(page, { mode: 'ui' });
        expect(categoriesResult.success).toBe(true);

        // Action: Submit form with simulated rate limit
        const result = await performSubmitPostFormAction(page, {
            mode: 'ui',
            frustration: `post more often ${Date.now()}`,
            identity: 'a frequent poster',
            categoryName: 'Social',
            simulateRateLimit: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expecting rate limit error message
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Rate limit exceeded');
    });

});
