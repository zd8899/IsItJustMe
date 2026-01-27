Feature: Show Comment Form
  As a user
  I want to see a comment input form on the post detail page
  So that I can write and submit comments on posts

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Comment form is displayed on post detail page
    Given the user is on the post detail page
    Then the user should see a comment textarea
    And the user should see a "Reply" button

  Scenario: [UI] Comment textarea accepts text input
    Given the user is on the post detail page
    When the user types "This is my comment" in the comment textarea
    Then the comment textarea should contain "This is my comment"

  Scenario: [UI] Comment form placeholder text is visible
    Given the user is on the post detail page
    Then the comment textarea should display placeholder text

  Scenario: [UI] Reply button is visible and clickable
    Given the user is on the post detail page
    When the user types "Test comment" in the comment textarea
    Then the "Reply" button should be enabled

  Scenario: [UI] Comment form allows anonymous users to comment
    Given the user is not logged in
    And the user is on the post detail page
    Then the user should see a comment textarea
    And the user should see a "Reply" button
