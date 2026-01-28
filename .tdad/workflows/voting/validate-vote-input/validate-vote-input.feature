Feature: Validate Vote Input
  As a user
  I want the system to validate my vote input
  So that only valid votes are recorded in the system

  # NOTE: Valid vote values are +1 (upvote) or -1 (downvote) only


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Valid upvote value accepted for post
    Given a post exists in the system
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the vote should be recorded with value 1

  Scenario: [API] Valid downvote value accepted for post
    Given a post exists in the system
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the vote should be recorded with value -1

  Scenario: [API] Valid upvote value accepted for comment
    Given a comment exists in the system
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the vote should be recorded with value 1

  Scenario: [API] Valid downvote value accepted for comment
    Given a comment exists in the system
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the vote should be recorded with value -1

  Scenario: [API] Invalid vote value too high rejected for post
    Given a post exists in the system
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 2
    Then the response status should be 400
    And the response error should be "Number must be less than or equal to 1"

  Scenario: [API] Invalid vote value too low rejected for post
    Given a post exists in the system
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -2
    Then the response status should be 400
    And the response error should be "Number must be greater than or equal to -1"

  Scenario: [API] Invalid vote value too high rejected for comment
    Given a comment exists in the system
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 2
    Then the response status should be 400
    And the response error should be "Number must be less than or equal to 1"

  Scenario: [API] Invalid vote value too low rejected for comment
    Given a comment exists in the system
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -2
    Then the response status should be 400
    And the response error should be "Number must be greater than or equal to -1"

  Scenario: [API] Missing vote value rejected for post
    Given a post exists in the system
    When the client sends POST request to "/api/trpc/vote.castPostVote" without value
    Then the response status should be 400
    And the response error should be "Required"

  Scenario: [API] Non-numeric vote value rejected for post
    Given a post exists in the system
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value "invalid"
    Then the response status should be 400
    And the response error should be "Expected number, received string"
