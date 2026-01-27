// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performGenerateAnonymousIdAction,
    getAnonymousId,
    isValidUuidV4
} = require('./generate-anonymous-id.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Generate Anonymous ID
 *   As an anonymous user
 *   I want to receive a unique anonymous ID
 *   So that I can create posts, comments, and votes without registration
 */

test.describe('Generate Anonymous Id', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-122] Generate Anonymous ID - Success', async ({ page }) => {
        // Execute: Send GET request to /api/posts/anonymous-id
        const result = await performGenerateAnonymousIdAction(page, { mode: 'api' });

        // Assert: Action succeeded
        expect(result.success).toBe(true);

        // Assert: Response status is 200
        expect(result.statusCode).toBe(200);

        // Assert: Response body contains anonymousId
        expect(result.body.anonymousId).toBeDefined();

        // Assert: anonymousId is a valid UUID v4 format
        const anonymousId = getAnonymousId(result);
        expect(isValidUuidV4(anonymousId)).toBe(true);
    });

    test('[API-123] Generate Anonymous ID - Unique Per Request', async ({ page }) => {
        // Execute: Send first GET request
        const result1 = await performGenerateAnonymousIdAction(page, { mode: 'api' });

        // Assert: First request succeeded
        expect(result1.success).toBe(true);
        expect(result1.statusCode).toBe(200);

        // Execute: Send second GET request
        const result2 = await performGenerateAnonymousIdAction(page, { mode: 'api' });

        // Assert: Second request succeeded
        expect(result2.success).toBe(true);
        expect(result2.statusCode).toBe(200);

        // Assert: Each response contains a different anonymousId
        const anonymousId1 = getAnonymousId(result1);
        const anonymousId2 = getAnonymousId(result2);

        expect(anonymousId1).toBeDefined();
        expect(anonymousId2).toBeDefined();
        expect(anonymousId1).not.toBe(anonymousId2);
    });

    test('[API-124] Generate Anonymous ID - Response Structure', async ({ page }) => {
        // Execute: Send GET request
        const result = await performGenerateAnonymousIdAction(page, { mode: 'api' });

        // Assert: Action succeeded
        expect(result.success).toBe(true);

        // Assert: Response status is 200
        expect(result.statusCode).toBe(200);

        // Assert: Content-type is application/json
        expect(result.contentType).toContain('application/json');

        // Assert: Response body only contains anonymousId field
        const bodyKeys = Object.keys(result.body);
        expect(bodyKeys).toEqual(['anonymousId']);
    });

});
