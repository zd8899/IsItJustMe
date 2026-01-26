Feature: Seed Categories
  As a developer
  I want to insert predefined categories into the database
  So that users can categorize their frustration posts

  # NOTE: Categories are predefined as per PRD: Work, Relationships, Technology,
  # Health, Parenting, Finance, Daily Life, Social, Other


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Happy Path: Seed Execution ---
  Scenario: [API] Seed creates all predefined categories
    Given the database migration has been executed
    And the Category table is empty
    When the database seed is executed
    Then the Category table should contain 9 categories
    And the client sends GET request to "/api/trpc/category.list"
    And the response status should be 200
    And the response should contain 9 categories

  Scenario: [API] Seed creates Work category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Work"
    And the category should have slug "work"

  Scenario: [API] Seed creates Relationships category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Relationships"
    And the category should have slug "relationships"

  Scenario: [API] Seed creates Technology category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Technology"
    And the category should have slug "technology"

  Scenario: [API] Seed creates Health category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Health"
    And the category should have slug "health"

  Scenario: [API] Seed creates Parenting category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Parenting"
    And the category should have slug "parenting"

  Scenario: [API] Seed creates Finance category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Finance"
    And the category should have slug "finance"

  Scenario: [API] Seed creates Daily Life category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Daily Life"
    And the category should have slug "daily-life"

  Scenario: [API] Seed creates Social category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Social"
    And the category should have slug "social"

  Scenario: [API] Seed creates Other category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Other"
    And the category should have slug "other"

  # --- API Verification ---
  Scenario: [API] Category list API returns all seeded categories
    Given the database migration has been executed
    And the database seed has been executed
    When the client sends GET request to "/api/trpc/category.list"
    Then the response status should be 200
    And the response should contain category with name "Work"
    And the response should contain category with name "Relationships"
    And the response should contain category with name "Technology"
    And the response should contain category with name "Health"
    And the response should contain category with name "Parenting"
    And the response should contain category with name "Finance"
    And the response should contain category with name "Daily Life"
    And the response should contain category with name "Social"
    And the response should contain category with name "Other"

  Scenario: [API] Category list API returns categories with id and slug
    Given the database migration has been executed
    And the database seed has been executed
    When the client sends GET request to "/api/trpc/category.list"
    Then the response status should be 200
    And each category in the response should have an "id" field
    And each category in the response should have a "name" field
    And each category in the response should have a "slug" field

  # --- Edge Cases: Idempotency ---
  Scenario: [API] Seed is idempotent when run multiple times
    Given the database migration has been executed
    And the database seed has been executed
    When the database seed is executed again
    Then no errors should occur
    And the Category table should contain exactly 9 categories
    And no duplicate categories should exist

  Scenario: [API] Seed handles existing categories gracefully
    Given the database migration has been executed
    And the Category table already contains category "Work" with slug "work"
    When the database seed is executed
    Then no errors should occur
    And only one category with name "Work" should exist

  # --- Edge Cases: Error Handling ---
  Scenario: [API] Seed fails gracefully without database connection
    Given the database connection is unavailable
    When the database seed is attempted
    Then the seed should fail with connection error
    And no partial data should be inserted

  Scenario: [API] Seed fails if migration has not been executed
    Given the database migration has not been executed
    When the database seed is attempted
    Then the seed should fail with table not found error
