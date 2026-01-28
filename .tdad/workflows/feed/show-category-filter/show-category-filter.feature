Feature: Show Category Filter
  As a user
  I want to see a category dropdown selector
  So that I can filter posts by category

  # Categories: Work, Relationships, Technology, Health, Parenting, Finance, Daily Life, Social, Other

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Category filter dropdown is visible on feed page
    Given the user is on the feed page
    Then the user should see the category filter dropdown
    And the category filter should display "All Categories" as the default option

  Scenario: [UI] Category filter shows all available categories
    Given the user is on the feed page
    When the user clicks the category filter dropdown
    Then the user should see "All Categories" option
    And the user should see "Work" option
    And the user should see "Relationships" option
    And the user should see "Technology" option
    And the user should see "Health" option
    And the user should see "Parenting" option
    And the user should see "Finance" option
    And the user should see "Daily Life" option
    And the user should see "Social" option
    And the user should see "Other" option

  Scenario: [UI] User can select a category from dropdown
    Given the user is on the feed page
    When the user clicks the category filter dropdown
    And the user selects "Technology" from the dropdown
    Then the category filter should display "Technology" as the selected option

  Scenario: [UI] Category filter closes after selection
    Given the user is on the feed page
    When the user clicks the category filter dropdown
    And the user selects "Work" from the dropdown
    Then the category filter dropdown should be closed
