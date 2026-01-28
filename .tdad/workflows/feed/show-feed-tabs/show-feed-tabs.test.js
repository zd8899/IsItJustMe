// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
  performShowFeedTabsAction,
  checkHotTabIsActive,
  switchToNewTab,
  switchToHotTab
} = require('./show-feed-tabs.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Feed Tabs
 *   As a user
 *   I want to see Hot and New tab buttons on the feed
 *   So that I can switch between different feed sorting options
 */

test.describe('Show Feed Tabs', () => {

  // ==========================================
  // UI TESTS
  // ==========================================

  test('[UI-137] Display feed tabs on home page', async ({ page }) => {
    // Given the user is on the home page
    // Then the user should see a "Hot" tab button
    // And the user should see a "New" tab button
    const result = await performShowFeedTabsAction(page);

    // Unconditional assertion - always assert, never wrap in if(result.success)
    expect(result.success).toBe(true);

    // Verify tabs are actually visible on the page (not just action result)
    await expect(page.getByRole('button', { name: 'Hot' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
  });

  test('[UI-138] Hot tab is active by default', async ({ page }) => {
    // Given the user is on the home page
    // Then the "Hot" tab should be displayed as active
    // And the "New" tab should be displayed as inactive
    const result = await checkHotTabIsActive(page);

    // Unconditional assertion
    expect(result.success).toBe(true);

    // Verify the Hot tab has active styling (primary variant = bg-primary-900)
    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    await expect(hotTab).toBeVisible();
    await expect(newTab).toBeVisible();

    // Verify Hot tab has primary styling
    await expect(hotTab).toHaveClass(/bg-primary-900/);

    // Verify New tab does NOT have primary styling (is ghost/inactive)
    await expect(newTab).not.toHaveClass(/bg-primary-900/);
  });

  test('[UI-139] Switch to New tab', async ({ page }) => {
    // Given the user is on the home page
    // And the "Hot" tab is active
    // When the user clicks the "New" tab button
    // Then the "New" tab should be displayed as active
    // And the "Hot" tab should be displayed as inactive
    const result = await switchToNewTab(page);

    // Unconditional assertion
    expect(result.success).toBe(true);

    // Verify the New tab is now active
    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    await expect(newTab).toBeVisible();
    await expect(hotTab).toBeVisible();

    // Verify New tab has primary styling (active)
    await expect(newTab).toHaveClass(/bg-primary-900/);

    // Verify Hot tab does NOT have primary styling (inactive)
    await expect(hotTab).not.toHaveClass(/bg-primary-900/);
  });

  test('[UI-140] Switch back to Hot tab', async ({ page }) => {
    // Given the user is on the home page
    // And the "New" tab is active
    // When the user clicks the "Hot" tab button
    // Then the "Hot" tab should be displayed as active
    // And the "New" tab should be displayed as inactive
    const result = await switchToHotTab(page);

    // Unconditional assertion
    expect(result.success).toBe(true);

    // Verify the Hot tab is now active again
    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    await expect(hotTab).toBeVisible();
    await expect(newTab).toBeVisible();

    // Verify Hot tab has primary styling (active)
    await expect(hotTab).toHaveClass(/bg-primary-900/);

    // Verify New tab does NOT have primary styling (inactive)
    await expect(newTab).not.toHaveClass(/bg-primary-900/);
  });

});
