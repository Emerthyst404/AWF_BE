/*
* FILE: api.jestTests.js
* PROJECT: AWF Backend Assignment
* DATE: 2026-06-01
* AUTHOR: Kalina Cathcart
* DESCRIPTION: Automated tests for the social media API using Jest and node-fetch.
*              NOTE: The server must be running on localhost:3000 before running tests.
*              Run "npm start" in a separate terminal before running "npm test"
*/


const fetch = require("node-fetch");

// The base URL of the running server
const BASE_URL = "http://localhost:3000";

/*
* FUNCTION: createTestPost
* PARAMETERS: user_id (string) - the user creating the post
*             content (string) - the content of the post
* RETURN: the created post object
* DESCRIPTION: Helper function that creates a post and returns the response body.
*              Used to avoid repeating post creation code in every test.
*/
async function createTestPost(user_id, content)
{

  // If no user_id was provided, use a default value
  if (!user_id)
  {

    user_id = "alice";

  }

  // If no content was provided, use a default value
  if (!content)
  {

    content = "Test post";

  }

  // POST request to create a post with the specified user_id and content
  const responseMessage = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, content })
  });

  // Return the response body which contains the post data
  return responseMessage.json();

}

/*
* FUNCTION: createTestReply
* PARAMETERS: postId (number) - the ID of the post to reply to
*             user_id (string) - the user creating the reply
*             content (string) - the content of the reply
* RETURN: the created reply object
* DESCRIPTION: Helper function that creates a reply and returns the response body.
*              Used to avoid repeating reply creation code in every test.
*/
async function createTestReply(postId, user_id, content)
{

  // If no user_id was provided, use a default value
  if (!user_id)
  {

    user_id = "bob";

  }

  // If no content was provided, use a default value
  if (!content)
  {

    content = "Test reply";

  }

  // Make a POST request to create a reply on the specified post
  const responseMessage = await fetch(`${BASE_URL}/posts/${postId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, content })
  });

  // Return the response body which contains the reply data
  return responseMessage.json();

}

/*
* FUNCTION: createTestLike
* PARAMETERS: postId (number) - the ID of the post to like
*             user_id (string) - the user liking the post
* RETURN: the created like object
* DESCRIPTION: Helper function that likes a post and returns the response body.
*              Used to avoid repeating like creation code in every test.
*/
async function createTestLike(postId, user_id)
{

  // If no user_id was provided, use a default value
  if (!user_id)
  {

    user_id = "bob";

  }

  // Make a POST request to like the post
  const responseMessage = await fetch(`${BASE_URL}/posts/${postId}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id })
  });

  // Return the response body which contains the like data
  return responseMessage.json();

}

/*
* TEST: POST /posts
* DESCRIPTION: Tests for creating a new post.
*/
describe("POST /posts", () => {

  // Happy path test for creating a post
  it("creates a post and returns 201", async () => {

    // POST request to create a post
    const responseMessage = await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "alice", content: "Hello world" })
    });

    // Parse the response body
    const body = await responseMessage.json();

    // Check that the response has the correct status and body
    expect(responseMessage.status).toBe(201);
    expect(body).toMatchObject({ user_id: "alice", content: "Hello world" });
    expect(body.id).toBeDefined();

  });

  // Test for missing user_id field
  it("returns 400 if user_id is missing", async () => {

    // Attempt to create a post without a user_id
    const responseMessage = await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "No user" })
    });

    // Check that the response status is 400 Bad Request
    expect(responseMessage.status).toBe(400);

  });

  // Test for missing content field
  it("returns 400 if content is missing", async () => {

    // Attempt to create a post without content
    const responseMessage = await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "alice" })
    });

    // Check that the response status is 400 Bad Request
    expect(responseMessage.status).toBe(400);

  });

});

