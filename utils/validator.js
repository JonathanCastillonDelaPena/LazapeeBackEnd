const joi = require("joi");

const signupSchema = joi.object({
     first_name: joi.string().regex(/^[\w\-\s]+$/).min(3).max(25).trim(true).required(),
     last_name: joi.string().regex(/^[\w\-\s]+$/).min(3).max(25).trim(true).required(),
     email: joi.string().email().lowercase().trim(true).required(),
     pass: joi.string().min(8).trim(true).required(),
     username: joi.string().alphanum().lowercase().min(3).max(25).trim(true).required(),
     gender: joi.string().alphanum().min(3).max(25).trim(true).required(),
});

const updateSchema = joi.object({
    first_name: joi.string().regex(/^[\w\-\s]+$/).min(3).max(25).trim(true).required(),
    last_name: joi.string().regex(/^[\w\-\s]+$/).min(3).max(25).trim(true).required(),
    gender: joi.string().alphanum().min(3).max(25).trim(true).required(),
});

const loginSchema = joi.object({
    username: joi.string().alphanum().min(3).max(25).trim(true).required(),
    pass: joi.string().min(8).trim(true).required(),
});

const usernameSchema = joi.object({
    username: joi.string().alphanum().min(3).max(25).trim(true).required(),
    new_username: joi.string().alphanum().min(3).max(25).trim(true).required(),
    pass: joi.string().min(8).trim(true).required(),
});

const emailSchema = joi.object({
    username: joi.string().alphanum().min(3).max(25).trim(true).required(),
    new_email: joi.string().email().lowercase().trim(true).required(),
    pass: joi.string().min(8).trim(true).required(),
});

const passwordSchema = joi.object({
    username: joi.string().alphanum().min(3).max(25).trim(true).required(),
    pass: joi.string().min(8).trim(true).required(),
    new_pass: joi.string().min(8).trim(true).required(),
});

module.exports = {signupSchema,loginSchema,updateSchema,emailSchema,usernameSchema,passwordSchema}