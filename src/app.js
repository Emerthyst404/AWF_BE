/*
* FILE: app.js
* PROJECT: AWF Backend Assignment 
* DATE: 2026-06-01
* AUTHOR: Kalina Cathcart
* DESCRIPTION: Main application file for setting up the Express app and connecting routes.
*/




const express = require("express");                     // Import the Express framework for building the web server
const { postsRouter } = require("./routes/posts");      // Import the posts router to handle routes related to posts
const { repliesRouter } = require("./routes/replies");  // Import the replies router to handle routes related to replies
const { likesRouter } = require("./routes/likes");      // Import the likes router to handle routes related to likes


/*
* FUNCTION: createApp
* PARAMETERS: db (Database) - the SQLite database instance
* RETURN: Express app instance
* DESCRIPTION: Sets up the Express app and connects the routes.
*/
function createApp(database) 
{

  // Create the express app
  const app = express();

  // This lets the app read JSON from request bodies
  app.use(express.json());

  // Connect each route file to a URL path
  app.use("/posts", postsRouter(database));
  app.use("/posts/:postId/replies", repliesRouter(database));
  app.use("/posts/:postId/likes", likesRouter(database));

  // If no route matched, send a 404 error
  app.use((incomingMessage, responseMessage) => {
    responseMessage.status(404).json({ error: "Route not found" });
  });

  // If something crashed, send a 500 error
  app.use((err, incomingMessage, responseMessage, next) => {
    console.error(err);
    responseMessage.status(500).json({ error: "Internal server error" });
  });

  return app;

}

module.exports = { createApp };