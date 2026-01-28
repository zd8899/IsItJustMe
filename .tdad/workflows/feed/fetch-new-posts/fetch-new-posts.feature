Feature: Fetch New Posts
  As a user
  I want to query posts sorted by creation date
  So that I can discover the latest frustrations

  # NOTE: Posts are sorted by createdAt descending (newest first)


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Fetch new posts returns posts sorted by creation date
    Given posts exist in the database with varying creation times
    When the client sends GET request to "post.listNew" query
    Then the response status should be 200
    And the response should contain an array of posts
    And the posts should be sorted by creation date in descending order

  Scenario: [API] Fetch new posts returns post data with required fields
    Given at least one post exists in the database
    When the client sends GET request to "post.listNew" query
    Then the response status should be 200
    And each post should contain "id"
    And each post should contain "frustration"
    And each post should contain "identity"
    And each post should contain "upvotes"
    And each post should contain "downvotes"
    And each post should contain "score"
    And each post should contain "commentCount"
    And each post should contain "createdAt"
    And each post should contain "category" with "name" and "slug"

  Scenario: [API] Fetch new posts with default pagination limit
    Given more than 20 posts exist in the database
    When the client sends GET request to "post.listNew" query without limit parameter
    Then the response status should be 200
    And the response should contain at most 20 posts

  Scenario: [API] Fetch new posts with custom limit
    Given posts exist in the database
    When the client sends GET request to "post.listNew" query with limit 10
    Then the response status should be 200
    And the response should contain at most 10 posts

  Scenario: [API] Fetch new posts with cursor-based pagination
    Given more posts exist than the page limit
    When the client sends GET request to "post.listNew" query with a cursor from previous response
    Then the response status should be 200
    And the response should contain the next page of posts
    And the posts should not include posts from the previous page

  Scenario: [API] Fetch new posts filtered by category
    Given posts exist in multiple categories
    When the client sends GET request to "post.listNew" query with categorySlug "technology"
    Then the response status should be 200
    And all returned posts should belong to the "technology" category

  Scenario: [API] Fetch new posts returns empty array when no posts exist
    Given no posts exist in the database
    When the client sends GET request to "post.listNew" query
    Then the response status should be 200
    And the response should contain an empty array

  Scenario: [API] Fetch new posts returns empty array for category with no posts
    Given posts exist but none in the "health" category
    When the client sends GET request to "post.listNew" query with categorySlug "health"
    Then the response status should be 200
    And the response should contain an empty array

  Scenario: [API] Fetch new posts with invalid limit below minimum
    Given posts exist in the database
    When the client sends GET request to "post.listNew" query with limit 0
    Then the response status should be 400
    And the response error should indicate invalid input

  Scenario: [API] Fetch new posts with invalid limit above maximum
    Given posts exist in the database
    When the client sends GET request to "post.listNew" query with limit 100
    Then the response status should be 400
    And the response error should indicate invalid input
