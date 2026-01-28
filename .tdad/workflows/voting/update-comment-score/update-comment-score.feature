Feature: Update Comment Score
  As a system
  I want to recalculate comment vote totals after voting actions
  So that comment scores accurately reflect the current votes

  # NOTE: Score = upvotes - downvotes
  # Vote counts and score are updated atomically with vote record changes


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Score Calculation After New Vote ---
  Scenario: [API] Comment score increases after new upvote
    Given a comment exists with score 0, upvotes 0, downvotes 0
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment upvotes should be 1
    And the comment downvotes should be 0
    And the comment score should be 1

  Scenario: [API] Comment score decreases after new downvote
    Given a comment exists with score 0, upvotes 0, downvotes 0
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment upvotes should be 0
    And the comment downvotes should be 1
    And the comment score should be -1

  # --- Score Calculation After Vote Direction Change ---
  Scenario: [API] Comment score decreases by 2 when upvote changes to downvote
    Given a comment exists with score 5, upvotes 7, downvotes 2
    And the user is logged in
    And the user has previously upvoted the comment with value 1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment upvotes should be 6
    And the comment downvotes should be 3
    And the comment score should be 3

  Scenario: [API] Comment score increases by 2 when downvote changes to upvote
    Given a comment exists with score -3, upvotes 2, downvotes 5
    And the user is logged in
    And the user has previously downvoted the comment with value -1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment upvotes should be 3
    And the comment downvotes should be 4
    And the comment score should be -1

  # --- Score Calculation After Vote Removal ---
  Scenario: [API] Comment score decreases when upvote is removed
    Given a comment exists with score 10, upvotes 12, downvotes 2
    And the user is logged in
    And the user has previously upvoted the comment with value 1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment upvotes should be 11
    And the comment downvotes should be 2
    And the comment score should be 9

  Scenario: [API] Comment score increases when downvote is removed
    Given a comment exists with score -5, upvotes 3, downvotes 8
    And the user is logged in
    And the user has previously downvoted the comment with value -1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment upvotes should be 3
    And the comment downvotes should be 7
    And the comment score should be -4

  # --- Anonymous User Score Updates ---
  Scenario: [API] Comment score updates correctly for anonymous upvote
    Given a comment exists with score 3, upvotes 5, downvotes 2
    And the user has an anonymous session
    And the anonymous user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment upvotes should be 6
    And the comment downvotes should be 2
    And the comment score should be 4

  Scenario: [API] Comment score updates correctly for anonymous downvote
    Given a comment exists with score 3, upvotes 5, downvotes 2
    And the user has an anonymous session
    And the anonymous user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment upvotes should be 5
    And the comment downvotes should be 3
    And the comment score should be 2

  # --- Edge Cases ---
  Scenario: [API] Comment score can become negative
    Given a comment exists with score 0, upvotes 0, downvotes 0
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment score should be -1

  Scenario: [API] Comment upvotes count never goes below zero
    Given a comment exists with score 0, upvotes 0, downvotes 0
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment upvotes should be 0

  Scenario: [API] Comment downvotes count never goes below zero
    Given a comment exists with score 0, upvotes 0, downvotes 0
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment downvotes should be 0