/*
* TEST: GET /posts
* DESCRIPTION: Tests for retrieving all posts.
*/
describe("GET /posts", () => {

  // Happy path test for retrieving posts
  it("returns an array of posts with like_count", async () => {

    // Create a post so the array is not empty
    await createTestPost("alice", "Post 1");

    // GET request to retrieve all posts
    const responseMessage = await fetch(`${BASE_URL}/posts`);
    const body = await responseMessage.json();

    // Check that the response status is 200 OK and posts have like_count
    expect(responseMessage.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty("like_count");

  });

});

/*
* TEST: GET /posts/:id
* DESCRIPTION: Tests for retrieving a single post by ID.
*/
describe("GET /posts/:id", () => {

  // Happy path test for retrieving a post by ID
  it("returns a post with replies array", async () => {

    // Create a post to retrieve
    const post = await createTestPost("alice", "Test post");

    // GET request to retrieve that post by ID
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}`);
    const body = await responseMessage.json();

    // Check that the response status is 200 OK and the body contains the expected post data
    expect(responseMessage.status).toBe(200);
    expect(body.id).toBe(post.id);
    expect(Array.isArray(body.replies)).toBe(true);

  });

  // Test for retrieving a non-existent post
  it("returns 404 for a non-existent post", async () => {

    // GET request to retrieve a post with an ID that doesn't exist
    const responseMessage = await fetch(`${BASE_URL}/posts/9999`);

    // Check that the response status is 404 Not Found
    expect(responseMessage.status).toBe(404);

  });

});

/*
* TEST: PATCH /posts/:id
* DESCRIPTION: Tests for editing a post's content.
*/
describe("PATCH /posts/:id", () => {

  // Happy path test for editing a post
  it("edits a post's content", async () => {

    // Create a post to edit
    const post = await createTestPost("alice", "Original");

    // PATCH request to edit that post's content
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "alice", content: "Updated" })
    });

    const body = await responseMessage.json();

    // Check that the response status is 200 OK and the content was updated
    expect(responseMessage.status).toBe(200);
    expect(body.content).toBe("Updated");

  });

  // Test for unauthorized edit attempt
  it("returns 403 when a different user tries to edit", async () => {

    // Create a post to edit
    const post = await createTestPost("alice", "Mine");

    // PATCH request to edit that post as a different user
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob", content: "Hacked" })
    });

    // Check that the response status is 403 Forbidden
    expect(responseMessage.status).toBe(403);

  });

  // Test for editing a non-existent post
  it("returns 404 for a non-existent post", async () => {

    // PATCH request to edit a post with an ID that doesn't exist
    const responseMessage = await fetch(`${BASE_URL}/posts/9999`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "X" })
    });

    // Check that the response status is 404 Not Found
    expect(responseMessage.status).toBe(404);

  });

});

/*
* TEST: DELETE /posts/:id
* DESCRIPTION: Tests for deleting a post.
*/
describe("DELETE /posts/:id", () => {

  // Happy path test for deleting a post
  it("deletes a post and returns 204", async () => {

    // Create a post to delete
    const post = await createTestPost("alice", "Bye");

    // DELETE request to delete that post
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "alice" })
    });

    // Check that the response status is 204 No Content
    expect(responseMessage.status).toBe(204);

    // Make sure the post is actually gone
    const check = await fetch(`${BASE_URL}/posts/${post.id}`);
    expect(check.status).toBe(404);

  });

  // Test for unauthorized delete attempt
  it("returns 403 when a different user tries to delete", async () => {

    // Create a post to delete
    const post = await createTestPost("alice", "Mine");

    // DELETE request to delete that post as a different user
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    // Check that the response status is 403 Forbidden
    expect(responseMessage.status).toBe(403);

  });

  // Test for deleting a non-existent post
  it("returns 404 for a non-existent post", async () => {

    // DELETE request to delete a post with an ID that doesn't exist
    const responseMessage = await fetch(`${BASE_URL}/posts/9999`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "alice" })
    });

    // Check that the response status is 404 Not Found
    expect(responseMessage.status).toBe(404);

  });

});

/*
* TEST: POST /posts/:postId/replies
* DESCRIPTION: Tests for creating a reply on a post.
*/
describe("POST /posts/:postId/replies", () => {

  // Happy path test for creating a reply
  it("creates a reply on a post", async () => {

    // Create a post to reply to
    const post = await createTestPost("alice", "Test post");

    // POST request to create a reply on that post
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob", content: "Nice post!" })
    });

    const body = await responseMessage.json();

    // Check that the response status is 201 Created and the body contains the expected reply data
    expect(responseMessage.status).toBe(201);
    expect(body).toMatchObject({ user_id: "bob", content: "Nice post!" });

  });

  // Test for replying to a non-existent post
  it("returns 404 when replying to a non-existent post", async () => {

    // POST request to reply to a post with an ID that doesn't exist
    const responseMessage = await fetch(`${BASE_URL}/posts/9999/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob", content: "Hello?" })
    });

    // Check that the response status is 404 Not Found
    expect(responseMessage.status).toBe(404);

  });

  // Test for missing fields
  it("returns 400 if user_id or content is missing", async () => {

    // Create a post to reply to
    const post = await createTestPost("alice", "Test post");

    // POST request to create a reply without providing content
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    // Check that the response status is 400 Bad Request
    expect(responseMessage.status).toBe(400);

  });

});

