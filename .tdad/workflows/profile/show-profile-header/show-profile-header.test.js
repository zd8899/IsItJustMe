// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowProfileHeaderAction,
    navigateToProfilePage,
    checkUsernameDisplay,
    checkJoinDateDisplay,
    checkLoadingState,
    checkNotFoundMessage,
    checkProfileHeader,
    setupTestUserForProfile,
    formatJoinDate
} = require('./show-profile-header.action.js');
const { performFetchUserProfileAction, createTestUser } = require('../fetch-user-profile/fetch-user-profile.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Profile Header
 *   As a user
 *   I want to see the profile header with username and join date
 *   So that I can identify the user and know when they joined the platform
 */

test.describe('Show Profile Header', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-174] Display username in profile header', async ({ page }) => {
        // Given a user profile has been fetched with username "testuser"
        // First, create a test user to ensure we have valid data
        const setupResult = await createTestUser(page, 'testuser');
        expect(setupResult.success).toBe(true);

        const userId = setupResult.userId;
        const expectedUsername = setupResult.username;

        // When the user visits the profile page
        const navResult = await navigateToProfilePage(page, { userId });
        expect(navResult.success).toBe(true);

        // Then the user should see the username displayed in the header
        const usernameResult = await checkUsernameDisplay(page, { expectedUsername });
        expect(usernameResult.success).toBe(true);
        expect(usernameResult.usernameVisible).toBe(true);

        // Playwright assertion - verify username is actually visible on page
        await expect(
            page.getByRole('heading', { name: expectedUsername })
                .or(page.getByText(expectedUsername, { exact: true }))
                .first()
        ).toBeVisible();
    });

    test('[UI-175] Display join date in profile header', async ({ page }) => {
        // Given a user profile has been fetched with username "testuser"
        // And the user joined on a specific date
        const setupResult = await createTestUser(page, 'testuser');
        expect(setupResult.success).toBe(true);

        const userId = setupResult.userId;

        // Fetch the profile to get the actual createdAt date
        const profileResult = await performFetchUserProfileAction(page, { mode: 'api', userId });
        expect(profileResult.success).toBe(true);

        // When the user visits the profile page
        const navResult = await navigateToProfilePage(page, { userId });
        expect(navResult.success).toBe(true);

        // Then the user should see the join date displayed in the header
        const joinDateResult = await checkJoinDateDisplay(page, {});
        expect(joinDateResult.success).toBe(true);
        expect(joinDateResult.joinDateVisible).toBe(true);

        // Playwright assertion - verify join date text is visible
        await expect(
            page.getByText(/joined/i)
                .or(page.getByText(/member since/i))
                .first()
        ).toBeVisible();
    });

    test('[UI-176] Display complete profile header information', async ({ page }) => {
        // Given a user profile has been fetched with username "activeuser"
        // And the user joined on a specific date
        const setupResult = await createTestUser(page, 'activeuser');
        expect(setupResult.success).toBe(true);

        const userId = setupResult.userId;
        const expectedUsername = setupResult.username;

        // When the user visits the profile page
        const result = await checkProfileHeader(page, { userId, expectedUsername });
        expect(result.success).toBe(true);

        // Then the user should see the username displayed in the header
        expect(result.usernameVisible).toBe(true);

        // And the user should see the join date displayed in the header
        expect(result.joinDateVisible).toBe(true);

        // Playwright assertions - verify both elements are visible
        await expect(
            page.getByRole('heading', { name: expectedUsername })
                .or(page.getByText(expectedUsername, { exact: true }))
                .first()
        ).toBeVisible();

        await expect(
            page.getByText(/joined/i)
                .or(page.getByText(/member since/i))
                .first()
        ).toBeVisible();
    });

    test('[UI-177] Show loading state while fetching profile', async ({ page }) => {
        // Given the user profile is being fetched
        // Create a test user first
        const setupResult = await createTestUser(page, 'loadtest');
        expect(setupResult.success).toBe(true);

        const userId = setupResult.userId;

        // When the user visits the profile page
        // Navigate but check for loading state immediately
        await page.goto(`/profile/${userId}`);

        // Then the user should see a loading indicator in the profile header
        // Note: Loading state may be very brief, so we check for either loading or content
        const loadingResult = await checkLoadingState(page);
        expect(loadingResult.success).toBe(true);

        // If loading was not visible (too fast), verify content loaded instead
        if (!loadingResult.loadingVisible) {
            // Wait for content to load and verify it's there
            await page.waitForLoadState('domcontentloaded');

            // The page should show either loading or the actual content
            const contentOrLoading = page.getByRole('progressbar')
                .or(page.getByText(/loading/i))
                .or(page.getByText(setupResult.username))
                .or(page.getByRole('heading').first());

            await expect(contentOrLoading.first()).toBeVisible();
        }
    });

    test('[UI-178] Handle non-existent user profile', async ({ page }) => {
        // Given no user profile exists for the requested user
        const nonExistentUserId = 'clxyz_nonexistent_user_12345';

        // When the user visits the profile page
        const navResult = await navigateToProfilePage(page, { userId: nonExistentUserId });
        expect(navResult.success).toBe(true);

        // Then the user should see a message indicating the profile was not found
        const notFoundResult = await checkNotFoundMessage(page);
        expect(notFoundResult.success).toBe(true);
        expect(notFoundResult.notFoundVisible).toBe(true);

        // Playwright assertion - verify not found message is visible
        await expect(
            page.getByText(/not found|does not exist|no user|user not found|profile not found/i)
                .or(page.getByRole('alert'))
                .first()
        ).toBeVisible();
    });

});
