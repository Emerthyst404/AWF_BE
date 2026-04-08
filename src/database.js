/*
* FILE: database.js
* PROJECT: AWF Backend Assignment 
* DATE: 2026-06-01
* AUTHOR: Kalina Cathcart
* DESCRIPTION: Database initialization and table creation. 
*              This module sets up the SQLite database using the better-sqlite3 library, configures performance and integrity settings, 
*              and ensures that the necessary tables for posts, replies, and likes are created if they do not already exist.
*/


const Database = require("better-sqlite3");
const path = require("path");

/*
* FUNCTION: createDb
* PARAMETERS: dbPath (string) - optional path to the database file
* RETURN: Database instance
* DESCRIPTION: Initializes the SQLite database, sets pragmas for performance and integrity, and creates the necessary tables for posts, replies, and likes if they do not already exist.
*/
function createDb(dbPath) 
{

  // If no path is given, use the default data folder
  if (!dbPath) 
  {

    dbPath = path.join(__dirname, "../data/social.db");

  }


  const database = new Database(dbPath);      // Create or open the database at the specified path

  database.pragma("journal_mode = WAL");      // Enable Write-Ahead Logging for better concurrency
  database.pragma("foreign_keys = ON");       // Enable foreign key constraints for data integrity

  // Create tables if they do not exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   TEXT    NOT NULL,
      content   TEXT    NOT NULL,
      created_at TEXT   NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT   NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS replies (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id   TEXT    NOT NULL,
      content   TEXT    NOT NULL,
      created_at TEXT   NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT   NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS likes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id   TEXT    NOT NULL,
      created_at TEXT   NOT NULL DEFAULT (datetime('now')),
      UNIQUE(post_id, user_id)
    );
  `);

  return database;

}

module.exports = { createDb }; // Export the createDb function for use in other parts of the application