-- Seed default categories for all existing users
-- Run this script to insert default categories for all users in your database

-- Option 1: Insert categories for a specific user (replace USER_ID_HERE with actual user ID)
-- SELECT insert_default_categories('USER_ID_HERE');

-- Option 2: Insert categories for all existing users
SELECT seed_categories_for_all_users();

-- To insert categories for a specific user, you can also run:
-- SELECT insert_default_categories('your-user-uuid-here');
