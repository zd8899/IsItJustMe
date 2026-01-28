Feature: Fetch User Profile
  As a user
  I want to fetch a user profile from the database
  So that I can view user information and statistics

  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Fetch user profile successfully
    Given a user exists with username "testuser"
    When the client sends a query to "user.getProfile" with the user's id
    Then the response should contain "id"
    And the response should contain "username" with value "testuser"
    And the response should contain "karma"
    And the response should contain "createdAt"

  Scenario: [API] Fetch user profile includes post and comment counts
    Given a user exists with username "activeuser"
    And the user has created posts
    And the user has created comments
    When the client sends a query to "user.getProfile" with the user's id
    Then the response should contain "_count"
    And the "_count" should include "posts"
    And the "_count" should include "comments"

  Scenario: [API] Fetch profile for non-existent user
    Given no user exists with id "non-existent-id"
    When the client sends a query to "user.getProfile" with id "non-existent-id"
    Then the response should be null

  Scenario: [API] Fetch user profile with invalid input
    When the client sends a query to "user.getProfile" with empty userId
    Then the response status should indicate validation error
