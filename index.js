const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const helmet = require('helmet')

app.use(helmet());

//implements files which contain their own routes
var users = require('./users');
app.use('/profile/users', users);

app.listen(port, () => console.log(`Example app listening on port ${port}!`))