/*
* TEST: GET /posts/:postId/replies
* DESCRIPTION: Tests for retrieving all replies for a post.
*/
describe("GET /posts/:postId/replies", () => {

  // Happy path test for retrieving replies
  it("lists all replies for a post", async () => {

    // Create a post with some replies
    const post = await createTestPost("alice", "Test post");
    await createTestReply(post.id, "bob", "Reply 1");
    await createTestReply(post.id, "carol", "Reply 2");

    // GET request to retrieve all replies for that post
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies`);
    const body = await responseMessage.json();

    // Check that the response status is 200 OK and the body contains the expected replies
    expect(responseMessage.status).toBe(200);
    expect(body).toHaveLength(2);

  });

});

/*
* TEST: PATCH /posts/:postId/replies/:replyId
* DESCRIPTION: Tests for editing a reply.
*/
describe("PATCH /posts/:postId/replies/:replyId", () => {

  // Happy path test for editing a reply
  it("edits a reply", async () => {

    // Create a post and a reply to edit
    const post = await createTestPost("alice", "Test post");
    const reply = await createTestReply(post.id, "bob", "Old");

    // PATCH request to edit that reply
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies/${reply.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob", content: "Updated reply" })
    });

    const body = await responseMessage.json();

    // Check that the response status is 200 OK and the content was updated
    expect(responseMessage.status).toBe(200);
    expect(body.content).toBe("Updated reply");

  });

  // Test for unauthorized edit attempt
  it("returns 403 when a different user tries to edit a reply", async () => {

    // Create a post and a reply to edit
    const post = await createTestPost("alice", "Test post");
    const reply = await createTestReply(post.id, "bob", "Mine");

    // PATCH request to edit that reply as a different user
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies/${reply.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "carol", content: "Not yours" })
    });

    // Check that the response status is 403 Forbidden
    expect(responseMessage.status).toBe(403);

  });

  // Test for editing a non-existent reply
  it("returns 404 for a non-existent reply", async () => {

    // Create a post to reply to
    const post = await createTestPost("alice", "Test post");

    // PATCH request to edit a reply with an ID that doesn't exist
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies/9999`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "X" })
    });

    // Check that the response status is 404 Not Found
    expect(responseMessage.status).toBe(404);

  });

});

