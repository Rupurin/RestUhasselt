var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();
//this is needed to use the intermediary class which handles userinfo gets & updates
var UserInfoHandler = require('./UserInfoHandler');

router.get('/', async (req, res) => {
	//TODO: move this to userinfohandler
	var query = `SELECT DISTINCT ?name ?degreename ?degreeorganization ?email ?bio WHERE 
	{
		?p foaf:name ?name .
		?p linkrec:degree ?degree .
		?degree rdf:value ?degreename .
		?degree vcard:organization ?degreeorganization .
		?p vcard:email ?email .
		?p linkrec:BIO ?bio .
	}`;
	qb = new QueryBuilder(query);

	// Execute the query and reform into the desired output
	let output = await qe.executeGetToOutput(qb.result());
	// send the output
	res.send(output);
});

router.get('/:id(\\d+)', async (req, res) => {
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.send("That user does not exist.");
		return;
	}
	let output = await handler.getUserInfo();
	// send the output
	res.send(output);
});

async function updateUserName(res, id, newname){
	let handler = new UserInfoHandler(id);
	let success = await handler.deleteUserName(res);
	success = success && await handler.insertUserName(res, newname);
	return success;
}

async function updateEmail(res, id, newemail){
	let handler = new UserInfoHandler(id);
	let success = await handler.deleteEmail(res);
	success = success && await handler.insertEmail(res, newemail);
	return success;
}

async function updateLocation(res, id, newlat, newlong){
	let handler = new UserInfoHandler(id);
	let success = await handler.deleteLocation(res);
	success = success && await handler.insertLocation(res, newlat, newlong);
	return success;
}

router.post('/:id', async (req, res) => {
	let id = req.params.id;
	if(req.body.thisUserID != id){
		res.send("You do not have permission to edit this profile.");
		return;
	}

	let userExists = await qe.checkUserExists(id);
	if(!userExists){
		res.send("That user does not exist!");
		return;
	}

	// now that the user has been confirmed to exist & have permission, handle changes
	let anythingchanged = false;
	let success = true;

	if(req.body.name !== undefined){
		 success = success && updateUserName(res, id, req.body.name);
		 anythingchanged = true;
	}
	if(req.body.email !== undefined){
		success = success &&updateEmail(res, id, req.body.email);
		anythingchanged = true;
	}

	if(req.body.lat !== undefined && req.body.long !== undefined){
		success = success &&updateLocation(res, id, req.body.lat, req.body.long);
		anythingchanged = true;
	}

	if(!anythingchanged){
		res.send("No valid parameters were passed.");
	}
	else{
		if(success){
			res.send("Update succesfull!");
		}
	}
});

router.put('/', async (req, res) => {
	// check that all the params are there. TODO!
	var handler = new UserInfoHandler(-1);
	if(!handler.hasNeededParams(req.body)){
		res.send("Needed params are missing. Aborting PUT request.");
		return;
	}

	// this is what we have to do to insert a new user:
	// STEP 1: get the latest ID
	var id = await qe.getMaximumUserID();
	if(id === -1){
		res.send("Something went wrong trying to create the new user.");
		return;
	}
	handler.setUserID(id + 1);

	//STEP 2: insert the new user so we can add his bits and bobs
	let result = await handler.addNewUser();
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Insertion of new user did not succeed.\n" + result);
		return;
	}

	//STEP 3: insert the data of that new user, using what we just inserted
	result = await handler.addUserInfo(req.body);
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Insertion of data for the new user did not succeed.\n" + result);
		return;
	}

	res.send("New user inserted succesfully.");
});

router.post('/:id/connect', async (req, res) => {
	if(req.body.thisUserID === undefined){
		res.send("No current user defined.");
		return;
	}

	let userExists = await qe.checkUserExists(req.body.thisUserID);
	if(!userExists){
		res.send("The user that's attempting to connect does not exist.");
		return;
	}

	let otheruserExists = await qe.checkUserExists(req.params.id);
	if(!otheruserExists){
		res.send("The user that's being connected to does not exist.");
		return;
	}

	var query = `
		INSERT {
			?x linkrec:connected ?y .
		} WHERE {
			?x linkrec:userid $connectedUser .
			?y linkrec:userid $connectingUser .
		}`;
	let qb = new QueryBuilder(query);
	qb.bindParamAsInt('$connectingUser', req.body.thisUserID);
	qb.bindParamAsInt('$connectedUser', req.params.id);

	let result = await qe.executeUpdateQuery(qb.result());
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Making a connection did not succeed.\n" + result);
		return;
	}

	res.send(result);
});

module.exports = router;