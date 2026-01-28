Feature: Load More Posts
  As a user
  I want to load more posts as I scroll down the feed
  So that I can browse through all available content without page reloads

  # NOTE: Implements infinite scroll pagination
  # Posts are fetched in pages using cursor-based pagination
  # Feed pagination should load in < 500ms per PRD requirements


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Fetch next page of hot posts successfully
    Given posts exist in the database with varying hot scores
    And the client has received the first page of hot posts
    When the client sends a request to "post.listHot" with the cursor from the previous response
    Then the response status should be 200
    And the response body should contain "posts" array
    And the response body should contain "nextCursor" for further pagination
    And the posts should be sorted by hot score descending

  Scenario: [API] Fetch next page of new posts successfully
    Given posts exist in the database with different creation dates
    And the client has received the first page of new posts
    When the client sends a request to "post.listNew" with the cursor from the previous response
    Then the response status should be 200
    And the response body should contain "posts" array
    And the response body should contain "nextCursor" for further pagination
    And the posts should be sorted by creation date descending

  Scenario: [API] Fetch next page with category filter applied
    Given posts exist in multiple categories
    And the client has received the first page filtered by "Technology" category
    When the client sends a request to "post.listByCategory" with the cursor and category "Technology"
    Then the response status should be 200
    And the response body should contain "posts" array
    And all returned posts should belong to the "Technology" category
    And the response body should contain "nextCursor" for further pagination

  Scenario: [API] Fetch next page returns empty when no more posts exist
    Given the client has received all available posts
    When the client sends a request to "post.listHot" with the cursor from the last page
    Then the response status should be 200
    And the response body should contain an empty "posts" array
    And the response body should contain "nextCursor" as null

  Scenario: [API] Fetch posts with invalid cursor returns error
    Given posts exist in the database
    When the client sends a request to "post.listHot" with an invalid cursor
    Then the response status should be 400
    And the response error should be "Invalid cursor"


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Load more posts when user scrolls to bottom
    Given the user is on the home page
    And posts are displayed in the feed
    And more posts exist than the initial page size
    When the user scrolls to the bottom of the post list
    Then the user should see a loading indicator at the bottom
    And additional post cards should load
    And the new posts should be appended below the existing posts

  Scenario: [UI] Load more posts maintains current feed type
    Given the user is on the home page
    And the "Hot" tab is active
    And posts are displayed in the feed
    And more posts exist than the initial page size
    When the user scrolls to the bottom of the post list
    Then additional post cards should load
    And the new posts should maintain hot score sorting
    And higher scored posts should appear before lower scored posts

  Scenario: [UI] Load more posts maintains category filter
    Given the user is on the home page
    And the user has filtered by "Work" category
    And posts are displayed from the "Work" category
    And more posts exist in the "Work" category
    When the user scrolls to the bottom of the post list
    Then additional post cards should load
    And all new posts should display the "Work" category badge

  Scenario: [UI] No more posts indicator when all posts loaded
    Given the user is on the home page
    And posts are displayed in the feed
    And the user has scrolled and loaded all available posts
    When the user scrolls to the bottom of the post list
    Then no loading indicator should appear
    And no additional posts should be loaded

  Scenario: [UI] Load more posts on New tab
    Given the user is on the home page
    And the "New" tab is active
    And posts are displayed sorted by newest first
    And more posts exist than the initial page size
    When the user scrolls to the bottom of the post list
    Then additional post cards should load
    And the new posts should maintain chronological sorting
    And more recent posts should appear before older posts

  Scenario: [UI] Loading state visible while fetching more posts
    Given the user is on the home page
    And posts are displayed in the feed
    And more posts exist than the initial page size
    When the user scrolls to the bottom of the post list
    And the next page is being fetched
    Then the user should see a loading indicator at the bottom of the list
    And existing posts should remain visible and interactive

  Scenario: [UI] Error handling when load more fails
    Given the user is on the home page
    And posts are displayed in the feed
    And more posts exist than the initial page size
    When the user scrolls to the bottom of the post list
    And the network request fails
    Then the user should see an error message
    And the user should be able to retry loading more posts
