const mySql = require('mysql2');
require('dotenv/config');

const mySqlConnection = mySql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

module.exports= mySqlConnection;