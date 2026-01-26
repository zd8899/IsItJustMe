// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performHashPasswordAction,
    isValidBcryptHash,
    getBcryptVersion
} = require('./hash-password.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Hash Password
 *
 *   As a system
 *   I want to hash passwords using bcrypt with salt
 *   So that user passwords are stored securely
 */

test.describe('Hash Password', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-070] Hash Password Success', async ({ page }) => {
        // Given a valid password "SecurePass123!"
        const password = 'SecurePass123!';

        // When the password hashing function is called
        const result = await performHashPasswordAction(page, {
            mode: 'api',
            password: password
        });

        // Then the function should return a bcrypt hash
        expect(result.statusCode).toBe(200);
        expect(result.body.success).toBe(true);
        expect(result.hash).toBeDefined();

        // And the hash should start with "$2b$" or "$2a$"
        const version = getBcryptVersion(result.hash);
        expect(version).toMatch(/^\$2[ab]\$$/);

        // And the hash should be 60 characters long
        expect(result.hash.length).toBe(60);

        // And the hash should not equal the original password
        expect(result.hash).not.toBe(password);
    });

    test('[API-071] Hash Password with Salt Uniqueness', async ({ page }) => {
        // Given a valid password "SamePassword123"
        const password = 'SamePassword123';

        // When the password hashing function is called twice
        const result1 = await performHashPasswordAction(page, {
            mode: 'api',
            password: password
        });

        const result2 = await performHashPasswordAction(page, {
            mode: 'api',
            password: password
        });

        // Unconditional assertions - both calls should succeed
        expect(result1.statusCode).toBe(200);
        expect(result2.statusCode).toBe(200);

        // Then each hash should be different due to unique salt
        expect(result1.hash).not.toBe(result2.hash);

        // And both hashes should be valid bcrypt hashes
        expect(isValidBcryptHash(result1.hash)).toBe(true);
        expect(isValidBcryptHash(result2.hash)).toBe(true);
    });

    test('[API-072] Hash Password Verification', async ({ page }) => {
        // Given a valid password "VerifyMe456!"
        const correctPassword = 'VerifyMe456!';
        const wrongPassword = 'WrongPass789';

        // When the password is hashed
        const hashResult = await performHashPasswordAction(page, {
            mode: 'api',
            password: correctPassword
        });

        expect(hashResult.statusCode).toBe(200);
        expect(hashResult.hash).toBeDefined();

        // Then the original password should verify against the hash
        const verifyCorrect = await performHashPasswordAction(page, {
            mode: 'api',
            password: correctPassword,
            action: 'verify',
            hash: hashResult.hash
        });

        expect(verifyCorrect.statusCode).toBe(200);
        expect(verifyCorrect.body.valid).toBe(true);

        // And an incorrect password "WrongPass789" should not verify
        const verifyWrong = await performHashPasswordAction(page, {
            mode: 'api',
            password: wrongPassword,
            action: 'verify',
            hash: hashResult.hash
        });

        expect(verifyWrong.statusCode).toBe(200);
        expect(verifyWrong.body.valid).toBe(false);
    });

    test('[API-073] Hash Password with Empty Input', async ({ page }) => {
        // Given an empty password ""
        const emptyPassword = '';

        // When the password hashing function is called
        const result = await performHashPasswordAction(page, {
            mode: 'api',
            password: emptyPassword
        });

        // Then the function should return an error
        expect(result.statusCode).toBe(400);

        // And the error should indicate "Password is required"
        expect(result.body.error).toBe('Password is required');
    });

    test('[API-074] Hash Password with Whitespace Only', async ({ page }) => {
        // Given a whitespace-only password "   "
        const whitespacePassword = '   ';

        // When the password hashing function is called
        const result = await performHashPasswordAction(page, {
            mode: 'api',
            password: whitespacePassword
        });

        // Then the function should return an error
        expect(result.statusCode).toBe(400);

        // And the error should indicate "Password is required"
        expect(result.body.error).toBe('Password is required');
    });

});
