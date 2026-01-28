Feature: Update Post Score
  As a system
  I want to recalculate post vote totals after voting operations
  So that the post score accurately reflects all user votes

  # NOTE: Score = upvotes - downvotes
  # Score updates happen atomically with vote operations


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Score Calculation After New Vote ---
  Scenario: [API] Post score increases after new upvote
    Given a post exists with upvotes 0, downvotes 0, and score 0
    And the user is logged in
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post upvotes should be 1
    And the post downvotes should be 0
    And the post score should be 1

  Scenario: [API] Post score decreases after new downvote
    Given a post exists with upvotes 0, downvotes 0, and score 0
    And the user is logged in
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post upvotes should be 0
    And the post downvotes should be 1
    And the post score should be -1

  # --- Score Calculation After Vote Direction Change ---
  Scenario: [API] Post score decreases by 2 when upvote changes to downvote
    Given a post exists with upvotes 5, downvotes 2, and score 3
    And the user is logged in
    And the user has previously upvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post upvotes should be 4
    And the post downvotes should be 3
    And the post score should be 1

  Scenario: [API] Post score increases by 2 when downvote changes to upvote
    Given a post exists with upvotes 5, downvotes 2, and score 3
    And the user is logged in
    And the user has previously downvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post upvotes should be 6
    And the post downvotes should be 1
    And the post score should be 5

  # --- Score Calculation After Vote Removal ---
  Scenario: [API] Post score decreases when upvote is removed
    Given a post exists with upvotes 10, downvotes 3, and score 7
    And the user is logged in
    And the user has previously upvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post upvotes should be 9
    And the post downvotes should be 3
    And the post score should be 6

  Scenario: [API] Post score increases when downvote is removed
    Given a post exists with upvotes 10, downvotes 3, and score 7
    And the user is logged in
    And the user has previously downvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post upvotes should be 10
    And the post downvotes should be 2
    And the post score should be 8

  # --- Score Verification via GET Request ---
  Scenario: [API] Post score is correctly returned in post details
    Given a post exists with upvotes 15, downvotes 5, and score 10
    When the client sends GET request to "/api/trpc/post.getById" with the post id
    Then the response status should be 200
    And the response body should contain upvotes 15
    And the response body should contain downvotes 5
    And the response body should contain score 10

  # --- Anonymous User Score Updates ---
  Scenario: [API] Post score updates correctly for anonymous user vote
    Given a post exists with upvotes 3, downvotes 1, and score 2
    And the user has an anonymous session
    And the anonymous user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post upvotes should be 4
    And the post downvotes should be 1
    And the post score should be 3

  # NOTE: Comment score scenarios are defined in update-comment-score.feature

  # --- Edge Case: Score Handles Negative Values ---
  Scenario: [API] Post score correctly handles negative values
    Given a post exists with upvotes 2, downvotes 5, and score -3
    And the user is logged in
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post upvotes should be 2
    And the post downvotes should be 6
    And the post score should be -4
