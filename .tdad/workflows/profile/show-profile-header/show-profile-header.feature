Feature: Show Profile Header
  As a user
  I want to see the profile header with username and join date
  So that I can identify the user and know when they joined the platform

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Display username in profile header
    Given a user profile has been fetched with username "testuser"
    When the user visits the profile page
    Then the user should see the username "testuser" displayed in the header

  Scenario: [UI] Display join date in profile header
    Given a user profile has been fetched with username "testuser"
    And the user joined on "January 15, 2024"
    When the user visits the profile page
    Then the user should see the join date "January 15, 2024" displayed in the header

  Scenario: [UI] Display complete profile header information
    Given a user profile has been fetched with username "activeuser"
    And the user joined on "March 10, 2024"
    When the user visits the profile page
    Then the user should see the username "activeuser" displayed in the header
    And the user should see the join date "March 10, 2024" displayed in the header

  Scenario: [UI] Show loading state while fetching profile
    Given the user profile is being fetched
    When the user visits the profile page
    Then the user should see a loading indicator in the profile header

  Scenario: [UI] Handle non-existent user profile
    Given no user profile exists for the requested user
    When the user visits the profile page
    Then the user should see a message indicating the profile was not found
