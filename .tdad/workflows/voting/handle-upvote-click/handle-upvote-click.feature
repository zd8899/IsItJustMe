Feature: Handle Upvote Click
  As a user
  I want to click the upvote button on posts and comments
  So that I can express that I relate to the content

  # NOTE: Clicking upvote when already upvoted removes the vote (toggle behavior)
  # Vote value: +1 for upvote
  # Both anonymous and registered users can vote


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- New Upvote on Post ---
  Scenario: [API] Cast upvote on post successfully
    Given a post exists with score 0
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated post score 1

  Scenario: [API] Registered user casts upvote on post
    Given a registered user is logged in
    And a post exists with score 5
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated post score 6

  Scenario: [API] Anonymous user casts upvote on post
    Given an anonymous user has a session
    And a post exists with score 3
    And the anonymous user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated post score 4

  # --- Remove Upvote from Post (Toggle Off) ---
  Scenario: [API] Remove upvote from post by clicking upvote again
    Given a post exists with score 5
    And the user has previously upvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated post score 4
    And the user vote status should be null

  # --- Change Vote Direction on Post ---
  Scenario: [API] Change from downvote to upvote on post
    Given a post exists with score 3
    And the user has previously downvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated post score 5
    And the user vote status should be 1

  # --- New Upvote on Comment ---
  Scenario: [API] Cast upvote on comment successfully
    Given a comment exists with score 0
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated comment score 1

  Scenario: [API] Registered user casts upvote on comment
    Given a registered user is logged in
    And a comment exists with score 2
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated comment score 3

  # --- Remove Upvote from Comment (Toggle Off) ---
  Scenario: [API] Remove upvote from comment by clicking upvote again
    Given a comment exists with score 4
    And the user has previously upvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated comment score 3
    And the user vote status should be null

  # --- Change Vote Direction on Comment ---
  Scenario: [API] Change from downvote to upvote on comment
    Given a comment exists with score 2
    And the user has previously downvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the response body should contain the updated comment score 4
    And the user vote status should be 1

  # --- Rate Limiting ---
  Scenario: [API] Anonymous user rate limited on excessive upvotes
    Given an anonymous user has a session
    And the anonymous user has cast 30 votes in the last hour
    And a post exists with score 0
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 429
    And the response error should be "Rate limit exceeded"


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  # --- Upvote Post in Feed ---
  Scenario: [UI] Click upvote on post shows active state
    Given the user is on the home page
    And there is a post in the feed with score 0
    And the upvote arrow is in neutral state
    When the user clicks the upvote arrow on the post
    Then the upvote arrow should change to active state
    And the vote count should display "1"

  Scenario: [UI] Click upvote again removes upvote
    Given the user is on the home page
    And there is a post in the feed with score 1
    And the user has upvoted the post
    And the upvote arrow is in active state
    When the user clicks the upvote arrow on the post
    Then the upvote arrow should change to neutral state
    And the vote count should display "0"

  Scenario: [UI] Click upvote when downvoted switches vote
    Given the user is on the home page
    And there is a post in the feed with score -1
    And the user has downvoted the post
    And the downvote arrow is in active state
    When the user clicks the upvote arrow on the post
    Then the upvote arrow should change to active state
    And the downvote arrow should change to neutral state
    And the vote count should display "1"

  # --- Upvote Post on Detail Page ---
  Scenario: [UI] Click upvote on post detail page
    Given the user is viewing a post detail page
    And the post has score 5
    And the upvote arrow is in neutral state
    When the user clicks the upvote arrow on the post
    Then the upvote arrow should change to active state
    And the vote count should display "6"

  # --- Upvote Comment ---
  Scenario: [UI] Click upvote on comment shows active state
    Given the user is viewing a post detail page
    And the post has a comment with score 0
    And the comment upvote arrow is in neutral state
    When the user clicks the upvote arrow on the comment
    Then the comment upvote arrow should change to active state
    And the comment vote count should display "1"

  Scenario: [UI] Click upvote on comment again removes upvote
    Given the user is viewing a post detail page
    And the post has a comment with score 1
    And the user has upvoted the comment
    And the comment upvote arrow is in active state
    When the user clicks the upvote arrow on the comment
    Then the comment upvote arrow should change to neutral state
    And the comment vote count should display "0"

  Scenario: [UI] Click upvote on comment when downvoted switches vote
    Given the user is viewing a post detail page
    And the post has a comment with score -1
    And the user has downvoted the comment
    And the comment downvote arrow is in active state
    When the user clicks the upvote arrow on the comment
    Then the comment upvote arrow should change to active state
    And the comment downvote arrow should change to neutral state
    And the comment vote count should display "1"

  # --- Optimistic UI Update ---
  Scenario: [UI] Vote count updates immediately on click
    Given the user is on the home page
    And there is a post in the feed with score 10
    When the user clicks the upvote arrow on the post
    Then the vote count should immediately display "11"
    And the upvote arrow should immediately change to active state

  # --- Error Handling ---
  Scenario: [UI] Show error message when vote fails
    Given the user is on the home page
    And there is a post in the feed
    And the API returns an error for voting
    When the user clicks the upvote arrow on the post
    Then the user should see an error notification
    And the vote count should remain unchanged
    And the upvote arrow should remain in neutral state
