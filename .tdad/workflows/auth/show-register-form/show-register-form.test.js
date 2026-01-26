// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowRegisterFormAction,
    navigateToRegisterPage,
    fillPasswordField,
    checkLoginLinkExists
} = require('./show-register-form.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Register Form
 *
 *   As a user
 *   I want to see a registration form
 *   So that I can create an account on the platform
 */

test.describe('Show Register Form', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-001] Display registration form with all required fields', async ({ page }) => {
        // Given the user is on the home page
        // When the user clicks the "Sign Up" link in the header
        const result = await performShowRegisterFormAction(page, { navigationType: 'header' });

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see the registration form
        // And the user should see a "Username" input field
        await expect(page.getByLabel(/username/i)).toBeVisible();

        // And the user should see a "Password" input field
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // And the user should see a "Create Account" button
        await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('[UI-002] Navigate directly to registration page', async ({ page }) => {
        // Given the user navigates to the "/auth/register" page
        const result = await performShowRegisterFormAction(page, { navigationType: 'direct' });

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see the registration form
        await expect(page).toHaveURL(/.*\/auth\/register/);

        // And the user should see a "Username" input field
        await expect(page.getByLabel(/username/i)).toBeVisible();

        // And the user should see a "Password" input field
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // And the user should see a "Create Account" button
        await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('[UI-003] Form fields are empty by default', async ({ page }) => {
        // Given the user is on the registration page
        const navResult = await navigateToRegisterPage(page);
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

    test('[UI-004] Password field masks input', async ({ page }) => {
        // Given the user is on the registration page
        const navResult = await navigateToRegisterPage(page);
        expect(navResult.success).toBe(true);

        // When the user enters "secret123" in the "Password" field
        const fillResult = await fillPasswordField(page, 'secret123');
        expect(fillResult.success).toBe(true);

        // Then the password input should be masked (type="password")
        const passwordField = page.getByLabel(/password/i);
        await expect(passwordField).toHaveAttribute('type', 'password');
    });

    test('[UI-005] Display link to login page for existing users', async ({ page }) => {
        // Given the user is on the registration page
        const navResult = await navigateToRegisterPage(page);
        expect(navResult.success).toBe(true);

        // Then the user should see a link to the login page
        const linkResult = await checkLoginLinkExists(page);
        expect(linkResult.success).toBe(true);
        expect(linkResult.hasLoginLink).toBe(true);

        // Verify the link is visible using Playwright assertion
        await expect(page.getByRole('link', { name: /log\s*in|sign\s*in/i }).first()).toBeVisible();
    });

});
