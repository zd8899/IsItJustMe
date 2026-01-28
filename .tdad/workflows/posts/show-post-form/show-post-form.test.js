// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowPostFormAction,
    navigateToHomePage,
    getCategoryOptions,
    checkFormFieldsRequired
} = require('./show-post-form.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Post Form
 *
 *   As a user
 *   I want to see a post creation form on the home page
 *   So that I can share my frustrations with the community
 */

test.describe('Show Post Form', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-037] Post form is displayed on home page', async ({ page }) => {
        // Given the user is on the home page
        const result = await performShowPostFormAction(page);

        // Unconditional assertion - always assert
        expect(result.success).toBe(true);

        // Then the user should see the post creation form
        // And the user should see the label "Why is it so hard to..."
        await expect(page.getByText('Why is it so hard to...')).toBeVisible();

        // And the user should see an input field with placeholder "e.g., get a good night's sleep"
        await expect(page.getByPlaceholder("e.g., get a good night's sleep")).toBeVisible();

        // And the user should see the label "I am..."
        await expect(page.getByText('I am...')).toBeVisible();

        // And the user should see an input field with placeholder "e.g., a new parent"
        await expect(page.getByPlaceholder('e.g., a new parent')).toBeVisible();

        // And the user should see the label "Category"
        await expect(page.getByText('Category', { exact: true })).toBeVisible();

        // And the user should see a category dropdown
        await expect(page.getByTestId('category-select')).toBeVisible();

        // And the user should see the "Ask" button
        await expect(page.getByRole('button', { name: /ask/i })).toBeVisible();
    });

    test('[UI-038] Category dropdown displays all options', async ({ page }) => {
        // Given the user is on the home page
        const navResult = await navigateToHomePage(page);
        expect(navResult.success).toBe(true);

        // When the user clicks the category dropdown
        const categoryResult = await getCategoryOptions(page);
        expect(categoryResult.success).toBe(true);

        // Then the user should see the following category options
        const expectedCategories = [
            'Work',
            'Relationships',
            'Technology',
            'Health',
            'Parenting',
            'Finance',
            'Daily Life',
            'Social',
            'Other'
        ];

        // Verify all expected categories are present
        expect(categoryResult.categories).toEqual(expectedCategories);

        // Verify using Playwright assertions by checking each option in the dropdown
        const categoryDropdown = page.getByTestId('category-select');
        await expect(categoryDropdown).toBeVisible();

        for (const category of expectedCategories) {
            await expect(categoryDropdown.locator(`option:text-is("${category}")`)).toBeAttached();
        }
    });

    test('[UI-039] Form fields are required', async ({ page }) => {
        // Given the user is on the home page
        const navResult = await navigateToHomePage(page);
        expect(navResult.success).toBe(true);

        // Then the frustration input field should be required
        // And the identity input field should be required
        // And the category dropdown should be required
        const requiredResult = await checkFormFieldsRequired(page);
        expect(requiredResult.success).toBe(true);

        // Verify all fields have required attribute
        expect(requiredResult.requiredFields.frustrationInputRequired).toBe(true);
        expect(requiredResult.requiredFields.identityInputRequired).toBe(true);
        expect(requiredResult.requiredFields.categoryDropdownRequired).toBe(true);

        // Playwright assertions to verify required attributes
        const frustrationInput = page.getByPlaceholder("e.g., get a good night's sleep");
        const identityInput = page.getByPlaceholder('e.g., a new parent');
        const categoryDropdown = page.getByTestId('category-select');

        await expect(frustrationInput).toHaveAttribute('required', '');
        await expect(identityInput).toHaveAttribute('required', '');
        await expect(categoryDropdown).toHaveAttribute('required', '');
    });

});
