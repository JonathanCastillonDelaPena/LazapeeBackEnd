const routesPost = require("express").Router();
const sql = require("../database/mySQL");
const { authenticateToken } = require("../utils/auth");
const multerUpload = require("../utils/multer");
const {
  streamUploadToPosts,
  deleteUploadedImage,
} = require("../utils/cloudinaryImageHandler");

routesPost.get("/post/paginated", authenticateToken, (req, res) => {
  try {
    const limit = req.query.limit;
    const last_fetched_record = req.query.last_fetched_record;

    sql.query(
      `CALL ShowAllPostPaginated(${limit}, ${last_fetched_record})`,
      (err, rows) => {
        if (err) {
          console.log(
            `\nError in calling the Stored Procedure: ShowAllPostPaginated.`
          );

          res.status(400).send(err);
          throw err;
        }
        if (rows[0]) {
          console.log(
            `\nSuccess in calling the Stored Procedure: ShowAllPostPaginated.`
          );
          console.log(`Row Count: ${rows[0].length}`);

          res.status(201).send(rows[0]);
        }
      }
    );
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching Paginated Post.`);
    console.log(error);
  }
});

routesPost.get("/post/latest", authenticateToken, (req, res) => {
  try {
    sql.query(`CALL ShowLatestPost()`, (err, rows) => {
      if (err) {
        console.log(`\nError in calling the Stored Procedure: ShowLatestPost.`);

        res.status(400).send(err);
        throw err;
      }
      if (rows[0]) {
        console.log(
          `\nSuccess in calling the Stored Procedure: ShowLatestPost.`
        );
        console.log(`Row Count: ${rows[0].length}`);

        res.status(201).send(rows[0]);
      }
    });
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching Latest Post.`);
    console.log(error);
  }
});

routesPost.get("/post/paginated/user", authenticateToken, (req, res) => {
  try {
    const user_id = req.query.user_id;
    const limit = req.query.limit;
    const last_fetched_record = req.query.last_fetched_record;

    sql.query(
      `CALL ShowAllPostPaginatedByUser(${limit}, ${last_fetched_record}, ${user_id})`,
      (err, rows) => {
        if (err) {
          console.log(
            `\nError in calling the Stored Procedure: ShowAllPostPaginatedByUser.`
          );

          res.status(400).send(err);
          throw err;
        }
        if (rows[0]) {
          console.log(
            `\nSuccess in calling the Stored Procedure: ShowAllPostPaginatedByUser.`
          );
          console.log(`Row Count: ${rows[0].length}`);

          res.status(201).send(rows[0]);
        }
      }
    );
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching Paginated Post.`);
    console.log(error);
  }
});

routesPost.get("/post/latest/user", authenticateToken, (req, res) => {
  try {
    const user_id = req.query.user_id;

    sql.query(`CALL ShowLatestPostByUser(${user_id})`, (err, rows) => {
      if (err) {
        console.log(
          `\nError in calling the Stored Procedure: ShowLatestPostByUser.`
        );

        res.status(400).send(err);
        throw err;
      }
      if (rows[0]) {
        console.log(
          `\nSuccess in calling the Stored Procedure: ShowLatestPostByUser.`
        );
        console.log(`Row Count: ${rows[0].length}`);

        res.status(201).send(rows[0]);
      }
    });
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching Latest Post.`);
    console.log(error);
  }
});

