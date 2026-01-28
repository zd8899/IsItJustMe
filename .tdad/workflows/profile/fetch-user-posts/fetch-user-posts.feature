Feature: Fetch User Posts
  As a user
  I want to fetch posts created by a specific user
  So that I can view their post history on their profile

  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Fetch user posts successfully
    Given a user exists with username "postauthor"
    And the user has created a post with frustration "find parking downtown"
    When the client sends a query to "post.listByUser" with the user's id
    Then the response should be an array
    And the response should contain at least 1 post
    And each post should contain "id"
    And each post should contain "frustration"
    And each post should contain "identity"
    And each post should contain "category"

  Scenario: [API] Fetch user posts returns posts in descending order by creation date
    Given a user exists with username "activeauthor"
    And the user has created a post with frustration "find a good restaurant"
    And the user has created a post with frustration "get a taxi on Friday night"
    When the client sends a query to "post.listByUser" with the user's id
    Then the response should contain 2 posts
    And the first post should have frustration "get a taxi on Friday night"
    And the second post should have frustration "find a good restaurant"

  Scenario: [API] Fetch posts for user with no posts
    Given a user exists with username "newuser"
    And the user has not created any posts
    When the client sends a query to "post.listByUser" with the user's id
    Then the response should be an empty array

  Scenario: [API] Fetch posts for non-existent user
    Given no user exists with id "non-existent-user-id"
    When the client sends a query to "post.listByUser" with userId "non-existent-user-id"
    Then the response should be an empty array

  Scenario: [API] Fetch user posts with invalid input
    When the client sends a query to "post.listByUser" with empty userId
    Then the response status should indicate validation error

  Scenario: [API] Fetch user posts includes category information
    Given a user exists with username "categoryauthor"
    And a category exists with name "Technology" and slug "technology"
    And the user has created a post in category "technology"
    When the client sends a query to "post.listByUser" with the user's id
    Then the response should contain at least 1 post
    And each post should contain "category"
    And the category should contain "id"
    And the category should contain "name"
    And the category should contain "slug"
