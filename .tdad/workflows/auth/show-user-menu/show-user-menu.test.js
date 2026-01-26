// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowUserMenuAction,
    checkUnauthenticatedMenuElements,
    checkAuthenticatedMenuElements,
    clickSignInLink,
    clickSignUpLink,
    clickUsernameLink,
    clickSignOutButton,
    simulateAuthenticatedState,
    navigateToPostDetailPage
} = require('./show-user-menu.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show User Menu
 *
 *   As a user
 *   I want to see a user menu in the header
 *   So that I can access authentication options and my profile
 */

test.describe('Show User Menu', () => {

    // ==========================================
    // UI TESTS - Unauthenticated User Scenarios
    // ==========================================

    test('[UI-011] Display authentication options for unauthenticated user', async ({ page }) => {
        // Given the user is not logged in
        // When the user visits the home page
        const result = await checkUnauthenticatedMenuElements(page);

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see a "Sign In" link in the header
        await expect(page.getByRole('link', { name: /sign\s*in/i })).toBeVisible();

        // And the user should see a "Sign Up" link in the header
        await expect(page.getByRole('link', { name: /sign\s*up/i })).toBeVisible();
    });

    test('[UI-012] Sign In link navigates to login page', async ({ page }) => {
        // Given the user is not logged in
        // And the user is on the home page
        // When the user clicks the "Sign In" link in the header
        const result = await clickSignInLink(page);

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should be navigated to the "/auth/login" page
        await expect(page).toHaveURL(/.*\/auth\/login/);

        // Verify we're actually on the login page (not a 404)
        await expect(page.getByLabel(/username/i).or(page.getByLabel(/email/i))).toBeVisible();
    });

    test('[UI-013] Sign Up link navigates to registration page', async ({ page }) => {
        // Given the user is not logged in
        // And the user is on the home page
        // When the user clicks the "Sign Up" link in the header
        const result = await clickSignUpLink(page);

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should be navigated to the "/auth/register" page
        await expect(page).toHaveURL(/.*\/auth\/register/);

        // Verify we're actually on the registration page (not a 404)
        await expect(page.getByLabel(/username/i).or(page.getByRole('button', { name: /sign\s*up|register|create/i })).first()).toBeVisible();
    });

    // ==========================================
    // UI TESTS - Authenticated User Scenarios
    // ==========================================

    test('[UI-014] Display user menu for authenticated user', async ({ page }) => {
        const username = `testuser_${Date.now()}`;

        // Given the user is logged in with username
        const authResult = await simulateAuthenticatedState(page, { username });
        expect(authResult.success).toBe(true);

        // When the user visits the home page
        const result = await checkAuthenticatedMenuElements(page, { username });

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see username displayed in the header
        expect(result.hasUsername).toBe(true);

        // And the user should see a "Sign Out" button in the header
        expect(result.hasSignOutButton).toBe(true);

        // And the user should not see the "Sign In" link
        expect(result.hasSignInLink).toBe(false);

        // And the user should not see the "Sign Up" link
        expect(result.hasSignUpLink).toBe(false);

        // Playwright assertions for visibility
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );
        await expect(usernameElement.first()).toBeVisible();
        await expect(page.getByRole('button', { name: /sign\s*out/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /sign\s*in/i })).not.toBeVisible();
        await expect(page.getByRole('link', { name: /sign\s*up/i })).not.toBeVisible();
    });

    test('[UI-015] Username link navigates to profile page', async ({ page }) => {
        const username = `testuser_${Date.now()}`;

        // Given the user is logged in with username
        const authResult = await simulateAuthenticatedState(page, { username });
        expect(authResult.success).toBe(true);

        // And the user is on the home page
        // When the user clicks on their username in the header
        const result = await clickUsernameLink(page, { username });

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should be navigated to the "/profile" page
        await expect(page).toHaveURL(/.*\/profile/);

        // Verify we're actually on a profile page (not a 404)
        await expect(page.getByText(/profile/i).or(page.getByText(username)).first()).toBeVisible();
    });

    test('[UI-016] Sign Out button logs out the user', async ({ page }) => {
        const username = `testuser_${Date.now()}`;

        // Given the user is logged in with username
        const authResult = await simulateAuthenticatedState(page, { username });
        expect(authResult.success).toBe(true);

        // And the user is on the home page
        // When the user clicks the "Sign Out" button
        const signOutResult = await clickSignOutButton(page);

        // Unconditional assertion - always assert
        expect(signOutResult.success).toBe(true);

        // Then the user should see a "Sign In" link in the header
        await expect(page.getByRole('link', { name: /sign\s*in/i })).toBeVisible();

        // And the user should see a "Sign Up" link in the header
        await expect(page.getByRole('link', { name: /sign\s*up/i })).toBeVisible();

        // And the user should not see username in the header
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );
        await expect(usernameElement.first()).not.toBeVisible();
    });

    // ==========================================
    // UI TESTS - Edge Cases
    // ==========================================

    test('[UI-017] User menu persists across page navigation', async ({ page }) => {
        const username = `testuser_${Date.now()}`;

        // Given the user is logged in with username
        const authResult = await simulateAuthenticatedState(page, { username });
        expect(authResult.success).toBe(true);

        // And the user is on the home page - verify initial state
        const homeMenuCheck = await checkAuthenticatedMenuElements(page, { username });
        expect(homeMenuCheck.success).toBe(true);
        expect(homeMenuCheck.hasUsername).toBe(true);

        // When the user navigates to a post detail page
        const navResult = await navigateToPostDetailPage(page, { postId: 'test-post-id' });
        expect(navResult.success).toBe(true);

        // Then the user should still see username displayed in the header
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );
        await expect(usernameElement.first()).toBeVisible();

        // And the user should still see a "Sign Out" button in the header
        await expect(page.getByRole('button', { name: /sign\s*out/i })).toBeVisible();
    });

});