routesPost.get("/post/", authenticateToken, (req, res) => {
  try {
    sql.query("CALL ShowAllPost()", (err, rows) => {
      if (err) {
        console.log(`\nError in calling the Stored Procedure: ShowAllPost.`);

        res.status(400).send(err);
        throw err;
      }
      if (rows[0]) {
        console.log(`\nSuccess in calling the Stored Procedure: ShowAllPost.`);
        console.log(`Row Count: ${rows[0].length}`);

        res.status(201).send(rows[0]);
      }
    });
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching all Post.`);
    console.log(error);
  }
});

routesPost.get("/post/:id", authenticateToken, (req, res) => {
  try {
    const post_id = req.params.id;

    sql.query(`CALL ShowPostByID(${post_id})`, (err, rows) => {
      if (err) {
        console.log(`\nError in calling the Stored Procedure: ShowPostByID.`);

        res.status(400).send(err);
        throw err;
      }
      if (rows[0]) {
        console.log(`\nSuccess in calling the Stored Procedure: ShowPostByID.`);
        console.log(rows[0]);

        res.status(201).send(rows[0]);
      }
    });
  } catch (error) {
    console.log(`\nError: Something went wrong in fetching the Post.`);
    console.log(error);
  }
});

routesPost.put("/post/", authenticateToken, async (req, res) => {
  try {
    const post_id = req.body.post_id;
    const title = req.body.title;
    const content = req.body.content;

    await sql.query(
      `CALL UpdatePost(${post_id}, '${title}', '${content}')`,
      (err, rows) => {
        if (err) {
          console.log(`\nError in calling the Stored Procedure: UpdatePost.`);

          res.status(400).send(err);
          throw err;
        }
        if (rows) {
          console.log(`\nSuccess in calling the Stored Procedure: UpdatePost.`);
          console.log(rows);

          res.status(201).send(rows);
        }
      }
    );
  } catch (error) {
    console.log(`\nError: Something went wrong in updating the Post.`);
    console.log(error);
  }
});

routesPost.post(
  "/post/",
  authenticateToken,
  multerUpload.single("image_file"),
  async (req, res) => {
    try {
      const user_id = req.body.user_id;
      const title = req.body.title;
      const content = req.body.content;
      let image_public_id = "";
      let image_url = "";

      // Check if there's an Image file in the payload,
      // Since the User can make a Post with no Image.
      if (req.file) {
        await streamUploadToPosts(req)
          .then((response) => {
            image_public_id = response.public_id;
            image_url = response.secure_url;

            console.log(`\nSuccess in uploading the image.`);
            console.log(response);
          })
          .catch((error) => {
            console.log(`\nError in uploading the image.`);

            res.status(error.http_code ?? 400).send(error);

            // Re-throw the error to prevent the execution
            // of the SQL query.
            throw error;
          });
      }

      await sql.query(
        `CALL AddPost(${user_id}, '${title}', '${content}', '${image_public_id}', '${image_url}')`,
        (err, rows) => {
          if (err) {
            console.log(`\nError in calling the Stored Procedure: AddPost.`);

            res.status(400).send(err);

            // Delete the uploaded Image since something went wrong
            // in calling the Stored Procedure.
            deleteUploadedImage(image_public_id);
            throw err;
          }
          if (rows) {
            console.log(`\nSuccess in calling the Stored Procedure: AddPost.`);
            console.log(rows);

            res.status(201).send(rows);
          }
        }
      );
    } catch (error) {
      console.log(`\nError: Something went wrong in adding a Post.`);
      console.log(error);
    }
  }
);

routesPost.delete("/post/", authenticateToken, async (req, res) => {
  try {
    const post_id = req.body.post_id;
    const image_public_id = req.body.image_public_id;

    await sql.query(`CALL DeletePostByID(${post_id})`, (err, rows) => {
      if (err) {
        console.log(`\nError in calling the Stored Procedure: DeletePostByID.`);

        res.status(400).send(err);
        throw err;
      }
      if (rows) {
        console.log(
          `\nSuccess in calling the Stored Procedure: DeletePostByID.`
        );
        console.log(rows);

        if (image_public_id !== "" && (image_public_id ?? false)) {
          deleteUploadedImage(image_public_id);
        }

        res.status(201).send(rows);
      }
    });
  } catch (error) {
    console.log(`\nError: Something went wrong in deleting the Post.`);
    console.log(error);
  }
});

module.exports = routesPost;
