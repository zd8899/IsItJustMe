Feature: Switch Feed Type
  As a user
  I want to toggle between hot and new feeds
  So that I can discover trending frustrations or see the latest posts

  # NOTE: Hot feed shows posts sorted by hot score (trending)
  # New feed shows posts sorted by creation date (newest first)


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Switch from Hot feed to New feed
    Given the user is on the home page
    And the "Hot" tab is active
    And hot posts are displayed in the feed
    When the user clicks the "New" tab button
    Then the "New" tab should be displayed as active
    And the "Hot" tab should be displayed as inactive
    And the feed should display posts sorted by newest first

  Scenario: [UI] Switch from New feed to Hot feed
    Given the user is on the home page
    And the "New" tab is active
    And new posts are displayed in the feed
    When the user clicks the "Hot" tab button
    Then the "Hot" tab should be displayed as active
    And the "New" tab should be displayed as inactive
    And the feed should display posts sorted by hot score

  Scenario: [UI] Feed displays loading state while switching
    Given the user is on the home page
    And the "Hot" tab is active
    When the user clicks the "New" tab button
    Then the user should see a loading indicator
    And when loading completes the feed should display new posts

  Scenario: [UI] Feed content changes when switching tabs
    Given the user is on the home page
    And posts exist with different hot scores and creation dates
    And the "Hot" tab is active
    When the user clicks the "New" tab button
    Then the feed should display different posts than before
    And each post should show the frustration text
    And each post should show the identity text
    And each post should show the category badge
    And each post should show the vote count
    And each post should show the comment count

  Scenario: [UI] Hot feed is displayed by default on page load
    Given posts exist in the database
    When the user navigates to the home page
    Then the "Hot" tab should be displayed as active
    And the feed should display posts sorted by hot score

  Scenario: [UI] Empty state when no posts exist for current feed
    Given no posts exist in the database
    And the user is on the home page
    When the user clicks the "New" tab button
    Then the user should see an empty feed state
    And the "New" tab should be displayed as active

  Scenario: [UI] Switching feeds preserves category filter
    Given the user is on the home page
    And the user has filtered by "Technology" category
    And the "Hot" tab is active
    When the user clicks the "New" tab button
    Then the "New" tab should be displayed as active
    And the feed should display only "Technology" posts
    And the posts should be sorted by newest first
