Feature: Apply Category Filter
  As a user
  I want to filter the feed by selecting a category
  So that I can browse frustrations relevant to a specific topic

  # NOTE: Categories are Work, Relationships, Technology, Health, Parenting, Finance, Daily Life, Social, Other
  # "All Categories" shows unfiltered feed


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Filter triggers API call with selected category
    Given posts exist in multiple categories
    When the client sends GET request to "post.listByCategory" query with categorySlug "technology"
    Then the response status should be 200
    And all returned posts should belong to the "technology" category

  Scenario: [API] Filter with non-existent category returns error
    Given categories exist in the database
    When the client sends GET request to "post.listByCategory" query with categorySlug "invalid-category"
    Then the response status should be 404
    And the response error should be "Category not found"


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Selecting a category filters the feed
    Given the user is on the feed page
    And posts exist in the "Technology" category
    When the user clicks the category filter dropdown
    And the user selects "Technology" from the dropdown
    Then the feed should display only posts from the "Technology" category
    And each post card should show the "Technology" category badge

  Scenario: [UI] Selecting "All Categories" shows unfiltered feed
    Given the user is on the feed page
    And posts exist in multiple categories
    And the user has selected "Work" category filter
    When the user clicks the category filter dropdown
    And the user selects "All Categories" from the dropdown
    Then the feed should display posts from all categories

  Scenario: [UI] Loading state while fetching filtered posts
    Given the user is on the feed page
    When the user clicks the category filter dropdown
    And the user selects "Health" from the dropdown
    Then the user should see a loading indicator
    And when loading completes the feed should display posts from the "Health" category

  Scenario: [UI] Empty state when category has no posts
    Given the user is on the feed page
    And the "Finance" category exists but has no posts
    When the user clicks the category filter dropdown
    And the user selects "Finance" from the dropdown
    Then the user should see an empty state message
    And the feed should display no post cards

  Scenario: [UI] Category filter persists across feed tab switches
    Given the user is on the feed page viewing the "Hot" tab
    And the user has selected "Relationships" category filter
    When the user switches to the "New" tab
    Then the category filter should still display "Relationships" as the selected option
    And the feed should display only posts from the "Relationships" category

  Scenario: [UI] Filtered feed shows correct post count
    Given the user is on the feed page
    And posts exist in the "Work" category
    When the user clicks the category filter dropdown
    And the user selects "Work" from the dropdown
    Then the feed should display post cards
    And all displayed posts should belong to the "Work" category
