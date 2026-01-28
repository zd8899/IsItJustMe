Feature: Update User Karma
  As a system
  I want to adjust author karma when votes are cast on their content
  So that user reputation accurately reflects community appreciation

  # NOTE: Karma = sum of all upvotes - downvotes received on user's posts and comments
  # Only registered users (with userId) have karma tracked
  # Anonymous content has no author to credit karma to


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Karma Increase After Upvote on Post ---
  Scenario: [API] Author karma increases when their post receives an upvote
    Given a registered user exists with karma 0
    And the user has a post with score 0
    And another user is logged in
    And the other user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post author karma should be 1

  Scenario: [API] Author karma increases when their post receives an upvote from anonymous user
    Given a registered user exists with karma 10
    And the user has a post with score 5
    And a different user has an anonymous session
    And the anonymous user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post author karma should be 11

  # --- Karma Decrease After Downvote on Post ---
  Scenario: [API] Author karma decreases when their post receives a downvote
    Given a registered user exists with karma 10
    And the user has a post with score 5
    And another user is logged in
    And the other user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post author karma should be 9

  Scenario: [API] Author karma can become negative
    Given a registered user exists with karma 0
    And the user has a post with score 0
    And another user is logged in
    And the other user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post author karma should be -1

  # --- Karma Change After Vote Direction Change on Post ---
  Scenario: [API] Author karma decreases by 2 when upvote changes to downvote on post
    Given a registered user exists with karma 5
    And the user has a post with score 3
    And another user is logged in
    And the other user has previously upvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post author karma should be 3

  Scenario: [API] Author karma increases by 2 when downvote changes to upvote on post
    Given a registered user exists with karma 5
    And the user has a post with score 3
    And another user is logged in
    And the other user has previously downvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post author karma should be 7

  # --- Karma Change After Vote Removal on Post ---
  Scenario: [API] Author karma decreases when upvote is removed from post
    Given a registered user exists with karma 10
    And the user has a post with score 5
    And another user is logged in
    And the other user has previously upvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the post author karma should be 9

  Scenario: [API] Author karma increases when downvote is removed from post
    Given a registered user exists with karma 10
    And the user has a post with score 5
    And another user is logged in
    And the other user has previously downvoted the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the post author karma should be 11

  # --- Karma Increase After Upvote on Comment ---
  Scenario: [API] Author karma increases when their comment receives an upvote
    Given a registered user exists with karma 0
    And the user has a comment with score 0
    And another user is logged in
    And the other user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment author karma should be 1

  # --- Karma Decrease After Downvote on Comment ---
  Scenario: [API] Author karma decreases when their comment receives a downvote
    Given a registered user exists with karma 5
    And the user has a comment with score 2
    And another user is logged in
    And the other user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment author karma should be 4

  # --- Karma Change After Vote Direction Change on Comment ---
  Scenario: [API] Author karma decreases by 2 when upvote changes to downvote on comment
    Given a registered user exists with karma 10
    And the user has a comment with score 5
    And another user is logged in
    And the other user has previously upvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment author karma should be 8

  Scenario: [API] Author karma increases by 2 when downvote changes to upvote on comment
    Given a registered user exists with karma 10
    And the user has a comment with score 5
    And another user is logged in
    And the other user has previously downvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment author karma should be 12

  # --- Karma Change After Vote Removal on Comment ---
  Scenario: [API] Author karma decreases when upvote is removed from comment
    Given a registered user exists with karma 8
    And the user has a comment with score 4
    And another user is logged in
    And the other user has previously upvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the comment author karma should be 7

  Scenario: [API] Author karma increases when downvote is removed from comment
    Given a registered user exists with karma 8
    And the user has a comment with score 4
    And another user is logged in
    And the other user has previously downvoted the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the comment author karma should be 9

  # --- Anonymous Content Edge Cases ---
  Scenario: [API] No karma update when voting on anonymous post
    Given an anonymous post exists with score 0
    And a user is logged in
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And no user karma should be updated

  Scenario: [API] No karma update when voting on anonymous comment
    Given an anonymous comment exists with score 0
    And a user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And no user karma should be updated

  # --- Karma Verification via GET Request ---
  Scenario: [API] User karma is correctly returned in profile
    Given a registered user exists with karma 25
    When the client sends GET request to "/api/trpc/user.getKarma" for the user
    Then the response status should be 200
    And the response body should contain karma 25
