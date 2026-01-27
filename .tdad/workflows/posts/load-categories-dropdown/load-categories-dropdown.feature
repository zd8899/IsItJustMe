Feature: Load Categories Dropdown
  As a user
  I want to see category options in the dropdown
  So that I can categorize my post appropriately

  # Categories: Work, Relationships, Technology, Health, Parenting, Finance, Daily Life, Social, Other


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Get categories list success
    Given the database has been seeded with categories
    When the client sends GET request to "/api/categories"
    Then the response status should be 200
    And the response body should contain an array of categories
    And each category should have "id", "name", and "slug" fields

  Scenario: [API] Categories list includes all predefined categories
    Given the database has been seeded with categories
    When the client sends GET request to "/api/categories"
    Then the response status should be 200
    And the response should include category "Work"
    And the response should include category "Relationships"
    And the response should include category "Technology"
    And the response should include category "Health"
    And the response should include category "Parenting"
    And the response should include category "Finance"
    And the response should include category "Daily Life"
    And the response should include category "Social"
    And the response should include category "Other"

  Scenario: [API] Categories list returns empty when no categories exist
    Given the database has no categories
    When the client sends GET request to "/api/categories"
    Then the response status should be 200
    And the response body should be an empty array


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Category dropdown displays all categories
    Given the database has been seeded with categories
    When the user visits the home page
    Then the user should see the category dropdown
    And the category dropdown should contain "Work"
    And the category dropdown should contain "Relationships"
    And the category dropdown should contain "Technology"
    And the category dropdown should contain "Health"
    And the category dropdown should contain "Parenting"
    And the category dropdown should contain "Finance"
    And the category dropdown should contain "Daily Life"
    And the category dropdown should contain "Social"
    And the category dropdown should contain "Other"

  Scenario: [UI] Category dropdown shows placeholder when not selected
    Given the database has been seeded with categories
    When the user visits the home page
    Then the user should see the category dropdown
    And the category dropdown should show placeholder "Select a category"

  Scenario: [UI] User can select a category from dropdown
    Given the database has been seeded with categories
    When the user visits the home page
    And the user clicks on the category dropdown
    And the user selects "Technology" from the dropdown
    Then the category dropdown should display "Technology" as selected

  Scenario: [UI] Category dropdown shows loading state while fetching
    Given the categories API is slow to respond
    When the user visits the home page
    Then the category dropdown should show loading state

  Scenario: [UI] Category dropdown shows error when API fails
    Given the categories API returns an error
    When the user visits the home page
    Then the user should see error message "Failed to load categories"
