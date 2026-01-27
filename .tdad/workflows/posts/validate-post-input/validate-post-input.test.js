// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performValidatePostInputAction,
    getOrCreateTestCategory,
    getPostIdFromResult,
    getErrorFromResult
} = require('./validate-post-input.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Validate Post Input
 *   As a user
 *   I want the system to validate my post input
 *   So that I can only submit properly formatted posts
 *
 * NOTE: Validation uses Zod schema for frustration and identity fields
 */

test.describe('Validate Post Input', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-116] Post validation success with valid input', async ({ page }) => {
        // Setup: Get or create a valid category
        const categorySetup = await getOrCreateTestCategory(page);
        expect(categorySetup.success).toBe(true);

        // Execute: Send POST request with valid frustration and identity
        const result = await performValidatePostInputAction(page, {
            mode: 'api',
            frustration: `Valid frustration text ${Date.now()}`,
            identity: `Valid user identity ${Date.now()}`,
            categoryId: categorySetup.categoryId
        });

        // Assert: Response status should be 200
        expect(result.statusCode).toBe(200);

        // Assert: Response body should contain id, frustration, and identity
        expect(result.body.id).toBeDefined();
        expect(result.body.frustration).toBeDefined();
        expect(result.body.identity).toBeDefined();
    });

    test('[API-117] Post validation failure - empty frustration', async ({ page }) => {
        // Setup: Get or create a valid category
        const categorySetup = await getOrCreateTestCategory(page);
        expect(categorySetup.success).toBe(true);

        // Execute: Send POST request with empty frustration
        const result = await performValidatePostInputAction(page, {
            mode: 'api',
            emptyFrustration: true,
            categoryId: categorySetup.categoryId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Response error should be "Please describe your frustration"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Please describe your frustration');
    });

    test('[API-118] Post validation failure - empty identity', async ({ page }) => {
        // Setup: Get or create a valid category
        const categorySetup = await getOrCreateTestCategory(page);
        expect(categorySetup.success).toBe(true);

        // Execute: Send POST request with empty identity
        const result = await performValidatePostInputAction(page, {
            mode: 'api',
            emptyIdentity: true,
            categoryId: categorySetup.categoryId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Response error should be "Please describe who you are"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Please describe who you are');
    });

    test('[API-119] Post validation failure - frustration too long', async ({ page }) => {
        // Setup: Get or create a valid category
        const categorySetup = await getOrCreateTestCategory(page);
        expect(categorySetup.success).toBe(true);

        // Execute: Send POST request with frustration exceeding 500 characters
        const result = await performValidatePostInputAction(page, {
            mode: 'api',
            longFrustration: true,
            categoryId: categorySetup.categoryId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Response error should be "Frustration must be less than 500 characters"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Frustration must be less than 500 characters');
    });

    test('[API-120] Post validation failure - identity too long', async ({ page }) => {
        // Setup: Get or create a valid category
        const categorySetup = await getOrCreateTestCategory(page);
        expect(categorySetup.success).toBe(true);

        // Execute: Send POST request with identity exceeding 100 characters
        const result = await performValidatePostInputAction(page, {
            mode: 'api',
            longIdentity: true,
            categoryId: categorySetup.categoryId
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Response error should be "Identity must be less than 100 characters"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Identity must be less than 100 characters');
    });

    test('[API-121] Post validation failure - missing category', async ({ page }) => {
        // Execute: Send POST request with valid frustration and identity but missing category
        const result = await performValidatePostInputAction(page, {
            mode: 'api',
            missingCategory: true
        });

        // Assert: Response status should be 400
        expect(result.statusCode).toBe(400);

        // Assert: Response error should be "Please select a category"
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBe('Please select a category');
    });

});
