// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowLoginFormAction,
    navigateToLoginPage,
    fillLoginPasswordField,
    checkRegisterLinkExists
} = require('./show-login-form.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Login Form
 *
 *   As a user
 *   I want to see a login form
 *   So that I can access my existing account on the platform
 */

test.describe('Show Login Form', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-006] Display login form with all required fields', async ({ page }) => {
        // Given the user is on the home page
        // When the user clicks the "Log In" link in the header
        const result = await performShowLoginFormAction(page, { navigationType: 'header' });

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see the login form
        // And the user should see a "Username" input field
        await expect(page.getByLabel(/username/i)).toBeVisible();

        // And the user should see a "Password" input field
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // And the user should see a "Log In" / "Sign In" button
        await expect(page.getByRole('button', { name: /sign\s*in|log\s*in/i })).toBeVisible();
    });

    test('[UI-007] Navigate directly to login page', async ({ page }) => {
        // Given the user navigates to the "/auth/login" page
        const result = await performShowLoginFormAction(page, { navigationType: 'direct' });

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see the login form
        await expect(page).toHaveURL(/.*\/auth\/login/);

        // And the user should see a "Username" input field
        await expect(page.getByLabel(/username/i)).toBeVisible();

        // And the user should see a "Password" input field
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // And the user should see a "Log In" / "Sign In" button
        await expect(page.getByRole('button', { name: /sign\s*in|log\s*in/i })).toBeVisible();
    });

    test('[UI-008] Form fields are empty by default', async ({ page }) => {
        // Given the user is on the login page
        const navResult = await navigateToLoginPage(page);
        expect(navResult.success).toBe(true);

        // Then the "Username" field should be empty
        const usernameField = page.getByLabel(/username/i);
        await expect(usernameField).toBeVisible();
        await expect(usernameField).toHaveValue('');

        // And the "Password" field should be empty
        const passwordField = page.getByLabel(/password/i);
        await expect(passwordField).toBeVisible();
        await expect(passwordField).toHaveValue('');
    });

    test('[UI-009] Password field masks input', async ({ page }) => {
        // Given the user is on the login page
        const navResult = await navigateToLoginPage(page);
        expect(navResult.success).toBe(true);

        // When the user enters "secret123" in the "Password" field
        const fillResult = await fillLoginPasswordField(page, 'secret123');
        expect(fillResult.success).toBe(true);

        // Then the password input should be masked (type="password")
        const passwordField = page.getByLabel(/password/i);
        await expect(passwordField).toHaveAttribute('type', 'password');
    });

    test('[UI-010] Display link to registration page for new users', async ({ page }) => {
        // Given the user is on the login page
        const navResult = await navigateToLoginPage(page);
        expect(navResult.success).toBe(true);

        // Then the user should see a link to the registration page
        const linkResult = await checkRegisterLinkExists(page);
        expect(linkResult.success).toBe(true);
        expect(linkResult.hasRegisterLink).toBe(true);

        // Verify the link is visible using Playwright assertion
        await expect(page.getByRole('link', { name: /sign\s*up|register|create/i }).first()).toBeVisible();
    });

});
