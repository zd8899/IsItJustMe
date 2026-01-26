Feature: Run Database Migration
  As a developer
  I want to execute Prisma migrations to create database tables
  So that the application can persist and retrieve data

  # NOTE: This feature validates that Prisma migrations successfully create
  # all required database tables as defined in the schema.


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Migration Execution ---
  Scenario: [API] Database migration creates User table
    Given the Prisma schema defines the User model
    When the database migration is executed
    Then the User table should exist in the database
    And the client sends POST request to "/api/trpc/user.register" with:
      | username | migrationtest |
      | password | testpass123   |
    And the response status should be 200

  Scenario: [API] Database migration creates Category table
    Given the Prisma schema defines the Category model
    When the database migration is executed
    Then the Category table should exist in the database
    And the client sends GET request to "/api/trpc/category.list"
    And the response status should be 200

  Scenario: [API] Database migration creates Post table
    Given the Prisma schema defines the Post model
    When the database migration is executed
    Then the Post table should exist in the database
    And the Post table has foreign key to Category table
    And the Post table has nullable foreign key to User table

  Scenario: [API] Database migration creates Comment table
    Given the Prisma schema defines the Comment model
    When the database migration is executed
    Then the Comment table should exist in the database
    And the Comment table has foreign key to Post table with cascade delete
    And the Comment table has nullable foreign key to User table
    And the Comment table has self-referencing foreign key for nested comments

  Scenario: [API] Database migration creates Vote table
    Given the Prisma schema defines the Vote model
    When the database migration is executed
    Then the Vote table should exist in the database
    And the Vote table has nullable foreign key to Post table with cascade delete
    And the Vote table has nullable foreign key to Comment table with cascade delete
    And the Vote table has nullable foreign key to User table

  # --- Index Verification ---
  Scenario: [API] Database migration creates required indexes on Post table
    Given the Prisma schema defines indexes on Post model
    When the database migration is executed
    Then the Post table should have index on categoryId
    And the Post table should have composite index on score and createdAt
    And the Post table should have index on createdAt

  Scenario: [API] Database migration creates required indexes on Comment table
    Given the Prisma schema defines indexes on Comment model
    When the database migration is executed
    Then the Comment table should have index on postId
    And the Comment table should have index on parentId

  Scenario: [API] Database migration creates required indexes on Vote table
    Given the Prisma schema defines indexes on Vote model
    When the database migration is executed
    Then the Vote table should have index on ipHash

  # --- Unique Constraints ---
  Scenario: [API] Database migration creates unique constraint on User username
    Given the Prisma schema defines unique constraint on User.username
    When the database migration is executed
    Then the User table should have unique constraint on username column

  Scenario: [API] Database migration creates unique constraints on Category
    Given the Prisma schema defines unique constraints on Category model
    When the database migration is executed
    Then the Category table should have unique constraint on name column
    And the Category table should have unique constraint on slug column

  Scenario: [API] Database migration creates composite unique constraints on Vote
    Given the Prisma schema defines composite unique constraints on Vote model
    When the database migration is executed
    Then the Vote table should have unique constraint on postId and userId
    And the Vote table should have unique constraint on postId and anonymousId
    And the Vote table should have unique constraint on commentId and userId
    And the Vote table should have unique constraint on commentId and anonymousId

  # --- Default Values ---
  Scenario: [API] Database migration applies default values to User model
    Given the Prisma schema defines default values on User model
    When the database migration is executed
    And a new user is created without specifying karma
    Then the user karma should default to 0
    And the user createdAt should be automatically set

  Scenario: [API] Database migration applies default values to Post model
    Given the Prisma schema defines default values on Post model
    When the database migration is executed
    And a new post is created without specifying vote counts
    Then the post upvotes should default to 0
    And the post downvotes should default to 0
    And the post score should default to 0
    And the post commentCount should default to 0

  Scenario: [API] Database migration applies default values to Comment model
    Given the Prisma schema defines default values on Comment model
    When the database migration is executed
    And a new comment is created without specifying vote counts
    Then the comment upvotes should default to 0
    And the comment downvotes should default to 0
    And the comment score should default to 0

  # --- Edge Cases ---
  Scenario: [API] Migration is idempotent when run multiple times
    Given the database migration has already been executed
    When the database migration is executed again
    Then no errors should occur
    And the existing data should remain intact

  Scenario: [API] Migration fails gracefully with invalid database connection
    Given the database connection string is invalid
    When the database migration is attempted
    Then the migration should fail with connection error
    And no partial schema changes should be applied
