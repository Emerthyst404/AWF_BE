/*
* FILE: likes.js
* PROJECT: AWF Backend Assignment
* DATE: 2026-06-02
* AUTHOR: Kalina Cathcart
* DESCRIPTION: This file defines the routes for handling likes on posts in the social media API.
*              It includes routes for getting all likes on a post, liking a post, and unliking a post.
*              Each route interacts with the SQLite database to perform the necessary operations 
*              and returns appropriate responses based on the success or failure of those operations.
*/

const express = require("express");



/*
* FUNCTION: getAllLikes
* PARAMETERS: database (Database) - the SQLite database instance
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing an array of all likes for the specified post
* DESCRIPTION: Retrieves all likes for a specific post from the database.
*              First checks if the post exists. If not, sends a 404 error.
*              If the post exists, retrieves all likes and sends them back as JSON.
*/
function getAllLikes(database, incomingMessage, responseMessage)
{

  // Check the post exists first
  const post = database.prepare(`SELECT id FROM posts WHERE id = ?`).get(incomingMessage.params.postId);

  // If no post was found send a 404 error
  if (!post)
  {

    responseMessage.status(404).json({ error: "Post not found" });

  }
  else
  {

    // Get all likes for this post
    const likes = database.prepare(`SELECT * FROM likes WHERE post_id = ? ORDER BY created_at ASC`).all(incomingMessage.params.postId);

    // Send the likes back as JSON
    responseMessage.json(likes);

  }

}

/*
* FUNCTION: likePost
* PARAMETERS: database (Database) - the SQLite database instance
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing the newly created like
* DESCRIPTION: Adds a like to a post for a specific user.
*              Checks if the post exists and if the user has already liked it.
*              If the post is not found, sends a 404 error.
*              If the user already liked the post, sends a 409 conflict error.
*              Otherwise, creates the like and sends it back as JSON.
*/
function likePost(database, incomingMessage, responseMessage)
{

  // Pull user_id out of the request body
  const { user_id } = incomingMessage.body;

  // Make sure user_id was provided
  if (!user_id)
  {

    responseMessage.status(400).json({ error: "user_id is required" });

  }
  else // If the user_id is there = check if the post exists and try to create the like
  {

    // Check the post exists first
    const post = database.prepare(`SELECT id FROM posts WHERE id = ?`).get(incomingMessage.params.postId);

    // If no post was found send a 404 error
    if (!post)
    {

      responseMessage.status(404).json({ error: "Post not found" });

    }
    else
    {

      // Try to insert the like — the UNIQUE constraint will stop duplicate likes
      try
      {

        const result = database.prepare(`INSERT INTO likes (post_id, user_id) VALUES (?, ?)`).run(incomingMessage.params.postId, user_id);

        // Fetch the newly created like so we can send it back
        const like = database.prepare(`SELECT * FROM likes WHERE id = ?`).get(result.lastInsertRowid);

        // Send back the new like with a 201 Created status
        responseMessage.status(201).json(like);

      }
      catch (err)
      {

        // If the user already liked this post = the database throws a UNIQUE error
        if (err.message.includes("UNIQUE constraint failed"))
        {

          responseMessage.status(409).json({ error: "User has already liked this post" });

        }
        else // If it was a different error = pass it along
        {

          throw err;

        }

      }

    }

  }

}

/*
* FUNCTION: unlikePost
* PARAMETERS: database (Database) - the SQLite database instance
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: 204 No Content response on success
* DESCRIPTION: Removes a like from a post for a specific user.
*              If the like is not found, sends a 404 error.
*              Otherwise, deletes the like and sends back a 204 No Content response.
*/
function unlikePost(database, incomingMessage, responseMessage)
{

  // Pull user_id out of the request body
  const { user_id } = incomingMessage.body;

  // Make sure user_id was provided 
  if (!user_id)
  {

    responseMessage.status(400).json({ error: "user_id is required" });

  }
  else // If the user_id is there = check if the like exists and delete it
  {

    // Check if the like exists
    const like = database.prepare(`SELECT * FROM likes WHERE post_id = ? AND user_id = ?`).get(incomingMessage.params.postId, user_id);

    // If the like was not found = send a 404 error
    if (!like)
    {

      responseMessage.status(404).json({ error: "Like not found" });

    }
    else // If the like exists = delete it
    {

      // Delete the like from the database
      database.prepare(`DELETE FROM likes WHERE post_id = ? AND user_id = ?`).run(incomingMessage.params.postId, user_id);

      // Send back a 204 No Content (success, nothing to return)
      responseMessage.status(204).send();

    }

  }

}



/*
* FUNCTION: likesRouter
* PARAMETERS: database (Database) - the SQLite database instance
* RETURN: Express Router instance
* DESCRIPTION: Sets up the Express Router for handling like-related routes.
*              Each route is connected to its corresponding handler function,
*              and the database instance is passed to each handler.
*/
function likesRouter(database)
{

  // mergeParams lets us access :postId from the parent route in app.js
  const router = express.Router({ mergeParams: true });

  // Each route calls its matching function and passes database, incomingMessage, responseMessage
  router.get("/", (incomingMessage, responseMessage) => getAllLikes(database, incomingMessage, responseMessage));
  router.post("/", (incomingMessage, responseMessage) => likePost(database, incomingMessage, responseMessage));
  router.delete("/", (incomingMessage, responseMessage) => unlikePost(database, incomingMessage, responseMessage));

  return router;

}

module.exports = { likesRouter };