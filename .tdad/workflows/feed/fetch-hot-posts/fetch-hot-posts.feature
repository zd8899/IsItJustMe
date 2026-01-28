Feature: Fetch Hot Posts
  As a user
  I want to query posts sorted by hot score
  So that I can discover trending frustrations

  # NOTE: Hot score is calculated based on votes and recency
  # Posts are sorted by hotScore descending, then createdAt descending


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Fetch hot posts returns posts sorted by hot score
    Given posts exist in the database with varying hot scores
    When the client sends GET request to "post.listHot" query
    Then the response status should be 200
    And the response should contain an array of posts
    And the posts should be sorted by hot score in descending order

  Scenario: [API] Fetch hot posts returns post data with required fields
    Given at least one post exists in the database
    When the client sends GET request to "post.listHot" query
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

  Scenario: [API] Fetch hot posts with default pagination limit
    Given more than 20 posts exist in the database
    When the client sends GET request to "post.listHot" query without limit parameter
    Then the response status should be 200
    And the response should contain at most 20 posts

  Scenario: [API] Fetch hot posts with custom limit
    Given posts exist in the database
    When the client sends GET request to "post.listHot" query with limit 10
    Then the response status should be 200
    And the response should contain at most 10 posts

  Scenario: [API] Fetch hot posts with cursor-based pagination
    Given more posts exist than the page limit
    When the client sends GET request to "post.listHot" query with a cursor from previous response
    Then the response status should be 200
    And the response should contain the next page of posts
    And the posts should not include posts from the previous page

  Scenario: [API] Fetch hot posts filtered by category
    Given posts exist in multiple categories
    When the client sends GET request to "post.listHot" query with categorySlug "technology"
    Then the response status should be 200
    And all returned posts should belong to the "technology" category

  Scenario: [API] Fetch hot posts returns empty array when no posts exist
    Given no posts exist in the database
    When the client sends GET request to "post.listHot" query
    Then the response status should be 200
    And the response should contain an empty array

  Scenario: [API] Fetch hot posts returns empty array for category with no posts
    Given posts exist but none in the "health" category
    When the client sends GET request to "post.listHot" query with categorySlug "health"
    Then the response status should be 200
    And the response should contain an empty array

  Scenario: [API] Fetch hot posts with invalid limit below minimum
    Given posts exist in the database
    When the client sends GET request to "post.listHot" query with limit 0
    Then the response status should be 400
    And the response error should indicate invalid input

  Scenario: [API] Fetch hot posts with invalid limit above maximum
    Given posts exist in the database
    When the client sends GET request to "post.listHot" query with limit 100
    Then the response status should be 400
    And the response error should indicate invalid input
