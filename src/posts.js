/*
* FILE: posts.js
* PROJECT: AWF Backend Assignment
* DATE: 2026-06-01
* AUTHOR: Kalina Cathcart
* DESCRIPTION: This file defines the routes for handling posts in the social media API. 
*              It includes routes for getting all posts, getting a single post with its replies, creating a new post, editing an existing post, and deleting a post.
 *             Each route interacts with the SQLite database to perform the necessary operations and returns appropriate responses based on the success or failure of those operations.
*/


const express = require("express");



/*
* FUNCTION: getAllPosts
* PARAMETERS: database (Database) - the SQLite database instance
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing an array of all posts with their like counts
* DESCRIPTION: Retrieves all posts from the database along with their like counts, and sends them back as a JSON response. 
*              The posts are ordered by creation date in descending order.
*/
function getAllPosts(database, incomingMessage, responseMessage) 
{
    
  const posts = database.prepare(`
    SELECT p.*, COUNT(l.id) AS like_count
    FROM posts p
    LEFT JOIN likes l ON l.post_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();

  responseMessage.json(posts);

}


/*
* FUNCTION: getPostById
* PARAMETERS: database (Database) - the SQLite database instance
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing the post with its like count and an array of its replies
* DESCRIPTION: Retrieves a single post by its ID from the database, including its like count and all of its replies.
*              If the post is not found, sends a 404 error response. Otherwise, sends the post and its replies back as a JSON response.
*/
function getPostById(database, incomingMessage, responseMessage) 
{

  // incomingMessage.params.id is the number from the URL e.g. the 1 in /posts/1
  const post = database.prepare(`
    SELECT p.*, COUNT(l.id) AS like_count
    FROM posts p
    LEFT JOIN likes l ON l.post_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(incomingMessage.params.id);

  // If no post was found = send a 404 error
  if (!post) 
  {

    responseMessage.status(404).json({ error: "Post not found" });

  } 
  else 
  {

    // Get all replies for this post
    const replies = database.prepare(`SELECT * FROM replies WHERE post_id = ? ORDER BY created_at ASC`).all(incomingMessage.params.id);

    // Send the post and its replies back together
    responseMessage.json({ ...post, replies });

  }

}


/*
* FUNCTION: createPost
* PARAMETERS: database (Database) - the SQLite database instance
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing the newly created post
* DESCRIPTION: Creates a new post in the database and sends it back as a JSON response.
*/
function createPost(database, incomingMessage, responseMessage) 
{

  // Pull user_id and content out of the request body
  const { user_id, content } = incomingMessage.body;
  // Make sure both fields were provided
  if (!user_id || !content) 
  {

    responseMessage.status(400).json({ error: "user_id and content are required" });

  } 
  else 
  {

    // Insert the new post into the database
    const result = database.prepare(`INSERT INTO posts (user_id, content) VALUES (?, ?)`).run(user_id, content);

    // Fetch the newly created post so we can send it back
    const post = database.prepare(` SELECT * FROM posts WHERE id = ?`).get(result.lastInsertRowid);

    // Send back the new post with a 201 Created status
    responseMessage.status(201).json(post);

  }

}


/*
* FUNCTION: editPost
* PARAMETERS: database (Database) - the SQLite database instance
*             incomingMessage - the Express request object
*             responseMessage - the Express response object
* RETURN: JSON response containing the updated post
* DESCRIPTION: Edits an existing post in the database. The user can only edit their own posts. 
*              If the post is not found, sends a 404 error response. If a different user is trying to edit, sends a 403 error response. 
*              Otherwise, updates the post and sends back the updated post as a JSON response.
*/
function editPost(database, incomingMessage, responseMessage) 
{

  const { content, user_id } = incomingMessage.body;

  // Make sure new content was provided
  if (!content) 
  {

    responseMessage.status(400).json({ error: "content is required" });

  } 
  else 
  {
    // Find the post in the database first
    const post = database.prepare(` SELECT * FROM posts WHERE id = ? `).get(incomingMessage.params.id);

    // If no post was found send a 404 error
    if (!post) 
    {

      responseMessage.status(404).json({ error: "Post not found" });

    // If a different user is trying to edit send a 403 forbidden error
    } 
    else if (user_id && post.user_id !== user_id) 
    {
      
        responseMessage.status(403).json({ error: "Cannot edit another user's post" });

    } 
    else 
    {

      // Update the post content and the updated_at timestamp
      database.prepare(`
        UPDATE posts SET content = ?, updated_at = datetime('now') WHERE id = ?
      `).run(content, incomingMessage.params.id);

      // Fetch the updated post and send it back
      const updated = database.prepare(`
        SELECT * FROM posts WHERE id = ?
      `).get(incomingMessage.params.id);

      responseMessage.json(updated);

    }

  }

}


/*
* FUNCTION: deletePost
* PARAMETERS: database (Database) - the SQLite database instance, req (Request) - the Express request object, res (Response) - the Express response object
* RETURN: No content response
* DESCRIPTION: Deletes a post from the database. The user can only delete their own posts. 
*              If the post is not found, sends a 404 error response. If a different user is trying to delete, sends a 403 error response. 
*              Otherwise, deletes the post and sends back a 204 No Content response.
*/
function deletePost(database, incomingMessage, responseMessage) 
{

  const { user_id } = incomingMessage.body;

  // Find the post in the database first
  const post = database.prepare(` SELECT * FROM posts WHERE id = ?`).get(incomingMessage.params.id);

  // If no post was found send a 404 error
  if (!post) 
  {

    responseMessage.status(404).json({ error: "Post not found" });

  // If a different user is trying to delete send a 403 forbidden error
  } 
  else if (user_id && post.user_id !== user_id) 
  {

    responseMessage.status(403).json({ error: "Cannot delete another user's post" });

  } 
  else 
  {

    // Delete the post from the database
    database.prepare(`
      DELETE FROM posts WHERE id = ?
    `).run(incomingMessage.params.id);

    // Send back a 204 No Content (success, nothing to return)
    responseMessage.status(204).send();

  }

}




/*
* FUNCTION: postsRouter
* PARAMETERS: database (Database) - the SQLite database instance
* RETURN: Express Router instance
* DESCRIPTION: Sets up the Express Router for handling post-related routes. 
*              Each route is connected to its corresponding handler function defined above, and the database instance is passed to each handler for performing database operations.
*/
function postsRouter(database) 
{

  const router = express.Router();

  // Each route calls its matching function and passes database, req, res
  router.get("/", (incomingMessage, responseMessage) => getAllPosts(database, incomingMessage, responseMessage));
  router.get("/:id", (incomingMessage, responseMessage) => getPostById(database, incomingMessage, responseMessage));
  router.post("/", (incomingMessage, responseMessage) => createPost(database, incomingMessage, responseMessage));
  router.patch("/:id",(incomingMessage, responseMessage) => editPost(database, incomingMessage, responseMessage));
  router.delete("/:id",(incomingMessage, responseMessage) => deletePost(database, incomingMessage, responseMessage));

  return router;

}

module.exports = { postsRouter };