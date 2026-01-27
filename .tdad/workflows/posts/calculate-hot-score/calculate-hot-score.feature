Feature: Calculate Hot Score
  As the system
  I want to compute a ranking score for each post
  So that posts can be sorted by relevance in the hot feed

  # NOTE: Hot score formula combines vote difference (logarithmic) with time decay
  # Formula: sign * log10(max(|score|, 1)) + seconds_since_epoch / 45000
  # where score = upvotes - downvotes, epoch = 2024-01-01


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Calculate hot score for post with positive votes
    Given a post exists with 10 upvotes and 2 downvotes
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 200
    And the response body should contain "hotScore"
    And the hot score should be greater than 0

  Scenario: [API] Calculate hot score for post with zero votes
    Given a post exists with 0 upvotes and 0 downvotes
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 200
    And the response body should contain "hotScore"
    And the hot score should be based only on time factor

  Scenario: [API] Calculate hot score for post with negative votes
    Given a post exists with 2 upvotes and 10 downvotes
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 200
    And the response body should contain "hotScore"
    And the hot score vote component should be negative

  Scenario: [API] Calculate hot score for post with equal votes
    Given a post exists with 5 upvotes and 5 downvotes
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 200
    And the response body should contain "hotScore"
    And the hot score vote component should be zero

  Scenario: [API] Newer posts rank higher than older posts with same votes
    Given a post created now with 5 upvotes and 0 downvotes
    And a post created 1 hour ago with 5 upvotes and 0 downvotes
    When the client calculates hot scores for both posts
    Then the newer post should have a higher hot score than the older post

  Scenario: [API] Calculate hot score with missing upvotes field
    Given a post data without upvotes field
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 400
    And the response error should be "upvotes is required"

  Scenario: [API] Calculate hot score with missing downvotes field
    Given a post data without downvotes field
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 400
    And the response error should be "downvotes is required"

  Scenario: [API] Calculate hot score with missing createdAt field
    Given a post data without createdAt field
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 400
    And the response error should be "createdAt is required"

  Scenario: [API] Calculate hot score with negative upvotes value
    Given a post data with upvotes set to -1
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 400
    And the response error should be "upvotes must be a non-negative integer"

  Scenario: [API] Calculate hot score with negative downvotes value
    Given a post data with downvotes set to -1
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 400
    And the response error should be "downvotes must be a non-negative integer"

  Scenario: [API] Calculate hot score with invalid createdAt format
    Given a post data with createdAt set to "invalid-date"
    When the client sends POST request to "/api/posts/calculate-hot-score" with the post data
    Then the response status should be 400
    And the response error should be "createdAt must be a valid ISO date string"
