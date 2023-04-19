const routesPost = require("express").Router();
const sql = require("../database/mySQL");
const { authenticateToken } = require("../utils/auth");

// Get the comment count of the Post
routesPost.get("/comment/count", authenticateToken, (req, res) => {
  try {
    const post_id = req.query.post_id;
    sql.query(`CALL CountAllCommentByPost(${post_id})`, (err, rows) => {
      if (err) {
        console.log(
          `\nError in calling the Stored Procedure: CountAllCommentByPost.`
        );

        res.status(400).send(err);
        throw err;
      }
      if (rows[0]) {
        console.log(
          `\nSuccess in calling the Stored Procedure: CountAllCommentByPost.`
        );
        console.log(rows[0]);

        res.status(201).send(rows[0]);
      }
    });
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching comment count.`);
    console.log(error);
  }
});

// Get the reply comment count of the parent comment by Post
routesPost.get("/comment/reply-count", authenticateToken, (req, res) => {
  try {
    const post_id = req.query.post_id;
    const parent_comment_id = req.query.parent_comment_id;
    sql.query(
      `CALL CountAllReplyCommentByPost(${post_id}, ${parent_comment_id})`,
      (err, rows) => {
        if (err) {
          console.log(
            `\nError in calling the Stored Procedure: CountAllReplyCommentByPost.`
          );

          res.status(400).send(err);
          throw err;
        }
        if (rows[0]) {
          console.log(
            `\nSuccess in calling the Stored Procedure: CountAllReplyCommentByPost.`
          );
          console.log(rows[0]);

          res.status(201).send(rows[0]);
        }
      }
    );
  } catch (error) {
    console.log(
      `\nError: Something went wrong in fetching reply comment count.`
    );
    console.log(error);
  }
});

// Get all parent comment of the Post
routesPost.get("/comment/parent", authenticateToken, (req, res) => {
  try {
    const post_id = req.query.post_id;
    sql.query(`CALL ShowAllParentCommentByPost(${post_id})`, (err, rows) => {
      if (err) {
        console.log(
          `\nError in calling the Stored Procedure: ShowAllParentCommentByPost.`
        );

        res.status(400).send(err);
        throw err;
      }
      if (rows[0]) {
        console.log(
          `\nSuccess in calling the Stored Procedure: ShowAllParentCommentByPost.`
        );
        console.log(`Row Count: ${rows[0].length}`);

        res.status(201).send(rows[0]);
      }
    });
  } catch (error) {
    console.log(
      `\nError: Something went wrong in fetching all Parent Comment.`
    );
    console.log(error);
  }
});

// Get all the reply comment of the parent comment by Post
routesPost.get("/comment/reply", authenticateToken, (req, res) => {
  try {
    const post_id = req.query.post_id;
    const parent_comment_id = req.query.parent_comment_id;
    sql.query(
      `CALL ShowAllReplyCommentByPost(${post_id}, ${parent_comment_id})`,
      (err, rows) => {
        if (err) {
          console.log(
            `\nError in calling the Stored Procedure: ShowAllReplyCommentByPost.`
          );

          res.status(400).send(err);
          throw err;
        }
        if (rows[0]) {
          console.log(
            `\nSuccess in calling the Stored Procedure: ShowAllReplyCommentByPost.`
          );
          console.log(`Row Count: ${rows[0].length}`);

          res.status(201).send(rows[0]);
        }
      }
    );
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching all Reply Comment.`);
    console.log(error);
  }
});

// Add a parent comment to the Post
routesPost.post("/comment/parent", authenticateToken, (req, res) => {
  try {
    const post_id = req.body.post_id;
    const user_id = req.body.user_id;
    const comment = req.body.comment;
    sql.query(
      `CALL AddParentCommentByPost(${post_id}, ${user_id}, '${comment}')`,
      (err, rows) => {
        if (err) {
          console.log(
            `\nError in calling the Stored Procedure: AddParentCommentByPost.`
          );

          res.status(400).send(err);
          throw err;
        }
        if (rows) {
          console.log(
            `\nSuccess in calling the Stored Procedure: AddParentCommentByPost.`
          );
          console.log(rows);

          res.status(201).send(rows);
        }
      }
    );
  } catch (error) {
    console.log(`\nError: Something went wrong in adding a Parent Comment.`);
    console.log(error);
  }
});

// Add a reply comment to the Post
routesPost.post("/comment/reply", authenticateToken, (req, res) => {
  try {
    const parent_comment_id = req.body.parent_comment_id;
    const post_id = req.body.post_id;
    const user_id = req.body.user_id;
    const comment = req.body.comment;
    sql.query(
      `CALL AddReplyComment(${parent_comment_id}, ${post_id}, ${user_id}, '${comment}')`,
      (err, rows) => {
        if (err) {
          console.log(
            `\nError in calling the Stored Procedure: AddReplyComment.`
          );
          console.log(err);

          res.status(400).send(err);
          // throw err;
        }
        if (rows) {
          console.log(
            `\nSuccess in calling the Stored Procedure: AddReplyComment.`
          );
          console.log(rows);

          res.status(201).send(rows);
        }
      }
    );
  } catch (error) {
    console.log(`\nError: Something went wrong in adding a Reply Comment.`);
    console.log(error);
  }
});

routesPost.delete("/comment/", authenticateToken, (req, res) => {
  try {
    const post_id = req.body.post_id;
    const comment_id = req.body.comment_id;
    const user_id = req.body.user_id;
    sql.query(
      `CALL DeleteCommentByPost(${post_id}, ${comment_id}, ${user_id})`,
      (err, rows) => {
        if (err) {
          console.log(
            `\nError in calling the Stored Procedure: DeleteCommentByPost.`
          );

          res.status(400).send(err);
          throw err;
        }
        if (rows) {
          console.log(
            `\nSuccess in calling the Stored Procedure: DeleteCommentByPost.`
          );
          console.log(rows);

          res.status(201).send(rows);
        }
      }
    );
  } catch (error) {
    console.log(`\nError: Something went wrong in deleting a Comment.`);
    console.log(error);
  }
});

module.exports = routesPost;
