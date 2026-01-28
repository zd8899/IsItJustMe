Feature: Show Profile Page
  As a user
  I want to see the complete profile page layout
  So that I can view user information, karma, and posts in one place

  # NOTE: Profile page composes profile header, karma display, and user posts list
  # Profile accessible via /profile/[userId] route

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Display complete profile page for logged-in user
    Given the user is logged in
    And the user profile data has been fetched successfully
    When the user visits the profile page
    Then the user should see the profile header section
    And the user should see the username displayed in the header
    And the user should see the join date displayed in the header
    And the user should see the karma badge
    And the user should see a list of posts

  Scenario: [UI] Display profile page with all sections visible
    Given the user is logged in
    And the user profile has username "testuser"
    And the user joined on "January 15, 2024"
    And the user has a total karma of 25
    And the user has created posts
    When the user visits the profile page
    Then the user should see the username "testuser" displayed in the header
    And the user should see the join date "January 15, 2024" displayed in the header
    And the karma badge should display "25"
    And the user should see a list of posts

  Scenario: [UI] Display profile page for user with no posts
    Given the user is logged in
    And the user profile data has been fetched successfully
    And the user has not created any posts
    When the user visits the profile page
    Then the user should see the profile header section
    And the user should see the karma badge
    And the user should see an empty state message
    And the message should indicate the user has no posts yet

  Scenario: [UI] Display profile page for new user with zero karma
    Given the user is logged in
    And the user profile data has been fetched successfully
    And the user has a total karma of 0
    And the user has not created any posts
    When the user visits the profile page
    Then the user should see the profile header section
    And the karma badge should display "0"
    And the user should see an empty state message

  Scenario: [UI] Show loading state while profile page loads
    Given the user is logged in
    When the user navigates to the profile page
    And the profile data is being fetched
    Then the user should see a loading indicator
    And the loading indicator should be visible until profile data is loaded

  Scenario: [UI] Navigate to post detail from profile page
    Given the user is logged in
    And the user profile data has been fetched successfully
    And the user has created posts
    And the user is viewing the profile page
    When the user clicks on a post in the list
    Then the user should be navigated to the post detail page

  Scenario: [UI] Display profile page with karma breakdown
    Given the user is logged in
    And the user profile data has been fetched successfully
    And the user has post karma of 15
    And the user has comment karma of 10
    When the user visits the profile page
    Then the user should see the karma badge
    And the user should see "Post Karma: 15"
    And the user should see "Comment Karma: 10"

  Scenario: [UI] Handle profile not found error
    Given the user navigates to a non-existent user profile
    When the profile page loads
    Then the user should see a message indicating the profile was not found

  Scenario: [UI] Handle profile fetch error
    Given the user is logged in
    When the user visits the profile page
    And the profile fetch fails due to an error
    Then the user should see an error message
    And the user should have the option to retry loading the profile

  Scenario: [UI] View another user's public profile
    Given the user is on the platform
    And a user profile exists with username "otheruser"
    When the user visits the profile page for "otheruser"
    Then the user should see the username "otheruser" displayed in the header
    And the user should see the karma badge
    And the user should see a list of posts created by "otheruser"
