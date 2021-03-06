const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const helmet = require('helmet');
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./QueryBuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();
//intermediary class that handles user info
var UserInfoHandler = require('./UserInfoHandler');

//routes all /profile/users/.... requests via users.js
var users = require('./users');
app.use('/profile/users', users);
//routes all /company/.... requests via company.js
var company = require('./company');
app.use('/company', company);
// routes all /vacancies/... requests via vacancies.js
var vacancies = require('./vacancies');
app.use('/vacancies', vacancies);
//routes all /login requests via authentication.js
var authentication = require('./authentication');
app.use('/login', authentication.router);


// Wouldn't this endpoint be better in /profile/users/...?
app.get('/open-connections', async (req, res) => {
	if(req.body.thisUserID === undefined){
		res.send("No current user defined.");
		return;
	}

	let userId;
    try{
        userId = Authentication.authenticate(req.body.token);
    }catch(err){
        res.send(err);
        return;
    }

	let userExists = await qe.checkUserExists(userId);
	if(!userExists){
		res.send("The user that's attempting to connect does not exist.");
		return;
	}

	var handler = new UserInfoHandler(userID);
	let output = await handler.getOpenConnections();
	// send the output
	res.send(output);
});


app.listen(port, () => console.log(`App listening on port ${port}!`))