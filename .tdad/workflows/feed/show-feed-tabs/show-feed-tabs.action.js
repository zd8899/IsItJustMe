/**
 * Show Feed Tabs Action
 *
 * Provides UI interactions for the feed tabs (Hot/New) on the home page.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and options
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

/**
 * Navigate to home page and verify feed tabs are visible
 */
async function performShowFeedTabsAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for Hot tab button
    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Verify both tabs are visible using Promise.race for error detection
    const outcome = await Promise.race([
      Promise.all([
        hotTab.waitFor({ state: 'visible', timeout: 5000 }),
        newTab.waitFor({ state: 'visible', timeout: 5000 })
      ]).then(() => ({ type: 'success' })),
      page.getByRole('alert').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (outcome.type === 'error') {
      const errorMessage = await page.getByRole('alert').first().textContent();
      return { success: false, errorMessage };
    }

    if (outcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for feed tabs to appear' };
    }

    return {
      success: true,
      hotTabVisible: true,
      newTabVisible: true
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Check if Hot tab is displayed as active (primary variant)
 */
async function checkHotTabIsActive(page, context = {}) {
  try {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });

    // Check Hot tab has primary styling (bg-primary-900)
    const hotTabClass = await hotTab.getAttribute('class');
    const newTabClass = await newTab.getAttribute('class');

    const hotIsActive = hotTabClass && hotTabClass.includes('bg-primary-900');
    const newIsInactive = newTabClass && !newTabClass.includes('bg-primary-900');

    if (!hotIsActive) {
      return { success: false, errorMessage: 'Hot tab is not displayed as active' };
    }

    if (!newIsInactive) {
      return { success: false, errorMessage: 'New tab is not displayed as inactive' };
    }

    return {
      success: true,
      hotIsActive: true,
      newIsActive: false
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Click on a feed tab and verify it becomes active
 */
async function clickFeedTab(page, context = {}) {
  try {
    const { tabName } = context;

    if (!tabName || !['Hot', 'New'].includes(tabName)) {
      return { success: false, errorMessage: 'tabName must be "Hot" or "New"' };
    }

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const targetTab = page.getByRole('button', { name: tabName });
    await targetTab.waitFor({ state: 'visible', timeout: 5000 });

    // Click the tab
    await targetTab.click();

    // Wait for state update
    await page.waitForLoadState('domcontentloaded');

    // Verify the clicked tab is now active
    const targetTabClass = await targetTab.getAttribute('class');
    const isActive = targetTabClass && targetTabClass.includes('bg-primary-900');

    if (!isActive) {
      return { success: false, errorMessage: `${tabName} tab did not become active after click` };
    }

    // Verify the other tab is inactive
    const otherTabName = tabName === 'Hot' ? 'New' : 'Hot';
    const otherTab = page.getByRole('button', { name: otherTabName });
    const otherTabClass = await otherTab.getAttribute('class');
    const otherIsInactive = otherTabClass && !otherTabClass.includes('bg-primary-900');

    if (!otherIsInactive) {
      return { success: false, errorMessage: `${otherTabName} tab did not become inactive` };
    }

    return {
      success: true,
      activeTab: tabName,
      inactiveTab: otherTabName
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Switch from Hot to New tab
 */
async function switchToNewTab(page, context = {}) {
  try {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });

    // Verify Hot is currently active
    const hotTabClassBefore = await hotTab.getAttribute('class');
    if (!hotTabClassBefore || !hotTabClassBefore.includes('bg-primary-900')) {
      return { success: false, errorMessage: 'Hot tab is not active before switching' };
    }

    // Click New tab
    await newTab.click();

    // Wait for state update
    await page.waitForLoadState('domcontentloaded');

    // Verify New is now active and Hot is inactive
    const newTabClassAfter = await newTab.getAttribute('class');
    const hotTabClassAfter = await hotTab.getAttribute('class');

    const newIsActive = newTabClassAfter && newTabClassAfter.includes('bg-primary-900');
    const hotIsInactive = hotTabClassAfter && !hotTabClassAfter.includes('bg-primary-900');

    if (!newIsActive) {
      return { success: false, errorMessage: 'New tab did not become active' };
    }

    if (!hotIsInactive) {
      return { success: false, errorMessage: 'Hot tab did not become inactive' };
    }

    return {
      success: true,
      activeTab: 'New',
      inactiveTab: 'Hot'
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Switch from New back to Hot tab
 */
async function switchToHotTab(page, context = {}) {
  try {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });

    // First click New to make it active
    await newTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify New is currently active
    const newTabClassBefore = await newTab.getAttribute('class');
    if (!newTabClassBefore || !newTabClassBefore.includes('bg-primary-900')) {
      return { success: false, errorMessage: 'New tab is not active before switching back' };
    }

    // Click Hot tab
    await hotTab.click();

    // Wait for state update
    await page.waitForLoadState('domcontentloaded');

    // Verify Hot is now active and New is inactive
    const hotTabClassAfter = await hotTab.getAttribute('class');
    const newTabClassAfter = await newTab.getAttribute('class');

    const hotIsActive = hotTabClassAfter && hotTabClassAfter.includes('bg-primary-900');
    const newIsInactive = newTabClassAfter && !newTabClassAfter.includes('bg-primary-900');

    if (!hotIsActive) {
      return { success: false, errorMessage: 'Hot tab did not become active' };
    }

    if (!newIsInactive) {
      return { success: false, errorMessage: 'New tab did not become inactive' };
    }

    return {
      success: true,
      activeTab: 'Hot',
      inactiveTab: 'New'
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Get current active tab name
 */
function getActiveTab(result) {
  return result.activeTab || null;
}

/**
 * Get visibility status of tabs
 */
function getTabsVisibility(result) {
  return {
    hotVisible: result.hotTabVisible || false,
    newVisible: result.newTabVisible || false
  };
}

module.exports = {
  performShowFeedTabsAction,
  checkHotTabIsActive,
  clickFeedTab,
  switchToNewTab,
  switchToHotTab,
  getActiveTab,
  getTabsVisibility
};
