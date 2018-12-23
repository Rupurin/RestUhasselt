const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const helmet = require('helmet')

app.use(helmet())

//left in as an example of how to accept params
app.get('/user/:name', (req, res) => {
	res.send('Hello ' + req.params.name + '!');
});


//implements files which contain their own routes
var users = require('./users');
app.use('/profile/users', users);

app.listen(port, () => console.log(`Example app listening on port ${port}!`))