-- This is an empty migration.

UPDATE "User" SET avatar = REPLACE(avatar, 'image/upload/v', 'image/upload/c_fill,h_64,w_64,q_auto:best/v') WHERE avatar IS NOT NULL;