DROP TABLE IF EXISTS "user_info";

CREATE TABLE IF NOT EXISTS "shelter" (
    "id" PRIMARY KEY INT NOT NULL
);

CREATE TABLE IF NOT EXISTS "shelter_info" (
    "shelter_id" INT NOT NULL,
    "shelter_name" TEXT NOT NULL,

);

CREATE TABLE IF NOT EXISTS "user_info" (
    "user_id" INT NOT NULL,
    "user_name" TEXT NOT NULL,
);


ALTER TABLE "shelter_info" ADD FOREIGN KEY ("shelter_id") REFERENCES "universal" ("id") ON DELETE CASCADE;