/*
* TEST: DELETE /posts/:postId/replies/:replyId
* DESCRIPTION: Tests for deleting a reply.
*/
describe("DELETE /posts/:postId/replies/:replyId", () => {

  // Happy path test for deleting a reply
  it("deletes a reply and returns 204", async () => {

    // Create a post and a reply to delete
    const post = await createTestPost("alice", "Test post");
    const reply = await createTestReply(post.id, "bob", "Bye");

    // DELETE request to delete that reply
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies/${reply.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    // Check that the response status is 204 No Content
    expect(responseMessage.status).toBe(204);

  });

  // Test for unauthorized delete attempt
  it("returns 403 when a different user tries to delete a reply", async () => {

    // Create a post and a reply to delete
    const post = await createTestPost("alice", "Test post");
    const reply = await createTestReply(post.id, "bob", "Mine");

    // DELETE request to delete that reply as a different user
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/replies/${reply.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "carol" })
    });

    // Check that the response status is 403 Forbidden
    expect(responseMessage.status).toBe(403);

  });

});

/*
* TEST: POST /posts/:postId/likes
* DESCRIPTION: Tests for liking a post.
*/
describe("POST /posts/:postId/likes", () => {

  // Happy path test for liking a post
  it("likes a post and returns 201", async () => {

    // Create a post to like
    const post = await createTestPost("alice", "Test post");

    // POST request to like that post
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/likes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    const body = await responseMessage.json();

    // Check that the response status is 201 Created
    expect(responseMessage.status).toBe(201);
    expect(body).toMatchObject({ post_id: post.id, user_id: "bob" });

  });

  // Test for liking a post that the user already liked
  it("returns 409 if user already liked the post", async () => {

    // Create a post and like it
    const post = await createTestPost("alice", "Test post");
    await createTestLike(post.id, "bob");

    // POST request to like that post again
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/likes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    // Check that the response status is 409 Conflict
    expect(responseMessage.status).toBe(409);

  });

  // Test for liking a non-existent post
  it("returns 404 when liking a non-existent post", async () => {

    // POST request to like a post with an ID that doesn't exist
    const responseMessage = await fetch(`${BASE_URL}/posts/9999/likes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    // Check that the response status is 404 Not Found
    expect(responseMessage.status).toBe(404);

  });

  // Test for missing user_id field
  it("returns 400 if user_id is missing", async () => {

    // Create a post to like
    const post = await createTestPost("alice", "Test post");

    // POST request to like that post without providing user_id
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/likes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    // Check that the response status is 400 Bad Request
    expect(responseMessage.status).toBe(400);

  });

});

/*
* TEST: DELETE /posts/:postId/likes
* DESCRIPTION: Tests for unliking a post.
*/
describe("DELETE /posts/:postId/likes", () => {

  // Happy path test for unliking a post
  it("unlikes a post and returns 204", async () => {

    // Create a post and like it
    const post = await createTestPost("alice", "Test post");
    await createTestLike(post.id, "bob");

    // DELETE request to unlike that post
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/likes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    // Check that the response status is 204 No Content
    expect(responseMessage.status).toBe(204);

  });

  // Test for unliking a post the user never liked
  it("returns 404 when unliking a post the user never liked", async () => {

    // Create a post to unlike
    const post = await createTestPost("alice", "Test post");

    // DELETE request to unlike a post the user never liked
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/likes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "bob" })
    });

    // Check that the response status is 404 Not Found
    expect(responseMessage.status).toBe(404);

  });

});

/*
* TEST: GET /posts/:postId/likes
* DESCRIPTION: Tests for retrieving all likes for a post.
*/
describe("GET /posts/:postId/likes", () => {

  // Happy path test for retrieving likes
  it("lists all likes for a post", async () => {

    // Create a post with some likes
    const post = await createTestPost("alice", "Test post");
    await createTestLike(post.id, "bob");
    await createTestLike(post.id, "carol");

    // GET request to retrieve all likes for that post
    const responseMessage = await fetch(`${BASE_URL}/posts/${post.id}/likes`);
    const body = await responseMessage.json();

    // Check that the response status is 200 OK and the body contains the expected likes
    expect(responseMessage.status).toBe(200);
    expect(body).toHaveLength(2);

  });

});