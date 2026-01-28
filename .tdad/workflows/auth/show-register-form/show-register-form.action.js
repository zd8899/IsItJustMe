/**
 * Show Register Form Action
 *
 * Navigates to the registration form and verifies all required elements are present.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.navigationType - 'header' to click Sign Up link, 'direct' to navigate to /auth/register
 * @returns {Promise<Object>} - Returns { success, errorMessage, formElements }
 */
async function performShowRegisterFormAction(page, context = {}) {
    try {
        const { navigationType = 'direct' } = context;

        if (navigationType === 'header') {
            // Navigate via home page -> Sign Up link
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            // Click the Sign Up link in the header
            const signUpLink = page.getByRole('link', { name: /sign up/i });

            // Use a more specific selector that excludes Next.js route announcer (empty alert with id __next-route-announcer__)
            // Only match alerts that contain actual text content
            const errorLocator = page.getByRole('alert').filter({ hasText: /.+/ });
            const outcome = await Promise.race([
                signUpLink.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
                errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
            ]).catch(() => ({ type: 'timeout' }));

            if (outcome.type === 'error') {
                const msg = await errorLocator.textContent();
                return { success: false, errorMessage: msg };
            }
            if (outcome.type === 'timeout') {
                return { success: false, errorMessage: 'Sign Up link not found in header' };
            }

            await signUpLink.click();
            await page.waitForLoadState('domcontentloaded');
        } else {
            // Navigate directly to registration page
            await page.goto('/auth/register');
            await page.waitForLoadState('domcontentloaded');
        }

        // Verify form elements are present
        const formLocator = page.getByRole('form').or(page.locator('form'));
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const createAccountButton = page.getByRole('button', { name: /create account/i });

        // Check for errors first
        // Use a more specific selector that excludes Next.js route announcer (empty alert)
        const errorLocator = page.getByRole('alert').filter({ hasText: /.+/ });
        const formOutcome = await Promise.race([
            usernameField.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (formOutcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg };
        }
        if (formOutcome.type === 'timeout') {
            return { success: false, errorMessage: 'Registration form not found or Username field not visible' };
        }

        // Verify all required elements exist
        const passwordVisible = await passwordField.isVisible().catch(() => false);
        const buttonVisible = await createAccountButton.isVisible().catch(() => false);

        if (!passwordVisible) {
            return { success: false, errorMessage: 'Password field not visible' };
        }
        if (!buttonVisible) {
            return { success: false, errorMessage: 'Create Account button not visible' };
        }

        return {
            success: true,
            formElements: {
                hasUsernameField: true,
                hasPasswordField: passwordVisible,
                hasCreateAccountButton: buttonVisible
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate to registration page action
 * Helper action that only navigates to the registration page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage }
 */
async function navigateToRegisterPage(page) {
    try {
        await page.goto('/auth/register');
        await page.waitForLoadState('domcontentloaded');
        return { success: true };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Fill password field action
 * Helper action to fill the password field for testing masking
 *
 * @param {Object} page - Playwright page object
 * @param {string} password - Password to enter
 * @returns {Promise<Object>} - Returns { success, errorMessage, inputType }
 */
async function fillPasswordField(page, password) {
    try {
        const passwordField = page.getByLabel(/password/i);
        await passwordField.waitFor({ state: 'visible', timeout: 5000 });
        await passwordField.fill(password);

        // Get the input type to verify it's a password field (masked)
        const inputType = await passwordField.getAttribute('type');

        return {
            success: true,
            inputType: inputType
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if login link exists on registration page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasLoginLink }
 */
async function checkLoginLinkExists(page) {
    try {
        // Look for a link that mentions login or sign in
        const loginLink = page.getByRole('link', { name: /log\s*in|sign\s*in/i });

        const outcome = await Promise.race([
            loginLink.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'timeout') {
            return { success: true, hasLoginLink: false };
        }

        return {
            success: true,
            hasLoginLink: true
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowRegisterFormAction,
    navigateToRegisterPage,
    fillPasswordField,
    checkLoginLinkExists
};
