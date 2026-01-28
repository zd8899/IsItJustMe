const { test, expect } = require('../../../tdad-fixtures');
const {
  performShowCategoryFilterAction,
  checkDefaultOption,
  checkAllCategoriesAvailable,
  selectCategory,
  verifyDropdownClosesAfterSelection,
  CATEGORIES
} = require('./show-category-filter.action.js');

test.describe('Show Category Filter', () => {

  // ==========================================
  // UI TESTS
  // ==========================================

  test('[UI-141] Category filter dropdown is visible on feed page', async ({ page }) => {
    const result = await performShowCategoryFilterAction(page);

    // Assert action succeeded
    expect(result.success).toBe(true);

    // Verify the category filter is visible on the page
    const categoryFilter = page.getByRole('combobox');
    await expect(categoryFilter.first()).toBeVisible();

    // Verify "All Categories" is the default selected option
    await expect(categoryFilter.first()).toHaveValue('all');
  });

  test('[UI-142] Category filter shows all available categories', async ({ page }) => {
    const result = await checkAllCategoriesAvailable(page);

    // Assert action succeeded
    expect(result.success).toBe(true);

    // Verify all categories are available
    const categoryFilter = page.getByRole('combobox');
    await expect(categoryFilter.first()).toBeVisible();

    // Verify each category option exists in the dropdown
    const expectedCategories = [
      'All Categories',
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

    for (const categoryLabel of expectedCategories) {
      const option = categoryFilter.first().locator(`option:text("${categoryLabel}")`);
      await expect(option).toBeAttached();
    }
  });

  test('[UI-143] User can select a category from dropdown', async ({ page }) => {
    const result = await selectCategory(page, { categoryValue: 'technology' });

    // Assert action succeeded
    expect(result.success).toBe(true);

    // Verify the category filter shows "Technology" as selected
    const categoryFilter = page.getByRole('combobox');
    await expect(categoryFilter.first()).toBeVisible();
    await expect(categoryFilter.first()).toHaveValue('technology');
  });

  test('[UI-144] Category filter closes after selection', async ({ page }) => {
    const result = await verifyDropdownClosesAfterSelection(page, { categoryValue: 'work' });

    // Assert action succeeded
    expect(result.success).toBe(true);

    // Verify the dropdown is closed (filter still visible, selection applied)
    const categoryFilter = page.getByRole('combobox');
    await expect(categoryFilter.first()).toBeVisible();
    await expect(categoryFilter.first()).toHaveValue('work');

    // Native select dropdown automatically closes after selection
    // Verify the select element is not focused (indicating dropdown is closed)
    expect(result.dropdownClosed).toBe(true);
    expect(result.filterStillVisible).toBe(true);
  });

});
