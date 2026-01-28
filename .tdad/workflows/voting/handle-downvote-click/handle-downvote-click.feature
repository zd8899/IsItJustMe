Feature: Handle Downvote Click
  As a user
  I want to click the downvote button on posts and comments
  So that I can express that I do not relate to the content

  # NOTE: Clicking downvote when already downvoted removes the vote (toggle behavior)
  # Vote value: -1 for downvote
  # API endpoints: /api/trpc/vote.castPostVote, /api/trpc/vote.castCommentVote


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Downvote on Post ---
  Scenario: [API] Downvote post successfully as logged-in user
    Given a user is logged in
    And a post exists with score 5
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the response body should contain the updated vote state

  Scenario: [API] Downvote post successfully as anonymous user
    Given an anonymous user has a session
    And a post exists with score 10
    And the anonymous user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the response body should contain the updated vote state

  Scenario: [API] Remove downvote from post when clicking downvote again
    Given a user is logged in
    And a post exists with score 3
    And the user has previously downvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the vote should be removed
    And the post score should increase by 1

  Scenario: [API] Change upvote to downvote on post
    Given a user is logged in
    And a post exists with score 5
    And the user has previously upvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post score should decrease by 2

  # --- Downvote on Comment ---
  Scenario: [API] Downvote comment successfully as logged-in user
    Given a user is logged in
    And a comment exists with score 3
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the response body should contain the updated vote state

  Scenario: [API] Downvote comment successfully as anonymous user
    Given an anonymous user has a session
    And a comment exists with score 5
    And the anonymous user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the response body should contain the updated vote state

  Scenario: [API] Remove downvote from comment when clicking downvote again
    Given a user is logged in
    And a comment exists with score 2
    And the user has previously downvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the vote should be removed
    And the comment score should increase by 1

  Scenario: [API] Change upvote to downvote on comment
    Given a user is logged in
    And a comment exists with score 4
    And the user has previously upvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment score should decrease by 2


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  # --- Downvote on Post in Feed ---
  Scenario: [UI] User downvotes a post in the feed
    Given the user is on the home page
    And there is at least one post in the feed
    And the user has not voted on the post
    When the user clicks the downvote arrow on the post
    Then the downvote arrow should become active
    And the vote count should decrease by 1

  Scenario: [UI] User removes downvote by clicking downvote again on post
    Given the user is on the home page
    And there is at least one post in the feed
    And the user has previously downvoted the post
    And the downvote arrow is in active state
    When the user clicks the downvote arrow on the post
    Then the downvote arrow should return to neutral state
    And the vote count should increase by 1

  Scenario: [UI] User switches from upvote to downvote on post
    Given the user is on the home page
    And there is at least one post in the feed
    And the user has previously upvoted the post
    And the upvote arrow is in active state
    When the user clicks the downvote arrow on the post
    Then the upvote arrow should return to neutral state
    And the downvote arrow should become active
    And the vote count should decrease by 2

  # --- Downvote on Post Detail Page ---
  Scenario: [UI] User downvotes a post on detail page
    Given the user is viewing a post detail page
    And the user has not voted on the post
    When the user clicks the downvote arrow on the post
    Then the downvote arrow should become active
    And the vote count should decrease by 1

  # --- Downvote on Comment ---
  Scenario: [UI] User downvotes a comment
    Given the user is viewing a post detail page
    And the post has at least one comment
    And the user has not voted on the comment
    When the user clicks the downvote arrow on the comment
    Then the downvote arrow on the comment should become active
    And the comment vote count should decrease by 1

  Scenario: [UI] User removes downvote by clicking downvote again on comment
    Given the user is viewing a post detail page
    And the post has at least one comment
    And the user has previously downvoted the comment
    And the downvote arrow on the comment is in active state
    When the user clicks the downvote arrow on the comment
    Then the downvote arrow on the comment should return to neutral state
    And the comment vote count should increase by 1

  Scenario: [UI] User switches from upvote to downvote on comment
    Given the user is viewing a post detail page
    And the post has at least one comment
    And the user has previously upvoted the comment
    And the upvote arrow on the comment is in active state
    When the user clicks the downvote arrow on the comment
    Then the upvote arrow on the comment should return to neutral state
    And the downvote arrow on the comment should become active
    And the comment vote count should decrease by 2

  # --- Visual Feedback ---
  Scenario: [UI] Vote count updates optimistically when downvoting
    Given the user is on the home page
    And there is a post with vote count "5"
    And the user has not voted on the post
    When the user clicks the downvote arrow on the post
    Then the vote count should immediately display "4"
