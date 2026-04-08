/*
 * PROJECT: AWF Backend Assignment 
 * DATE: 2026-06-02
 * AUTHOR: Kalina Cathcart
 * DESCRIPTION: This file defines the routes for handling replies to posts in the social media API. 
 *              It includes routes for getting all replies to a post, creating a new reply, editing an existing reply, and deleting a reply.
 *              Each route interacts with the SQLite database to perform the necessary operations and returns appropriate responses based on the success or failure of those operations.
 */


const express = require("express");


/*
* FUNCTION: getAllReplies
* PARAMETERS: database (Database) - the SQLite database instance, 
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing an array of all replies for the specified post
* DESCRIPTION: Retrieves all replies for a specific post from the database. 
*              First, it checks if the post exists. If the post is not found, it sends a 404 error response. 
*              If the post exists, it retrieves all replies associated with that post, ordered by creation date in ascending order, and sends them back as a JSON response.
*/
function getAllReplies(database, incomingMessage, responseMessage) 
{

  // Check the post exists
  const post = database.prepare(`SELECT id FROM posts WHERE id = ?`).get(incomingMessage.params.postId);


  // If no post was found = send a 404 error
  if (!post) 
  {

    responseMessage.status(404).json({ error: "Post not found" });

  } 
  else // If the post exists = get the replies and send them back
  {

    // Get all replies for this post
    const replies = database.prepare(`SELECT * FROM replies WHERE post_id = ? ORDER BY created_at ASC`).all(incomingMessage.params.postId);

    // Send the replies back as JSON
    responseMessage.json(replies);

  }

}


/*
* FUNCTION: createReply
* PARAMETERS: database (Database) - the SQLite database instance,
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing the newly created reply
* DESCRIPTION: Creates a new reply for a specific post in the database.
*              It first checks if the required fields (user_id and content) are provided in the request body. If not, it sends a 400 error response.
*              Then, it checks if the specified post exists. If the post is not found, it sends a 404 error response.
*              If the post exists, it inserts the new reply into the database, retrieves the newly created reply, and sends it back as a JSON response with a 201 Created status.
*/
function createReply(database, incomingMessage, responseMessage) 
{

  // Pull user_id and content out of the incoming request body
  const { user_id, content } = incomingMessage.body;


  // Make sure both fields were provided
  if (!user_id || !content) 
  {

    responseMessage.status(400).json({ error: "user_id and content are required" });

  } 
  else // If the required fields are there, check if the post exists and create the reply
  {

    // Check the post exists first
    const post = database.prepare(`SELECT id FROM posts WHERE id = ?`).get(incomingMessage.params.postId);

    // If no post was found = send a 404 error
    if (!post) 
    {

      responseMessage.status(404).json({ error: "Post not found" });

    } 
    else // If the post exists = insert the new reply and send it back
    {

      // Insert the new reply into the database
      const result = database.prepare(`INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)`).run(incomingMessage.params.postId, user_id, content);

      // Fetch the newly created reply so we can send it back
      const reply = database.prepare(`SELECT * FROM replies WHERE id = ?`).get(result.lastInsertRowid);

      // Send back the new reply with a 201 Created status
      responseMessage.status(201).json(reply);

    }

  }

}

