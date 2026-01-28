Feature: Show Feed Tabs
  As a user
  I want to see Hot and New tab buttons on the feed
  So that I can switch between different feed sorting options

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Display feed tabs on home page
    Given the user is on the home page
    Then the user should see a "Hot" tab button
    And the user should see a "New" tab button

  Scenario: [UI] Hot tab is active by default
    Given the user is on the home page
    Then the "Hot" tab should be displayed as active
    And the "New" tab should be displayed as inactive

  Scenario: [UI] Switch to New tab
    Given the user is on the home page
    And the "Hot" tab is active
    When the user clicks the "New" tab button
    Then the "New" tab should be displayed as active
    And the "Hot" tab should be displayed as inactive

  Scenario: [UI] Switch back to Hot tab
    Given the user is on the home page
    And the "New" tab is active
    When the user clicks the "Hot" tab button
    Then the "Hot" tab should be displayed as active
    And the "New" tab should be displayed as inactive
