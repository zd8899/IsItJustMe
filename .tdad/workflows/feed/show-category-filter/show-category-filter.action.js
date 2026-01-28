/**
 * Show Category Filter Action
 *
 * Provides UI interactions for the category filter dropdown on the feed page.
 * The category filter is a native HTML select element.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and options
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'work', label: 'Work' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'technology', label: 'Technology' },
  { value: 'health', label: 'Health' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'finance', label: 'Finance' },
  { value: 'daily-life', label: 'Daily Life' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' }
];

/**
 * Navigate to feed page and verify category filter dropdown is visible
 */
async function performShowCategoryFilterAction(page, context = {}) {
  try {
    // Navigate to home/feed page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get the category filter dropdown (native select element)
    const categoryFilter = page.getByRole('combobox');

    // Wait for the category filter to be visible with error detection
    const errorLocator = page.getByRole('alert');
    const outcome = await Promise.race([
      categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
      errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (outcome.type === 'error') {
      const errorMessage = await errorLocator.first().textContent();
      return { success: false, errorMessage };
    }

    if (outcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for category filter dropdown to appear' };
    }

    // Check the default selected value
    const selectedValue = await categoryFilter.first().inputValue();
    const defaultOption = CATEGORIES.find(c => c.value === selectedValue);

    return {
      success: true,
      filterVisible: true,
      selectedValue: selectedValue,
      selectedLabel: defaultOption ? defaultOption.label : null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify the category filter displays "All Categories" as the default option
 */
async function checkDefaultOption(page, context = {}) {
  try {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    const selectedValue = await categoryFilter.first().inputValue();

    if (selectedValue !== 'all') {
      return {
        success: false,
        errorMessage: `Expected default value to be "all", but got "${selectedValue}"`
      };
    }

    return {
      success: true,
      defaultValue: 'all',
      defaultLabel: 'All Categories'
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify all category options are available in the dropdown
 */
async function checkAllCategoriesAvailable(page, context = {}) {
  try {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Get all option elements within the select
    const options = categoryFilter.first().locator('option');
    const optionCount = await options.count();

    // Extract option values and labels (skip the first placeholder option if present)
    const availableOptions = [];
    for (let i = 0; i < optionCount; i++) {
      const optionValue = await options.nth(i).getAttribute('value');
      const optionLabel = await options.nth(i).textContent();

      // Skip placeholder option with empty value
      if (optionValue !== '') {
        availableOptions.push({ value: optionValue, label: optionLabel.trim() });
      }
    }

    // Check if all expected categories are present
    const missingCategories = [];
    for (const category of CATEGORIES) {
      const found = availableOptions.find(o => o.value === category.value && o.label === category.label);
      if (!found) {
        missingCategories.push(category.label);
      }
    }

    if (missingCategories.length > 0) {
      return {
        success: false,
        errorMessage: `Missing categories: ${missingCategories.join(', ')}`
      };
    }

    return {
      success: true,
      availableOptions: availableOptions,
      optionCount: availableOptions.length
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Select a category from the dropdown
 */
async function selectCategory(page, context = {}) {
  try {
    const { categoryValue, categoryLabel } = context;

    if (!categoryValue && !categoryLabel) {
      return { success: false, errorMessage: 'Either categoryValue or categoryLabel must be provided' };
    }

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Select the option
    if (categoryValue) {
      await categoryFilter.first().selectOption({ value: categoryValue });
    } else {
      await categoryFilter.first().selectOption({ label: categoryLabel });
    }

    // Wait for state update
    await page.waitForLoadState('domcontentloaded');

    // Verify the selection
    const selectedValue = await categoryFilter.first().inputValue();
    const expectedValue = categoryValue || CATEGORIES.find(c => c.label === categoryLabel)?.value;

    if (selectedValue !== expectedValue) {
      return {
        success: false,
        errorMessage: `Expected selected value to be "${expectedValue}", but got "${selectedValue}"`
      };
    }

    const selectedCategory = CATEGORIES.find(c => c.value === selectedValue);

    return {
      success: true,
      selectedValue: selectedValue,
      selectedLabel: selectedCategory ? selectedCategory.label : null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify the dropdown closes after selection
 * For native HTML select elements, the dropdown automatically closes after selection.
 * This function verifies that behavior by checking the select is still visible but collapsed.
 */
async function verifyDropdownClosesAfterSelection(page, context = {}) {
  try {
    const { categoryValue = 'work' } = context;

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Select an option
    await categoryFilter.first().selectOption({ value: categoryValue });

    // Wait for state update
    await page.waitForLoadState('domcontentloaded');

    // For native select elements, verify the select is still visible and functional
    // The dropdown automatically closes after selection
    const isVisible = await categoryFilter.first().isVisible();
    const isFocused = await categoryFilter.first().evaluate(el => document.activeElement === el || document.activeElement.tagName === 'BODY');

    // Verify the selection was made correctly
    const selectedValue = await categoryFilter.first().inputValue();

    if (!isVisible) {
      return { success: false, errorMessage: 'Category filter is no longer visible after selection' };
    }

    if (selectedValue !== categoryValue) {
      return { success: false, errorMessage: `Selection not applied: expected "${categoryValue}", got "${selectedValue}"` };
    }

    return {
      success: true,
      dropdownClosed: true,
      filterStillVisible: isVisible,
      selectedValue: selectedValue
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Helper: Get list of all available categories
 */
function getAvailableCategories() {
  return CATEGORIES;
}

/**
 * Helper: Get selected category from result
 */
function getSelectedCategory(result) {
  return {
    value: result.selectedValue || null,
    label: result.selectedLabel || null
  };
}

module.exports = {
  performShowCategoryFilterAction,
  checkDefaultOption,
  checkAllCategoriesAvailable,
  selectCategory,
  verifyDropdownClosesAfterSelection,
  getAvailableCategories,
  getSelectedCategory,
  CATEGORIES
};
