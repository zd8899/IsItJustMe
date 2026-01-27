/**
 * Load Categories Dropdown Action
 *
 * Handles fetching categories via API and interacting with the category dropdown UI.
 * Supports both API testing (direct HTTP requests) and UI testing (browser interactions).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing, 'ui' for UI testing
 * @param {boolean} context.simulateSlowApi - If true, intercept API to simulate slow response
 * @param {boolean} context.simulateApiError - If true, intercept API to simulate error response
 * @param {string} context.selectCategory - Category name to select from dropdown
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, categories }
 */
async function performLoadCategoriesDropdownAction(page, context = {}) {
    try {
        const { mode, simulateSlowApi, simulateApiError, selectCategory } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            const response = await page.request.get('/api/categories');

            const status = response.status();
            let body = null;

            try {
                body = await response.json();
            } catch (e) {
                body = await response.text();
            }

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                categories: Array.isArray(body) ? body : [],
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Failed to fetch categories') : null
            };
        }

        // ==========================================
        // UI MODE - Browser interaction
        // ==========================================

        // Set up API interception if needed (before navigation)
        if (simulateSlowApi) {
            await page.route('**/api/categories', async (route) => {
                // Add delay to observe loading state
                await new Promise(resolve => setTimeout(resolve, 2000));
                await route.continue();
            });
        }

        if (simulateApiError) {
            await page.route('**/api/categories', async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Internal server error' })
                });
            });
        }

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // If simulating slow API, check for loading state
        if (simulateSlowApi) {
            // Look for loading indicator on category dropdown
            const loadingIndicator = page.locator('[data-testid="category-select"][aria-busy="true"], [data-testid="category-loading"], [aria-label*="loading" i]');
            const isLoading = await loadingIndicator.first().isVisible({ timeout: 1000 }).catch(() => false);

            // Clean up route
            await page.unroute('**/api/categories');

            return {
                success: true,
                loadingVisible: isLoading
            };
        }

        // If simulating API error, wait for error message
        if (simulateApiError) {
            // Wait for error message to appear
            const errorLocator = page.getByText('Failed to load categories');
            await errorLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);

            const errorVisible = await errorLocator.isVisible().catch(() => false);

            // Clean up route
            await page.unroute('**/api/categories');

            return {
                success: true,
                errorVisible: errorVisible,
                errorMessage: errorVisible ? 'Failed to load categories' : null
            };
        }

        // Get the category dropdown
        const categoryDropdown = page.locator('[data-testid="category-select"]');
        await categoryDropdown.waitFor({ state: 'visible', timeout: 5000 });

        // Wait for categories to load (wait for aria-busy to be false or not present)
        await page.waitForFunction(
            () => {
                const select = document.querySelector('[data-testid="category-select"]');
                return select && select.getAttribute('aria-busy') !== 'true';
            },
            { timeout: 5000 }
        );

        // If selecting a category
        if (selectCategory) {
            await categoryDropdown.click();
            await categoryDropdown.selectOption({ label: selectCategory });

            // Get the selected value text
            const selectedValue = await categoryDropdown.inputValue();
            const selectedOption = await categoryDropdown.locator(`option[value="${selectedValue}"]`).textContent();

            return {
                success: true,
                selectedCategory: selectedOption?.trim() || null,
                selectedValue: selectedValue
            };
        }

        // Get all options from dropdown
        const options = await categoryDropdown.locator('option').allTextContents();

        // Get placeholder (first option usually)
        const placeholder = options[0] || null;

        // Get category options (excluding placeholder)
        const categoryOptions = options.slice(1);

        return {
            success: true,
            dropdownVisible: true,
            placeholder: placeholder,
            categories: categoryOptions
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get categories from API result
 * @param {Object} apiResult - Result from performLoadCategoriesDropdownAction with mode: 'api'
 * @returns {Array} - Array of category objects
 */
function getCategoriesFromApiResult(apiResult) {
    return apiResult?.categories || apiResult?.body || [];
}

/**
 * Helper to check if a category name exists in the result
 * @param {Object} result - Result from performLoadCategoriesDropdownAction
 * @param {string} categoryName - Category name to check
 * @returns {boolean} - True if category exists
 */
function hasCategoryInResult(result, categoryName) {
    // For API result
    if (result.body && Array.isArray(result.body)) {
        return result.body.some(cat => cat.name === categoryName);
    }
    // For UI result
    if (result.categories && Array.isArray(result.categories)) {
        return result.categories.includes(categoryName);
    }
    return false;
}

/**
 * Helper to verify category object structure
 * @param {Object} category - Category object to verify
 * @returns {boolean} - True if category has required fields
 */
function isValidCategoryObject(category) {
    return (
        category &&
        typeof category === 'object' &&
        'id' in category &&
        'name' in category &&
        'slug' in category
    );
}

/**
 * List of all predefined categories
 */
const PREDEFINED_CATEGORIES = [
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

module.exports = {
    performLoadCategoriesDropdownAction,
    getCategoriesFromApiResult,
    hasCategoryInResult,
    isValidCategoryObject,
    PREDEFINED_CATEGORIES
};
