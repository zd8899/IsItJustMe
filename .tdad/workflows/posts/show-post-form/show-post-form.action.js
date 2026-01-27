/**
 * Show Post Form Action
 *
 * Navigates to the home page and verifies the post creation form is displayed
 * with all required elements.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @returns {Promise<Object>} - Returns { success, errorMessage, formElements }
 */
async function performShowPostFormAction(page, context = {}) {
    try {
        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for the page to fully stabilize (helps with parallel test execution)
        await page.waitForLoadState('networkidle').catch(() => {});

        // Look for the frustration label directly - this is the expected happy path
        const frustrationLabel = page.getByText('Why is it so hard to...');

        // Try to wait for the form label to be visible
        try {
            await frustrationLabel.waitFor({ state: 'visible', timeout: 10000 });
        } catch (e) {
            // If form label not found, check if there's an error
            const errorLocator = page.getByRole('alert');
            const errorVisible = await errorLocator.first().isVisible().catch(() => false);
            if (errorVisible) {
                const msg = await errorLocator.first().textContent();
                return { success: false, errorMessage: msg };
            }
            return { success: false, errorMessage: 'Post form not found on home page' };
        }

        // Verify all form elements are visible
        const identityLabel = page.getByText('I am...');
        const categoryLabel = page.getByText('Category');
        const frustrationInput = page.getByPlaceholder("e.g., get a good night's sleep");
        const identityInput = page.getByPlaceholder('e.g., a new parent');
        const categoryDropdown = page.getByTestId('category-select');
        const askButton = page.getByRole('button', { name: /ask/i });

        const identityLabelVisible = await identityLabel.isVisible().catch(() => false);
        const categoryLabelVisible = await categoryLabel.isVisible().catch(() => false);
        const frustrationInputVisible = await frustrationInput.isVisible().catch(() => false);
        const identityInputVisible = await identityInput.isVisible().catch(() => false);
        const categoryDropdownVisible = await categoryDropdown.isVisible().catch(() => false);
        const askButtonVisible = await askButton.isVisible().catch(() => false);

        if (!identityLabelVisible) {
            return { success: false, errorMessage: 'Identity label "I am..." not visible' };
        }
        if (!categoryLabelVisible) {
            return { success: false, errorMessage: 'Category label not visible' };
        }
        if (!frustrationInputVisible) {
            return { success: false, errorMessage: 'Frustration input field not visible' };
        }
        if (!identityInputVisible) {
            return { success: false, errorMessage: 'Identity input field not visible' };
        }
        if (!categoryDropdownVisible) {
            return { success: false, errorMessage: 'Category dropdown not visible' };
        }
        if (!askButtonVisible) {
            return { success: false, errorMessage: 'Ask button not visible' };
        }

        return {
            success: true,
            formElements: {
                hasFrustrationLabel: true,
                hasIdentityLabel: identityLabelVisible,
                hasCategoryLabel: categoryLabelVisible,
                hasFrustrationInput: frustrationInputVisible,
                hasIdentityInput: identityInputVisible,
                hasCategoryDropdown: categoryDropdownVisible,
                hasAskButton: askButtonVisible
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate to home page action
 * Helper action that only navigates to the home page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage }
 */
async function navigateToHomePage(page) {
    try {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        return { success: true };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get category dropdown options
 * Opens the dropdown and retrieves all available category options
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, categories }
 */
async function getCategoryOptions(page) {
    try {
        const categoryDropdown = page.getByTestId('category-select');
        await categoryDropdown.waitFor({ state: 'visible', timeout: 5000 });

        // Get all option elements (excluding the placeholder "Select...")
        const options = await categoryDropdown.locator('option').all();
        const categories = [];

        for (const option of options) {
            const text = await option.textContent();
            const value = await option.getAttribute('value');
            // Skip the placeholder option
            if (value !== '') {
                categories.push(text.trim());
            }
        }

        return {
            success: true,
            categories: categories
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if form fields are required
 * Verifies that all form input fields have the required attribute
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, requiredFields }
 */
async function checkFormFieldsRequired(page) {
    try {
        const frustrationInput = page.getByPlaceholder("e.g., get a good night's sleep");
        const identityInput = page.getByPlaceholder('e.g., a new parent');
        const categoryDropdown = page.getByTestId('category-select');

        await frustrationInput.waitFor({ state: 'visible', timeout: 5000 });
        await identityInput.waitFor({ state: 'visible', timeout: 5000 });
        await categoryDropdown.waitFor({ state: 'visible', timeout: 5000 });

        const frustrationRequired = await frustrationInput.getAttribute('required');
        const identityRequired = await identityInput.getAttribute('required');
        const categoryRequired = await categoryDropdown.getAttribute('required');

        return {
            success: true,
            requiredFields: {
                frustrationInputRequired: frustrationRequired !== null,
                identityInputRequired: identityRequired !== null,
                categoryDropdownRequired: categoryRequired !== null
            }
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowPostFormAction,
    navigateToHomePage,
    getCategoryOptions,
    checkFormFieldsRequired
};
