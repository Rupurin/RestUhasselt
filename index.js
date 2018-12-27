const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const helmet = require('helmet');
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();
//this is needed to use the intermediary class which handles userinfo gets & updates
var UserInfoHandler = require('./UserInfoHandler');

//implements files which contain their own routes
var users = require('./users');
app.use('/profile/users', users);


app.get('/open-connections', async (req, res) => {
	if(req.body.thisUserID === undefined){
		res.send("No current user defined.");
		return;
	}
	//we will assume for now that the user asking for the connection exists!

	var query = `
		SELECT ?name {
			?x foaf:name ?name .
			?p linkrec:id $id .
			?x linkrec:connected ?p .
			FILTER NOT EXISTS {?p linkrec:connected ?x .}
		}`;
	let qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', req.body.thisUserID);

	// Execute the query and reform into the desired output
	let output = await qe.executeGetToOutput(qb.result());
	// send the output
	res.send(output);
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))