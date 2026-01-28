Feature: Fetch User Karma
  As a registered user
  I want to retrieve my karma score
  So that I can see my reputation in the community

  # NOTE: Karma is calculated as the sum of post votes + comment votes
  # The user.getKarma tRPC query returns the karma breakdown


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Get Karma Success
    Given the user is authenticated
    And the user has posts with total votes of 15
    And the user has comments with total votes of 10
    When the client sends GET request to "user.getKarma"
    Then the response status should be 200
    And the response body should contain "postKarma" with value 15
    And the response body should contain "commentKarma" with value 10
    And the response body should contain "totalKarma" with value 25

  Scenario: [API] Get Karma Success (Zero Karma)
    Given the user is authenticated
    And the user has no posts
    And the user has no comments
    When the client sends GET request to "user.getKarma"
    Then the response status should be 200
    And the response body should contain "postKarma" with value 0
    And the response body should contain "commentKarma" with value 0
    And the response body should contain "totalKarma" with value 0

  Scenario: [API] Get Karma Failure (Unauthenticated)
    Given the user is not authenticated
    When the client sends GET request to "user.getKarma"
    Then the response status should be 401
    And the response error should be "UNAUTHORIZED"

  Scenario: [API] Get Karma With Mixed Votes
    Given the user is authenticated
    And the user has posts with 20 upvotes and 5 downvotes
    And the user has comments with 8 upvotes and 3 downvotes
    When the client sends GET request to "user.getKarma"
    Then the response status should be 200
    And the response body should contain "postKarma" with value 15
    And the response body should contain "commentKarma" with value 5
    And the response body should contain "totalKarma" with value 20
