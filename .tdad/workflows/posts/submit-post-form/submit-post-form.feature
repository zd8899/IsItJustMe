Feature: Submit Post Form
  As a user
  I want to submit the post creation form
  So that my frustration is shared with the community

  # NOTE: Validation error messages from validations.ts:
  # - frustration: "Please describe your frustration", "Frustration must be less than 500 characters"
  # - identity: "Please describe who you are", "Identity must be less than 100 characters"
  # - categoryId: "Please select a category"
  # API error messages:
  # - "Category not found" (400)
  # - "Rate limit exceeded. Please try again later." (429)


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Submit post as anonymous user - success
    Given the database has been seeded with categories
    And a valid category exists
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with:
      | frustration | get a good night's sleep |
      | identity    | a new parent             |
      | categoryId  | <valid-category-id>      |
      | anonymousId | <generated-anonymous-id> |
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "frustration"
    And the response body should contain "identity"
    And the response body should contain "categoryId"
    And the response body should contain "anonymousId"
    And the response body should contain "createdAt"

  Scenario: [API] Submit post as logged-in user - success
    Given the database has been seeded with categories
    And a valid category exists
    And a user is authenticated with a valid token
    When the client sends POST request to "/api/posts" with valid data and auth token
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "userId"
    And the response body "anonymousId" should be null

  Scenario: [API] Submit post with missing frustration
    Given the database has been seeded with categories
    And a valid category exists
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with empty frustration
    Then the response status should be 400
    And the response error should be "Please describe your frustration"

  Scenario: [API] Submit post with missing identity
    Given the database has been seeded with categories
    And a valid category exists
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with empty identity
    Then the response status should be 400
    And the response error should be "Please describe who you are"

  Scenario: [API] Submit post with missing category
    Given an anonymous ID has been generated
    When the client sends POST request to "/api/posts" without categoryId
    Then the response status should be 400
    And the response error should be "Please select a category"

  Scenario: [API] Submit post with invalid category ID
    Given an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with a non-existent category ID
    Then the response status should be 400
    And the response error should be "Category not found"

  Scenario: [API] Submit post with frustration exceeding max length
    Given the database has been seeded with categories
    And a valid category exists
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with frustration over 500 characters
    Then the response status should be 400
    And the response error should be "Frustration must be less than 500 characters"

  Scenario: [API] Submit post with identity exceeding max length
    Given the database has been seeded with categories
    And a valid category exists
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with identity over 100 characters
    Then the response status should be 400
    And the response error should be "Identity must be less than 100 characters"

  Scenario: [API] Anonymous user rate limited after 5 posts per hour
    Given the database has been seeded with categories
    And a valid category exists
    And an anonymous user has already created 5 posts within the last hour
    When the client sends POST request to "/api/posts" with valid data
    Then the response status should be 429
    And the response error should be "Rate limit exceeded. Please try again later."

  Scenario: [API] Logged-in user rate limited after 20 posts per hour
    Given the database has been seeded with categories
    And a valid category exists
    And a user is authenticated with a valid token
    And the user has already created 20 posts within the last hour
    When the client sends POST request to "/api/posts" with valid data and auth token
    Then the response status should be 429
    And the response error should be "Rate limit exceeded. Please try again later."


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Successful post submission as anonymous user
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    When the user enters "get a good night's sleep" in the frustration field
    And the user enters "a new parent" in the identity field
    And the user selects "Parenting" from the category dropdown
    And the user clicks the "Ask" button
    Then the user should see a success message
    And the post creation form should be cleared
    And the new post should appear in the feed

  Scenario: [UI] Successful post submission as logged-in user
    Given the database has been seeded with categories
    And a user is logged in
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    When the user enters "find parking downtown" in the frustration field
    And the user enters "a commuter" in the identity field
    And the user selects "Daily Life" from the category dropdown
    And the user clicks the "Ask" button
    Then the user should see a success message
    And the post creation form should be cleared
    And the new post should appear in the feed

  Scenario: [UI] Form validation - empty frustration field
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    When the user leaves the frustration field empty
    And the user enters "a developer" in the identity field
    And the user selects "Technology" from the category dropdown
    And the user clicks the "Ask" button
    Then the user should see error message "Please describe your frustration"
    And the post should not be submitted

  Scenario: [UI] Form validation - empty identity field
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    When the user enters "debug this error" in the frustration field
    And the user leaves the identity field empty
    And the user selects "Technology" from the category dropdown
    And the user clicks the "Ask" button
    Then the user should see error message "Please describe who you are"
    And the post should not be submitted

  Scenario: [UI] Form validation - no category selected
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    When the user enters "stay focused" in the frustration field
    And the user enters "a remote worker" in the identity field
    And the user does not select a category
    And the user clicks the "Ask" button
    Then the user should see error message "Please select a category"
    And the post should not be submitted

  Scenario: [UI] Form shows loading state during submission
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    When the user enters "get a quick response" in the frustration field
    And the user enters "an impatient person" in the identity field
    And the user selects "Daily Life" from the category dropdown
    And the user clicks the "Ask" button
    Then the "Ask" button should show loading state
    And the form fields should be disabled during submission

  Scenario: [UI] Form clears after successful submission
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    When the user enters "find a good restaurant" in the frustration field
    And the user enters "a foodie" in the identity field
    And the user selects "Daily Life" from the category dropdown
    And the user clicks the "Ask" button
    And the submission is successful
    Then the frustration field should be empty
    And the identity field should be empty
    And the category dropdown should show placeholder "Select a category"

  Scenario: [UI] Form shows error when API fails
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    And the posts API returns an error
    When the user enters "make this work" in the frustration field
    And the user enters "a frustrated developer" in the identity field
    And the user selects "Technology" from the category dropdown
    And the user clicks the "Ask" button
    Then the user should see an error message
    And the form data should be preserved

  Scenario: [UI] Rate limit error displayed to user
    Given the database has been seeded with categories
    And the user is on the home page
    And the post creation form is displayed
    And the category dropdown is loaded
    And the anonymous user has exceeded the rate limit
    When the user enters "post more often" in the frustration field
    And the user enters "a frequent poster" in the identity field
    And the user selects "Social" from the category dropdown
    And the user clicks the "Ask" button
    Then the user should see error message "Rate limit exceeded. Please try again later."
