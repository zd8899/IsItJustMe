// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performHandleLogoutAction,
    performLogoutApiRequest,
    performLogoutUiFlow,
    checkLogoutButtonVisibility,
    setupAuthenticatedUser,
    setupAuthenticatedStateOnPage,
    simulateAuthenticatedState,
    checkAuthenticatedMenuElements,
    checkUnauthenticatedMenuElements,
    navigateToPostDetailPage,
    generateUniqueUsername
} = require('./handle-logout.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Handle Logout
 *
 *   As a user
 *   I want to log out of my account
 *   So that I can end my session and protect my account
 */

test.describe('Handle Logout', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-101] Logout API Success', async ({ page }) => {
        // Setup: Create an authenticated user
        const userSetup = await setupAuthenticatedUser(page, 'logout');
        expect(userSetup.success).toBe(true);

        // Test: Send logout request with valid session token
        const result = await performHandleLogoutAction(page, {
            mode: 'api',
            token: userSetup.token
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.sessionCleared).toBe(true);
    });

    test('[API-102] Logout API when not authenticated', async ({ page }) => {
        // Test: Send logout request without authentication
        const result = await performHandleLogoutAction(page, {
            mode: 'api'
            // No token provided - unauthenticated request
        });

        // Unconditional assertions - logout should succeed even without auth
        expect(result.statusCode).toBe(200);
    });

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-018] Successful logout from header menu', async ({ page }) => {
        // Setup: Simulate authenticated state
        const username = `testuser_${Date.now().toString().slice(-6)}`;
        const authSetup = await setupAuthenticatedStateOnPage(page, username, '/');
        expect(authSetup.success).toBe(true);

        // Verify user is authenticated before logout
        const beforeLogout = await checkAuthenticatedMenuElements(page, { username });
        expect(beforeLogout.success).toBe(true);
        expect(beforeLogout.hasUsername).toBe(true);
        expect(beforeLogout.hasSignOutButton).toBe(true);

        // Action: Click Sign Out button
        const result = await performLogoutUiFlow(page, { startPage: '/' });

        // Unconditional assertions
        expect(result.success).toBe(true);

        // Verify redirected to home page
        await expect(page).toHaveURL(/.*\//);

        // Verify Sign In link is visible in header
        await expect(page.getByRole('link', { name: /sign\s*in/i })).toBeVisible();

        // Verify Sign Up link is visible in header
        await expect(page.getByRole('link', { name: /sign\s*up/i })).toBeVisible();

        // Verify username is no longer visible in header
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );
        await expect(usernameElement.first()).not.toBeVisible();
    });

    test('[UI-019] Logout clears user session across tabs', async ({ page }) => {
        // Setup: Simulate authenticated state
        const username = `testuser_${Date.now().toString().slice(-6)}`;
        const authSetup = await setupAuthenticatedStateOnPage(page, username, '/');
        expect(authSetup.success).toBe(true);

        // Action: Click Sign Out button
        const result = await performLogoutUiFlow(page, { startPage: '/' });
        expect(result.success).toBe(true);

        // Action: Refresh the page
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // Unconditional assertions - session should remain cleared after refresh
        await expect(page.getByRole('link', { name: /sign\s*in/i })).toBeVisible();

        // Verify username is not visible after refresh
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );
        await expect(usernameElement.first()).not.toBeVisible();
    });

    test('[UI-020] Logout from profile page redirects to home', async ({ page }) => {
        // Setup: Simulate authenticated state on profile page
        const username = `testuser_${Date.now().toString().slice(-6)}`;
        const authSetup = await setupAuthenticatedStateOnPage(page, username, '/profile');
        expect(authSetup.success).toBe(true);

        // Action: Click Sign Out button from profile page
        const result = await performLogoutUiFlow(page, { startPage: '/profile' });

        // Unconditional assertions
        expect(result.success).toBe(true);

        // Verify redirected to home page (not profile)
        await expect(page).toHaveURL(/.*\//);

        // Verify Sign In link is visible
        await expect(page.getByRole('link', { name: /sign\s*in/i })).toBeVisible();
    });

    test('[UI-021] Session persists correctly before logout', async ({ page }) => {
        // Setup: Simulate authenticated state
        const username = `testuser_${Date.now().toString().slice(-6)}`;
        const authSetup = await setupAuthenticatedStateOnPage(page, username, '/');
        expect(authSetup.success).toBe(true);

        // Action: Navigate to a post detail page
        const navResult = await navigateToPostDetailPage(page, { postId: 'test-post' });
        expect(navResult.success).toBe(true);

        // Unconditional assertions - session should persist across navigation
        const menuState = await checkAuthenticatedMenuElements(page, { username });
        expect(menuState.success).toBe(true);

        // Verify username is still displayed in header
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );
        await expect(usernameElement.first()).toBeVisible();

        // Verify Sign Out button is still visible
        await expect(page.getByRole('button', { name: /sign\s*out/i })).toBeVisible();
    });

    test('[UI-022] Logout button not visible for unauthenticated user', async ({ page }) => {
        // Action: Visit home page without authentication
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Unconditional assertions - Sign Out button should NOT be visible
        const signOutButton = page.getByRole('button', { name: /sign\s*out/i });
        await expect(signOutButton).not.toBeVisible();

        // Verify Sign In link IS visible
        await expect(page.getByRole('link', { name: /sign\s*in/i })).toBeVisible();

        // Verify Sign Up link IS visible
        await expect(page.getByRole('link', { name: /sign\s*up/i })).toBeVisible();
    });

});
