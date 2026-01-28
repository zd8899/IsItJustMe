Feature: Show User Posts List
  As a user
  I want to see the list of posts created by a user
  So that I can view their post history on their profile

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Display user posts list with multiple posts
    Given the user profile data has been fetched successfully
    And the user has created posts
    When the user visits the profile page
    Then the user should see a list of posts
    And each post should display the frustration text
    And each post should display the identity context
    And each post should display the category badge
    And each post should display the vote score

  Scenario: [UI] Display posts in descending chronological order
    Given the user profile data has been fetched successfully
    And the user has created multiple posts
    When the user visits the profile page
    Then the user should see posts ordered from newest to oldest
    And the most recent post should appear first in the list

  Scenario: [UI] Display empty state when user has no posts
    Given the user profile data has been fetched successfully
    And the user has not created any posts
    When the user visits the profile page
    Then the user should see an empty state message
    And the message should indicate the user has no posts yet

  Scenario: [UI] Display loading state while fetching posts
    Given the user is navigating to a profile page
    When the posts are being fetched
    Then the user should see a loading indicator
    And the loading indicator should be visible until posts are loaded

  Scenario: [UI] Navigate to post detail from posts list
    Given the user profile data has been fetched successfully
    And the user has created posts
    And the user is viewing the profile page
    When the user clicks on a post in the list
    Then the user should be navigated to the post detail page

  Scenario: [UI] Display post metadata in list items
    Given the user profile data has been fetched successfully
    And the user has created a post
    When the user visits the profile page
    Then the user should see the post creation date
    And the user should see the comment count for the post

  Scenario: [UI] Display error state when posts fail to load
    Given the user is on the profile page
    When the posts fetch fails due to an error
    Then the user should see an error message
    And the user should have the option to retry loading posts
