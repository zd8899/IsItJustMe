Feature: Create Prisma Schema
  As a developer
  I want to define database models in schema.prisma
  So that the application can persist and retrieve data correctly

  # NOTE: This feature validates that the Prisma schema correctly defines
  # all required models with proper fields, relations, and constraints.


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- User Model ---
  Scenario: [API] Create user with required fields
    Given the database schema is migrated
    When the client sends POST request to "/api/trpc/user.register" with:
      | username | testuser   |
      | password | secret123  |
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "username"
    And the response body should contain "karma"

  Scenario: [API] User username must be unique
    Given the user exists with username "existinguser"
    When the client sends POST request to "/api/trpc/user.register" with username "existinguser"
    Then the response status should be 400
    And the response error should be "Username already taken"

  # --- Category Model ---
  Scenario: [API] List all categories
    Given the database is seeded with categories
    When the client sends GET request to "/api/trpc/category.list"
    Then the response status should be 200
    And the response body should contain categories with "id", "name", and "slug"

  Scenario: [API] Category name and slug must be unique
    Given the category exists with name "Work" and slug "work"
    When the client attempts to create category with name "Work"
    Then the response status should be 400
    And the response error should be "Category already exists"

  # --- Post Model ---
  Scenario: [API] Create anonymous post with required fields
    Given the database schema is migrated
    And the category exists with slug "work"
    When the client sends POST request to "/api/trpc/post.create" with:
      | frustration | find a good work-life balance |
      | identity    | a software developer          |
      | categoryId  | {category_id}                 |
      | anonymousId | anon-uuid-123                 |
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "frustration"
    And the response body should contain "identity"
    And the response body should contain "upvotes" with value 0
    And the response body should contain "downvotes" with value 0
    And the response body should contain "score" with value 0
    And the response body should contain "commentCount" with value 0

  Scenario: [API] Create post with user association
    Given the user exists with username "testuser"
    And the category exists with slug "technology"
    When the client sends authenticated POST request to "/api/trpc/post.create" with:
      | frustration | understand async/await |
      | identity    | a junior developer     |
      | categoryId  | {category_id}          |
    Then the response status should be 200
    And the response body should contain "userId"
    And the response body should contain "user" with "username"

  Scenario: [API] Post must have valid category reference
    Given the database schema is migrated
    When the client sends POST request to "/api/trpc/post.create" with invalid categoryId
    Then the response status should be 400
    And the response error should be "Invalid category"

  Scenario: [API] Get post by ID with category relation
    Given the post exists with id "post-123"
    When the client sends GET request to "/api/trpc/post.getById" with id "post-123"
    Then the response status should be 200
    And the response body should contain "category" with "name" and "slug"

  # --- Comment Model ---
  Scenario: [API] Create comment on post
    Given the post exists with id "post-123"
    When the client sends POST request to "/api/trpc/comment.create" with:
      | content     | I totally relate to this!    |
      | postId      | post-123                     |
      | anonymousId | anon-uuid-456                |
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "content"
    And the response body should contain "postId"
    And the response body should contain "upvotes" with value 0
    And the response body should contain "downvotes" with value 0
    And the response body should contain "score" with value 0

  Scenario: [API] Create nested comment reply
    Given the post exists with id "post-123"
    And the comment exists with id "comment-456" on post "post-123"
    When the client sends POST request to "/api/trpc/comment.create" with:
      | content     | Great point!   |
      | postId      | post-123       |
      | parentId    | comment-456    |
      | anonymousId | anon-uuid-789  |
    Then the response status should be 200
    And the response body should contain "parentId" with value "comment-456"

  Scenario: [API] Comment must reference valid post
    Given the database schema is migrated
    When the client sends POST request to "/api/trpc/comment.create" with invalid postId
    Then the response status should be 400
    And the response error should be "Post not found"

  Scenario: [API] Deleting post cascades to comments
    Given the post exists with id "post-123"
    And the comment exists with id "comment-456" on post "post-123"
    When the admin deletes post with id "post-123"
    Then the comment with id "comment-456" should not exist

  # --- Vote Model ---
  Scenario: [API] Cast upvote on post
    Given the post exists with id "post-123"
    When the client sends POST request to "/api/trpc/vote.castPostVote" with:
      | postId      | post-123      |
      | value       | 1             |
      | anonymousId | anon-uuid-111 |
    Then the response status should be 200
    And the post "post-123" should have "upvotes" incremented by 1
    And the post "post-123" should have "score" incremented by 1

  Scenario: [API] Cast downvote on comment
    Given the post exists with id "post-123"
    And the comment exists with id "comment-456" on post "post-123"
    When the client sends POST request to "/api/trpc/vote.castCommentVote" with:
      | commentId   | comment-456   |
      | value       | -1            |
      | anonymousId | anon-uuid-222 |
    Then the response status should be 200
    And the comment "comment-456" should have "downvotes" incremented by 1
    And the comment "comment-456" should have "score" decremented by 1

  Scenario: [API] Prevent duplicate vote on post by same user
    Given the user exists with username "voter"
    And the post exists with id "post-123"
    And the user "voter" has already voted on post "post-123"
    When the client sends authenticated POST request to "/api/trpc/vote.castPostVote" with:
      | postId | post-123 |
      | value  | 1        |
    Then the response status should be 400
    And the response error should be "Already voted on this post"

  Scenario: [API] Prevent duplicate vote on post by same anonymous user
    Given the post exists with id "post-123"
    And anonymous user "anon-uuid-333" has already voted on post "post-123"
    When the client sends POST request to "/api/trpc/vote.castPostVote" with:
      | postId      | post-123      |
      | value       | 1             |
      | anonymousId | anon-uuid-333 |
    Then the response status should be 400
    And the response error should be "Already voted on this post"

  Scenario: [API] Deleting post cascades to votes
    Given the post exists with id "post-123"
    And the vote exists on post "post-123"
    When the admin deletes post with id "post-123"
    Then the vote on post "post-123" should not exist

  Scenario: [API] Deleting comment cascades to votes
    Given the post exists with id "post-123"
    And the comment exists with id "comment-456" on post "post-123"
    And the vote exists on comment "comment-456"
    When the admin deletes comment with id "comment-456"
    Then the vote on comment "comment-456" should not exist

  # --- Index Verification ---
  Scenario: [API] Query posts by category efficiently
    Given the category exists with slug "work"
    And multiple posts exist in category "work"
    When the client sends GET request to "/api/trpc/post.listByCategory" with categoryId
    Then the response status should be 200
    And the response should return posts filtered by category

  Scenario: [API] Query posts sorted by score and date
    Given multiple posts exist with different scores and dates
    When the client sends GET request to "/api/trpc/post.listHot"
    Then the response status should be 200
    And the posts should be sorted by hot score algorithm

  Scenario: [API] Query posts sorted by creation date
    Given multiple posts exist with different creation dates
    When the client sends GET request to "/api/trpc/post.listNew"
    Then the response status should be 200
    And the posts should be sorted by createdAt descending
