const routesUser = require("express").Router();
const sql = require("../database/mySQL");
const {
  checkPassword,
  hashPassword,
  createToken,
  verifyToken,
  authenticateToken,
} = require("../utils/auth");
const {
  signupSchema,
  loginSchema,
  usernameSchema,
  updateSchema,
  emailSchema,
  passwordSchema,
} = require("../utils/validator");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendTemporaryPassword,
} = require("../utils/mailHandler");

//Login
routesUser.post("/login/", async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  } else {
    try {
      const username = req.body.username;
      const pass = req.body.pass;
      await sql.query(
        `CALL CheckPassByUsername('${username}')`,
        async (err, rows) => {
          console.log(rows[0]);
          const passData = rows[0].map((data) => data.pass);
          if (passData == "") {
            console.log(`Password data is '${passData}' \nInvalid Username`);
            res.status(401).json({ error: "invalid" });
          } else {
            console.log(passData);
            const comparedpass = await checkPassword(pass, passData[0]);
            if (comparedpass) {
              await sql.query(
                `CALL CheckEmailVerifiedByUsername('${username}')`,
                async (err, rows) => {
                  console.log(rows[0]);
                  const isEmailVerified = rows[0].map(
                    (data) => data.email_verified
                  );
                  if (isEmailVerified == "verified") {
                    const accessToken = await createToken(username);
                    res.json({ accessToken: accessToken });
                    console.log(await verifyToken(accessToken));
                  } else {
                    console.log(`${username}'s Email is not yet verified`);
                    res
                      .status(401)
                      .json({ error: "Email is not yet verified" });
                  }
                }
              );
            } else {
              console.log(`Username Found\nBut Password Incorrect`);
              res.status(401).json({ error: "invalid" });
            }
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
});

//Register
routesUser.post("/signup/", async (req, res) => {
  const { error, value } = signupSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.log(error.message);
    return res.status(400).send({ error: error.message });
  } else {
    try {
      const first_name = req.body.first_name;
      const last_name = req.body.last_name;
      const email = req.body.email.toLowerCase();
      const pass = await hashPassword(req.body.pass);
      const username = req.body.username.toLowerCase();
      const gender = req.body.gender;
      const email_verified = crypto
        .createHash("md5")
        .update(`${Date.now()}`)
        .digest("hex");
      await sql.query(
        `CALL CheckUsername('${username}')`,
        async (err, rows) => {
          const nameData = rows[0].map((data) => data.username);
          if (nameData != "") {
            console.log(`Username is taken: '${nameData}'`);
            res.status(400).json({ error: "username taken" });
          } else {
            console.log(`Username '${username}' is valid`);
            await sql.query(
              `CALL CheckEmail('${email}')`,
              async (err, rows) => {
                const emailData = rows[0].map((data) => data.email);
                if (emailData != "") {
                  console.log(`Email is taken: '${emailData}'`);
                  return res.status(400).json({ error: "email taken" });
                } else {
                  await sql.query(
                    `CALL AddUser('${first_name}','${last_name}','${email}','${pass}','${username}','${gender}','${email_verified}')`,
                    () => {
                      sendVerificationEmail(username, email, email_verified);
                      console.log(`account created for: ${username}`);
                      res.status(201).json({ message: "account created" });
                    }
                  );
                }
              }
            );
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
});

//Update
routesUser.put("/users/", authenticateToken, async (req, res) => {
  const { error, value } = updateSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.log(error.message);
    return res.send(error.message);
  } else {
    try {
      const user_id = req.body.user_id;
      const first_name = req.body.first_name;
      const last_name = req.body.last_name;
      const gender = req.body.gender;
      await sql.query(
        `CALL UpdateUser(${user_id},'${first_name}','${last_name}','${gender}')`,
        (err, rows) => {
          res.status(202).send(rows);
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
});

//Delete
routesUser.delete("/users/", authenticateToken, async (req, res) => {
  const user_id = req.body.user_id;
  try {
    await sql.query(`CALL DeleteUserByID(${user_id})`, (err, rows) => {
      res.status(202).send(rows);
    });
  } catch (error) {
    console.log(error);
  }
});

//Show User Details by Username
routesUser.post("/userdetails/", authenticateToken, async (req, res) => {
  const username = req.body.username;
  try {
    await sql.query(
      `CALL ShowDetailsByUsername('${username}')`,
      (err, rows) => {
        res.status(200).json(rows[0]);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

//Show User Details by PostID
routesUser.post("/post/userdetails/", authenticateToken, async (req, res) => {
  const post_id = req.body.post_id;
  try {
    await sql.query(`CALL ShowDetailsByPostID('${post_id}')`, (err, rows) => {
      res.status(200).json(rows[0]);
    });
  } catch (error) {
    console.log(error);
  }
});

//Search by Username
// routesUser.post("/search/", authenticateToken, async (req, res) => {
//   const query = req.body.query;
//   try {
//     await sql.query(`CALL SearchByName('${query}')`, (err, rows) => {
//       res.status(200).json(rows[0]);
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

// Search by Name
routesUser.post("/search/", authenticateToken, async (req, res) => {
  try {

    // Sanitize the query by removing any empty string
    // and splitting the query into an array.
    const queryArr = req.body.query.split(" ").filter((query) => query);

    if (queryArr.length === 0) {
      res.status(400).json({ error: "Query cannot be empty." });
    }

    let result = [];

    const interval = 100; // Delay between two iterations (in milliseconds)
    let promise = Promise.resolve();
    queryArr.forEach((query) => {
      promise = promise.then(function () {
        sql.query(`CALL SearchByName('${query}')`, (err, rows) => {
          result.push(...rows[0]);
        });

        return new Promise(function (resolve) {
          setTimeout(resolve, interval);
        });
      });
    });
    
    // Loop is finished.
    promise.then(function () {
      result = result.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.user_id === value.user_id)
      );

      res.status(200).json(result);
    });
  } catch (error) {
    console.log(error);
  }
});

//Show all users
routesUser.post("/userdata/", authenticateToken, async (req, res) => {
  const username = req.body.username;
  try {
    await sql.query(`CALL ShowAllUsers()`, (err, rows) => {
      res.status(200).json(rows[0]);
    });
  } catch (error) {
    console.log(error);
  }
});

//Verify email
routesUser.get("/emailverify/:email&:key", async (req, res) => {
  console.log(req.params.email, req.params.key);
  try {
    await sql.query(
      `CALL CheckEmail('${req.params.email.toLowerCase()}')`,
      async (err, rows) => {
        const emailData = rows[0].map((data) => data.email);
        if (emailData != "") {
          console.log(`Email exists: '${emailData}'`);
          await sql.query(
            `CALL CheckEmailVerifiedByEmail('${emailData}')`,
            async (err, rows) => {
              console.log(rows[0]);
              const isEmailVerified = rows[0].map(
                (data) => data.email_verified
              );
              if (isEmailVerified == "verified") {
                console.log(`${emailData} is already verified`);
                res.status(400).json({ error: "Email is already verified" });
              } else {
                if (isEmailVerified == req.params.key) {
                  console.log(`Key entered matched for ${emailData}`);
                  await sql.query(
                    `CALL SetEmailVerified('${emailData}')`,
                    async (err, rows) => {
                      console.log(`${emailData} is now verified`);
                      res
                        .status(200)
                        .redirect("https://kodebook.tristanviernes.com");
                    }
                  );
                } else {
                  console.log(
                    `Entered key:${req.params.key} and Registered key:${isEmailVerified} doesn't match.`
                  );
                  res.status(400).json({ error: "invalid email or key" });
                }
              }
            }
          );
        } else {
          res.status(400).json({ error: "invalid email or key" });
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});

//Resend Verification email
routesUser.post("/emailverify/", async (req, res) => {
  console.log(`Resending verification email for ${req.body.email}`);
  try {
    await sql.query(
      `CALL CheckEmail('${req.body.email}')`,
      async (err, rows) => {
        const emailData = rows[0].map((data) => data.email);
        if (emailData != "") {
          console.log(`Email exists: '${emailData}'`);
          await sql.query(
            `CALL CheckEmailVerifiedByEmail('${emailData}')`,
            async (err, rows) => {
              const isEmailVerified = rows[0].map(
                (data) => data.email_verified
              );
              if (isEmailVerified == "verified") {
                console.log(`${emailData} is already verified`);
                res.status(400).json({ error: "Email is already verified" });
              } else {
                await sql.query(
                  `CALL CheckUsernameByEmail('${emailData}')`,
                  async (err, rows) => {
                    const username = rows[0].map((data) => data.username);
                    sendVerificationEmail(
                      username[0],
                      emailData[0],
                      isEmailVerified[0]
                    );
                    console.log(`Resent email verification for: ${emailData}`);
                    //Send generic message to avoid exploit
                    res.status(200).json({
                      message:
                        "if the address is correct, you will receive an email soon",
                    });
                  }
                );
              }
            }
          );
        } else {
          //Send generic message to avoid exploit
          res.status(200).json({
            message:
              "if the address is correct, you will receive an email soon",
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});

//Change email
routesUser.post("/emailchange/", authenticateToken, async (req, res) => {
  const { error, value } = emailSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  } else {
    try {
      const username = req.body.username;
      const new_email = req.body.new_email.toLowerCase();
      const pass = req.body.pass;
      await sql.query(
        `CALL CheckEmailByUsername('${username}')`,
        async (err, rows) => {
          const old_email = rows[0].map((data) => data.email);
          console.log(`Changing email from ${old_email} to ${new_email}`);
          if (old_email == new_email) {
            res.status(400).json({ error: "you entered your current email" });
          } else {
            await sql.query(
              `CALL CheckPassByUsername('${username}')`,
              async (err, rows) => {
                const passData = rows[0].map((data) => data.pass);
                const comparedpass = await checkPassword(pass, passData[0]);
                if (comparedpass) {
                  await sql.query(
                    `CALL ChangeEmailByUsername('${username}','${new_email}')`,
                    async (err, rows) => {
                      console.log(`Email set to: ${new_email}`);
                      res
                        .status(202)
                        .json({ message: "email change successful" });
                    }
                  );
                } else {
                  console.log(`Change email failed: Password Incorrect`);
                  res.status(401).json({ error: "invalid password" });
                }
              }
            );
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
});

//Forgot password
routesUser.post("/forgotpassword/", async (req, res) => {
  console.log(`Trying to send temporary pass to ${req.body.email}`);
  try {
    await sql.query(
      `CALL CheckEmail('${req.body.email}')`,
      async (err, rows) => {
        const emailData = rows[0].map((data) => data.email);
        if (emailData != "") {
          console.log(`Email exists: '${emailData}'`);
          await sql.query(
            `CALL CheckEmailVerifiedByEmail('${emailData}')`,
            async (err, rows) => {
              const isEmailVerified = rows[0].map(
                (data) => data.email_verified
              );
              if (isEmailVerified == "verified") {
                await sql.query(
                  `CALL CheckUsernameByEmail('${emailData}')`,
                  async (err, rows) => {
                    const username = rows[0].map((data) => data.username);
                    const temp_pass = crypto.randomBytes(4).toString("hex");
                    const hashed_temp_pass = await hashPassword(temp_pass);
                    console.log(
                      username[0],
                      emailData[0],
                      temp_pass,
                      hashed_temp_pass
                    );
                    await sql.query(
                      `CALL ChangePassByUsername('${username}','${hashed_temp_pass}')`
                    );
                    sendTemporaryPassword(username[0], emailData[0], temp_pass);
                    console.log(`Issued temporary pass to: ${emailData}`);
                    //Send generic message to avoid exploit
                    res.status(200).json({
                      message:
                        "if the address is correct, your temporary pass will be delivered to your email",
                    });
                  }
                );
              } else {
                console.log(`${emailData} is unverified`);
                res
                  .status(400)
                  .json({ error: "your email is not yet verified" });
              }
            }
          );
        } else {
          //Send generic message to avoid exploit
          res.status(200).json({
            message:
              "if the address is correct, your temporary pass will be delivered to your email",
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});

//Change username
routesUser.post("/usernamechange/", authenticateToken, async (req, res) => {
  const { error, value } = usernameSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  } else {
    try {
      const username = req.body.username.toLowerCase();
      const new_username = req.body.new_username.toLowerCase();
      const pass = req.body.pass;
      if (username == new_username) {
        res.status(400).json({ error: "you entered your current username" });
      } else {
        await sql.query(
          `CALL CheckPassByUsername('${username}')`,
          async (err, rows) => {
            console.log(rows[0]);
            const passData = rows[0].map((data) => data.pass);
            if (passData == "") {
              console.log(`Password data is '${passData}'`);
              res.status(401).json({ error: "invalid password" });
            } else {
              console.log(passData);
              const comparedpass = await checkPassword(pass, passData[0]);
              if (comparedpass) {
                await sql.query(
                  `CALL ChangeUsername('${username}','${new_username}')`,
                  async (err, rows) => {
                    console.log(rows[0]);
                    res
                      .status(200)
                      .json({ message: "username changed successfully" });
                  }
                );
              } else {
                console.log(`Change username failed: Password Incorrect`);
                res.status(401).json({ error: "invalid password" });
              }
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
});

//Change password
routesUser.post("/passwordchange/", authenticateToken, async (req, res) => {
  const { error, value } = passwordSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  } else {
    try {
      const username = req.body.username.toLowerCase();
      const pass = req.body.pass;
      const new_pass = req.body.new_pass;
      if (pass == new_pass) {
        res.status(400).json({ error: "you entered your current password" });
      } else {
        await sql.query(
          `CALL CheckPassByUsername('${username}')`,
          async (err, rows) => {
            console.log(rows[0]);
            const passData = rows[0].map((data) => data.pass);
            if (passData == "") {
              console.log(`Password data is '${passData}'`);
              res.status(401).json({ error: "invalid password" });
            } else {
              console.log(passData);
              const comparedpass = await checkPassword(pass, passData[0]);
              if (comparedpass) {
                const hashed_new_pass = await hashPassword(new_pass);
                console.log(hashed_new_pass);
                await sql.query(
                  `CALL ChangePassByUsername('${username}','${hashed_new_pass}')`
                );
                console.log(`${username} changed password`);
                //Send generic message to avoid exploit
                res.status(200).json({ message: "change password successful" });
              } else {
                console.log(`Change username failed: Password Incorrect`);
                res.status(401).json({ error: "invalid password" });
              }
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
});

module.exports = routesUser;
