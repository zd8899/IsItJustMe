Feature: Fetch Posts By Category
  As a user
  I want to filter posts by selected category
  So that I can browse frustrations relevant to a specific topic

  # NOTE: Posts are filtered by category slug
  # Results can be sorted by hot score or creation date


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Fetch posts by category returns filtered posts
    Given posts exist in multiple categories
    When the client sends GET request to "post.listByCategory" query with categorySlug "technology"
    Then the response status should be 200
    And the response should contain an array of posts
    And all returned posts should belong to the "technology" category

  Scenario: [API] Fetch posts by category returns post data with required fields
    Given at least one post exists in the "work" category
    When the client sends GET request to "post.listByCategory" query with categorySlug "work"
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

  Scenario: [API] Fetch posts by category with default pagination limit
    Given more than 20 posts exist in the "daily-life" category
    When the client sends GET request to "post.listByCategory" query with categorySlug "daily-life" without limit parameter
    Then the response status should be 200
    And the response should contain at most 20 posts
    And all returned posts should belong to the "daily-life" category

  Scenario: [API] Fetch posts by category with custom limit
    Given posts exist in the "relationships" category
    When the client sends GET request to "post.listByCategory" query with categorySlug "relationships" and limit 10
    Then the response status should be 200
    And the response should contain at most 10 posts
    And all returned posts should belong to the "relationships" category

  Scenario: [API] Fetch posts by category with cursor-based pagination
    Given more posts exist in the "parenting" category than the page limit
    When the client sends GET request to "post.listByCategory" query with categorySlug "parenting" and a cursor from previous response
    Then the response status should be 200
    And the response should contain the next page of posts
    And the posts should not include posts from the previous page
    And all returned posts should belong to the "parenting" category

  Scenario: [API] Fetch posts by category returns empty array when category has no posts
    Given the "health" category exists but has no posts
    When the client sends GET request to "post.listByCategory" query with categorySlug "health"
    Then the response status should be 200
    And the response should contain an empty array

  Scenario: [API] Fetch posts by category with invalid category slug
    Given categories exist in the database
    When the client sends GET request to "post.listByCategory" query with categorySlug "non-existent-category"
    Then the response status should be 404
    And the response error should be "Category not found"

  Scenario: [API] Fetch posts by category without required categorySlug parameter
    Given posts exist in the database
    When the client sends GET request to "post.listByCategory" query without categorySlug parameter
    Then the response status should be 400
    And the response error should indicate invalid input

  Scenario: [API] Fetch posts by category with invalid limit below minimum
    Given posts exist in the "technology" category
    When the client sends GET request to "post.listByCategory" query with categorySlug "technology" and limit 0
    Then the response status should be 400
    And the response error should indicate invalid input

  Scenario: [API] Fetch posts by category with invalid limit above maximum
    Given posts exist in the "technology" category
    When the client sends GET request to "post.listByCategory" query with categorySlug "technology" and limit 100
    Then the response status should be 400
    And the response error should indicate invalid input

  Scenario: [API] Fetch posts by category returns posts sorted by creation date descending
    Given posts exist in the "finance" category with varying creation times
    When the client sends GET request to "post.listByCategory" query with categorySlug "finance"
    Then the response status should be 200
    And the posts should be sorted by creation date in descending order
    And all returned posts should belong to the "finance" category
