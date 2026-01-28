Feature: Check Existing Vote
  As a user
  I want the system to check if I have already voted on a post or comment
  So that my vote can be properly created or updated

  # NOTE: Users can be identified by userId (registered) or anonymousId (anonymous)
  # Unique constraints: [postId, userId], [postId, anonymousId], [commentId, userId], [commentId, anonymousId]


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Find existing upvote by registered user on post
    Given a post exists in the system
    And the user is logged in
    And the user has previously upvoted the post with value 1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the response should indicate the existing vote

  Scenario: [API] Find existing downvote by registered user on post
    Given a post exists in the system
    And the user is logged in
    And the user has previously downvoted the post with value -1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the response should indicate the existing vote

  Scenario: [API] Find existing vote by anonymous user on post
    Given a post exists in the system
    And the user has an anonymous session
    And the anonymous user has previously voted on the post with value 1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the response should indicate the existing vote

  Scenario: [API] Find existing vote by registered user on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has previously upvoted the comment with value 1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the response should indicate the existing vote

  Scenario: [API] Find existing vote by anonymous user on comment
    Given a comment exists in the system
    And the user has an anonymous session
    And the anonymous user has previously voted on the comment with value 1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the response should indicate the existing vote

  Scenario: [API] No existing vote found for registered user on post
    Given a post exists in the system
    And the user is logged in
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And a new vote should be created

  Scenario: [API] No existing vote found for anonymous user on post
    Given a post exists in the system
    And the user has an anonymous session
    And the anonymous user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And a new vote should be created

  Scenario: [API] No existing vote found for registered user on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And a new vote should be created

  Scenario: [API] No existing vote found for anonymous user on comment
    Given a comment exists in the system
    And the user has an anonymous session
    And the anonymous user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And a new vote should be created

  Scenario: [API] Check vote on non-existent post
    Given a post does not exist with id "non-existent-id"
    When the client sends POST request to "/api/trpc/vote.castPostVote" with postId "non-existent-id" and value 1
    Then the response status should be 404
    And the response error should be "Post not found"

  Scenario: [API] Check vote on non-existent comment
    Given a comment does not exist with id "non-existent-id"
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with commentId "non-existent-id" and value 1
    Then the response status should be 404
    And the response error should be "Comment not found"
