Feature: Create Vote Record
  As a user
  I want the system to create or update my vote in the database
  So that my voting intention is persisted and reflected in vote counts

  # NOTE: Vote values are +1 (upvote) or -1 (downvote)
  # Creates new vote if none exists, updates if changing direction, removes if same value


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- New Vote Creation ---
  Scenario: [API] Create new upvote by registered user on post
    Given a post exists in the system
    And the user is logged in
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And a new vote record should be created with value 1
    And the post upvotes count should increase by 1
    And the post score should increase by 1

  Scenario: [API] Create new downvote by registered user on post
    Given a post exists in the system
    And the user is logged in
    And the user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And a new vote record should be created with value -1
    And the post downvotes count should increase by 1
    And the post score should decrease by 1

  Scenario: [API] Create new upvote by anonymous user on post
    Given a post exists in the system
    And the user has an anonymous session
    And the anonymous user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And a new vote record should be created with value 1 and anonymousId
    And the post upvotes count should increase by 1
    And the post score should increase by 1

  Scenario: [API] Create new downvote by anonymous user on post
    Given a post exists in the system
    And the user has an anonymous session
    And the anonymous user has not voted on the post
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And a new vote record should be created with value -1 and anonymousId
    And the post downvotes count should increase by 1
    And the post score should decrease by 1

  Scenario: [API] Create new upvote by registered user on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And a new vote record should be created with value 1
    And the comment upvotes count should increase by 1
    And the comment score should increase by 1

  Scenario: [API] Create new downvote by registered user on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And a new vote record should be created with value -1
    And the comment downvotes count should increase by 1
    And the comment score should decrease by 1

  Scenario: [API] Create new upvote by anonymous user on comment
    Given a comment exists in the system
    And the user has an anonymous session
    And the anonymous user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And a new vote record should be created with value 1 and anonymousId
    And the comment upvotes count should increase by 1
    And the comment score should increase by 1

  Scenario: [API] Create new downvote by anonymous user on comment
    Given a comment exists in the system
    And the user has an anonymous session
    And the anonymous user has not voted on the comment
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And a new vote record should be created with value -1 and anonymousId
    And the comment downvotes count should increase by 1
    And the comment score should decrease by 1

  # --- Update Existing Vote (Change Direction) ---
  Scenario: [API] Change upvote to downvote on post
    Given a post exists in the system
    And the user is logged in
    And the user has previously upvoted the post with value 1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the vote record should be updated with value -1
    And the post upvotes count should decrease by 1
    And the post downvotes count should increase by 1
    And the post score should decrease by 2

  Scenario: [API] Change downvote to upvote on post
    Given a post exists in the system
    And the user is logged in
    And the user has previously downvoted the post with value -1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the vote record should be updated with value 1
    And the post downvotes count should decrease by 1
    And the post upvotes count should increase by 1
    And the post score should increase by 2

  Scenario: [API] Change upvote to downvote on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has previously upvoted the comment with value 1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the vote record should be updated with value -1
    And the comment upvotes count should decrease by 1
    And the comment downvotes count should increase by 1
    And the comment score should decrease by 2

  Scenario: [API] Change downvote to upvote on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has previously downvoted the comment with value -1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the vote record should be updated with value 1
    And the comment downvotes count should decrease by 1
    And the comment upvotes count should increase by 1
    And the comment score should increase by 2

  # --- Remove Vote (Same Value Again) ---
  Scenario: [API] Remove upvote by voting same value on post
    Given a post exists in the system
    And the user is logged in
    And the user has previously upvoted the post with value 1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the vote record should be deleted
    And the post upvotes count should decrease by 1
    And the post score should decrease by 1

  Scenario: [API] Remove downvote by voting same value on post
    Given a post exists in the system
    And the user is logged in
    And the user has previously downvoted the post with value -1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the vote record should be deleted
    And the post downvotes count should decrease by 1
    And the post score should increase by 1

  Scenario: [API] Remove upvote by voting same value on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has previously upvoted the comment with value 1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value 1
    Then the response status should be 200
    And the vote record should be deleted
    And the comment upvotes count should decrease by 1
    And the comment score should decrease by 1

  Scenario: [API] Remove downvote by voting same value on comment
    Given a comment exists in the system
    And the user is logged in
    And the user has previously downvoted the comment with value -1
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with value -1
    Then the response status should be 200
    And the vote record should be deleted
    And the comment downvotes count should decrease by 1
    And the comment score should increase by 1

  # --- Anonymous User Vote Changes ---
  Scenario: [API] Anonymous user changes upvote to downvote on post
    Given a post exists in the system
    And the user has an anonymous session
    And the anonymous user has previously voted on the post with value 1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value -1
    Then the response status should be 200
    And the vote record should be updated with value -1
    And the post upvotes count should decrease by 1
    And the post downvotes count should increase by 1
    And the post score should decrease by 2

  Scenario: [API] Anonymous user removes vote on post
    Given a post exists in the system
    And the user has an anonymous session
    And the anonymous user has previously voted on the post with value 1
    When the client sends POST request to "/api/trpc/vote.castPostVote" with value 1
    Then the response status should be 200
    And the vote record should be deleted
    And the post upvotes count should decrease by 1
    And the post score should decrease by 1
