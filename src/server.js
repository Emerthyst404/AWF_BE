/*
* FILE: server.js
* PROJECT: AWF Backend Assignment
* DATE: 2026-06-01
* AUTHOR: Kalina Cathcart
* DESCRIPTION: Entry point for the Express server.
*/


const path = require("path");                // Import the path module for handling file paths
const fs = require("fs");                    // Import the file system module for checking and creating directories   
const { createDb } = require("./database");  // Import the createDb function to set up the database
const { createApp } = require("./app");      // Import the createApp function to set up the Express app

// Create the data folder if it doesn't already exist
const DATA_DIR = path.join(__dirname, "../data");

// IF the data directory doesn't exist, create it. 
if (!fs.existsSync(DATA_DIR)) 
{

  fs.mkdirSync(DATA_DIR);

}

// Set up the database and the app
const database = createDb();
const app = createApp(database);

// Use port 3000 unless another port is specified
const PORT = process.env.PORT || 3000;

// Start listening for requests
app.listen(PORT, () => { console.log(`Social API running on http://localhost:${PORT}`);});