// PATCH /posts/:postId/replies/:replyId — edit an existing reply
/*
* FUNCTION: editReply
* PARAMETERS: database (Database) - the SQLite database instance,
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing the updated reply
* DESCRIPTION: Edits an existing reply in the database. The user can only edit their own replies.
*              It first checks if the new content is provided in the request body. If not, it sends a 400 error response.
*              Then, it checks if the specified reply exists and is associated with the specified post. If the reply is not found, it sends a 404 error response.
*              Next, it checks if the user_id in the request body matches the user_id of the reply. If they do not match, it sends a 403 error response to prevent users from editing other users' replies.
*              If the reply exists and belongs to the user, it updates the reply content and the updated_at timestamp in the database, retrieves the updated reply, and sends it back as a JSON response.
*/
function editReply(database, incomingMessage, responseMessage) 
{

  // Pull content and user_id out of the incoming request body
  const { content, user_id } = incomingMessage.body;

  // Make sure new content was provided
  if (!content) 
  { 

    responseMessage.status(400).json({ error: "content is required" });

  }
  else // If the new content is there = find the reply and check permissions
  {

    // Find the reply in the database first
    const reply = database.prepare(`SELECT * FROM replies WHERE id = ? AND post_id = ?`).get(incomingMessage.params.replyId, incomingMessage.params.postId);


    // If no reply was found = send a 404 error
    if (!reply) 
    {

      responseMessage.status(404).json({ error: "Reply not found" });

    } 
    else if (user_id && reply.user_id !== user_id) // If user_id is provided and doesn't match the reply's user_id = forbid the edit
    {

      responseMessage.status(403).json({ error: "Cannot edit another user's reply" });

    } 
    else // If the reply exists and belongs to the user (or no user_id provided) = update the reply
    {

      // Update the reply content and the updated_at timestamp
      database.prepare(`UPDATE replies SET content = ?, updated_at = datetime('now') WHERE id = ?`).run(content, incomingMessage.params.replyId);

      // Fetch the updated reply and send it back
      const updated = database.prepare(`SELECT * FROM replies WHERE id = ?`).get(incomingMessage.params.replyId);

      responseMessage.json(updated);

    }

  }

}


/*
 * FUNCTION: deleteReply
 * PARAMETERS: database (Database) - the SQLite database instance,
 *             incomingMessage - the Express request object
 *             responseMessage - the Express response object
 * RETURN: JSON response indicating success or failure of the delete operation
 * DESCRIPTION: Deletes a specific reply from the database. 
 *              It first checks if the reply exists and is associated with the specified post. If the reply is not found, it sends a 404 error response.
 *              Then, it checks if the user_id in the request body matches the user_id of the reply. If they do not match, it sends a 403 error response to prevent users from deleting other users' replies.
 *              If the reply exists and belongs to the user, it deletes the reply from the database and sends back a 204 No Content status to indicate successful deletion without returning any content.
 */
function deleteReply(database, incomingMessage, responseMessage) 
{

  const { user_id } = incomingMessage.body;

  // Find the reply in the database first
  const reply = database.prepare(`SELECT * FROM replies WHERE id = ? AND post_id = ?`).get(incomingMessage.params.replyId, incomingMessage.params.postId);


  // If no reply was found send a 404 error
  if (!reply) 
  {

    responseMessage.status(404).json({ error: "Reply not found" });

  // If a different user is trying to delete send a 403 forbidden error
  } 
  else if (user_id && reply.user_id !== user_id) 
  {

    responseMessage.status(403).json({ error: "Cannot delete another user's reply" });

  } 
  else 
  {

    // Delete the reply from the database
    database.prepare(`
      DELETE FROM replies WHERE id = ?
    `).run(incomingMessage.params.replyId);

    // Send back a 204 No Content (success, nothing to return)
    responseMessage.status(204).send();

  }

}


/*
* FUNCTION: repliesRouter
* PARAMETERS: database (Database) - the SQLite database instance
* RETURN: Express router instance
* DESCRIPTION: Sets up the routes for handling replies in the social media API.
*/
function repliesRouter(database) 
{

  // mergeParams lets us access :postId from the parent route in app.js
  const router = express.Router({ mergeParams: true });

  // Each route calls its matching function and passes database, incomingMessage, responseMessage
  router.get("/", (incomingMessage, responseMessage) => getAllReplies(database, incomingMessage, responseMessage));
  router.post("/", (incomingMessage, responseMessage) => createReply(database, incomingMessage, responseMessage));
  router.patch("/:replyId", (incomingMessage, responseMessage) => editReply(database, incomingMessage, responseMessage));
  router.delete("/:replyId", (incomingMessage, responseMessage) => deleteReply(database, incomingMessage, responseMessage));

  return router;

}

module.exports = { repliesRouter };