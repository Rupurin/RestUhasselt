'use strict'

var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

//needed for authentication of the JWT
var Authentication = require('./authentication');
//this is needed to build the queries
var QueryBuilder = require('./QueryBuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();
//this is needed to use the intermediary class which handles userinfo gets & updates
var UserInfoHandler = require('./UserInfoHandler');

/**
 * return a list of all the users
 */
router.get('/', async (req, res) => {
	let output = await UserInfoHandler.getAllUsers();
	// send the output
	res.send(output);
});

/**
 * return the info of a single user
 * @param req.params.id //url parameter
 */
router.get('/:id(\\d+)', async (req, res) => {
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.status(404).send("That user does not exist.");
		return;
	}
	let output = await handler.getUserInfo();
	// send the output
	res.send(output);
});

/**
 * return a list of all the work experience a user has
 * @param req.params.id //url parameter
 */
router.get('/:id(\\d+)/workExperience', async (req, res) =>{
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.status(404).send("That user does not exist.");
		return;
	}

	//do the actual query
	let output = await handler.getWorkExperience();
	res.send(output);
});

/**
 * adds work experience to a user
 * @param req.params.id //url parameter
 * @param req.body.token
 * @param req.body.field
 * @param req.body.duration
 */
router.post('/:id(\\d+)/workExperience', async (req, res) =>{
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.status(404).send("That user does not exist.");
		return;
	}
	
	let userId;
	try{
		userId = Authentication.authenticate(req.body.token);
	}catch(err){
		res.status(401).send(err);
		return;
	}

	let hasEditPermission = handler.hasEditPermission(userId);
	if(!hasEditPermission){
		res.status(401).send("You do not have permission to edit this information.");
		return;
	}

	if(req.body.field === undefined || req.body.duration === undefined){
		res.status(400).send("You have not included a field or a duration variable.");
		return;
	}

	//do the actual query
	let result = await handler.addWorkExperience(req.body);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Setting work experience did not succeed.\n" + result);
		return;
	}
	res.send("New work experience added.");
});

/**
 * removes work experience from a user
 * must match perfectly ro remove
 * @param req.params.id //url parameter
 * @param req.body.token
 * @param req.body.field
 * @param req.body.duration
 */
router.post('/:id(\\d+)/workExperience/remove', async (req, res) =>{
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.status(404).send("That user does not exist.");
		return;
	}
	
	let userId;
	try{
		userId = Authentication.authenticate(req.body.token);
	}catch(err){
		res.status(401).send(err);
		return;
	}

	let hasEditPermission = handler.hasEditPermission(userId);
	if(!hasEditPermission){
		res.status(401).send("You do not have permission to edit this information.");
		return;
	}

	if(req.body.field === undefined || req.body.duration === undefined){
		res.status(400).send("You have not included a field or a duration variable.");
		return;
	}


	//do the actual query
	let result = await handler.removeWorkExperience(req.body);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Removing work experience did not succeed.\n" + result);
		return;
	}
	res.send("Work experience removed succesfully.");
});

/**
 * changes the job hunting status of the user
 * @param req.params.id //url parameter
 * @param req.body.token
 * @param {boolean} req.body.isJobHunting
 */
router.post('/:id(\\d+)/setJobHunting', async (req, res) =>{
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.status(404).send("That user does not exist.");
		return;
	}

	let userId;
	try{
		userId = Authentication.authenticate(req.body.token);
	}catch(err){
		res.status(401).send(err);
		return;
	}

	let hasEditPermission = handler.hasEditPermission(userId);
	if(!hasEditPermission){
		res.status(401).send("You do not have permission to edit this information.");
		return;
	}

	let result = await handler.setJobHunting(res, req.body.isJobHunting === 'true');
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Setting jobhuntingness did not succeed.\n" + result);
		return;
	}
	res.send(result);
});

/**
 * changes the information of a user
 * @param req.params.id //url parameter
 * @param req.body.token
 * all optional
 * @param req.body.name
 * @param req.body.email
 * @param req.body.lat
 * @param req.body.long
 * @param req.body.maxDistance
 * @param req.body.bio
 * 
 */
router.post('/:id(\\d+)', async (req, res) => {
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.status(404).send("That user does not exist.");
		return;
	}	
	
	let userId;
	try{
		userId = Authentication.authenticate(req.body.token);
	}catch(err){
		res.status(401).send(err);
		return;
	}

	let hasEditPermission = handler.hasEditPermission(userId);
	if(!hasEditPermission){
		res.status(401).send("You do not have permission to edit this information.");
		return;
	}

	// now that the user has been confirmed to exist & have permission, handle changes
	await handler.updateInfo(res, req.body);
});

/**
 * Create a new user
 * @param req.body.name
 * @param req.body.password
 * @param req.body.email
 * @param req.body.degreeName
 * @param req.body.degreeorganization
 * @param req.body.lat
 * @param req.body.long
 * @param req.body.maxDistance
 * @param req.body.bio
 */
router.put('/', async (req, res) => {
	// check that all the params are there.
	var handler = new UserInfoHandler(-1);
	if(!handler.hasNeededParams(req.body)){
		res.status(400).send("Needed params are missing. Aborting PUT request.");
		return;
	}

	// this is what we have to do to insert a new user:
	// STEP 1: get the latest ID
	var id = await qe.getMaximumUserID();
	if(id === -1){
		res.status(500).send("Something went wrong trying to create the new user.");
		return;
	}
	handler.setUserID(id + 1);

	//STEP 2: insert the new user so we can add his bits and bobs
	let result = await handler.addNewUser();
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Insertion of new user did not succeed.\n" + result);
		return;
	}

	//STEP 3: insert the data of that new user, using what we just inserted
	result = await handler.addUserInfo(req.body);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Insertion of data for the new user did not succeed.\n" + result);
		return;
	}

	res.send("New user inserted succesfully.");
});

/**
 * make a friend request
 * @param req.params.id //url parameter
 * @param req.body.token
 */
router.post('/:id(\\d+)/connect', async (req, res) => {
	let userId;
	try{
		userId = Authentication.authenticate(req.body.token);
	}catch(err){
		res.status(401).send(err);
		return;
	}

	if(userId === req.params.id){
		res.status(400).send("You cannot connect with yourself.");
		return;
	}

	let otheruserExists = await qe.checkUserExists(req.params.id);
	if(!otheruserExists){
		res.status(404).send("The user that's being connected to does not exist.");
		return;
	}

	let handler = new UserInfoHandler(userId);
	let result = await handler.connectTo(req.params.id);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Making a connection did not succeed.\n" + result);
	}

	res.send("Connection added succesfully.");
});

/**
 * returns a list off all the degrees of a user
 * @param req.params.id //url parameter
 */
router.get('/:id(\\d+)/degrees', async (req, res) => {
	let handler = new UserInfoHandler(req.params.id);
	let exists = await handler.thisUserExists();
	if(!exists){
		res.status(404).send("That user does not exist.");
		return;
	}	

	let result = await handler.getDegrees();
	res.send(result);
});


/**
 * add a degree to a user
 * @param req.params.id //url parameter
 * @param req.body.token
 * @param req.body.organization
 * @param req.body.title
 */
router.put('/:id(\\d+)/degrees', async (req, res) => {
	let userId;
	try{
		userId = Authentication.authenticate(req.body.token);
	}catch(err){
		res.status(401).send(err);
		return;
	}

	var handler = new UserInfoHandler(req.params.id);
	let otheruserExists = await handler.thisUserExists();
	if(!otheruserExists){
		res.status(404).send("The user in your url does not exist. use: localhost:3000/profile/users/" + userId + "/degrees instead" );
		return;
	}

	let hasEditPermission = handler.hasEditPermission(userId);
	if(!hasEditPermission){
		res.status(401).send("You do not have permission to edit this information. use: localhost:3000/profile/users/" + userId + "/degrees instead");
		return;
	}

	// check that all the params are there.
	if(req.body.title === undefined || req.body.organization === undefined){
		res.status(400).send("Needed params are missing. Aborting PUT request.");
		return;
	}

	let result = await handler.addDegree(req.body.title, req.body.organization);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Adding a degree did not succeed.\n" + result);
	}
	res.send("New degree inserted succesfully.");
});

/**
 * removes a degree of a user
 * @param req.params.id //url parameter
 * @param req.body.token
 * @param req.body.title
 * @param req.body.organization
 */
router.post('/:id(\\d+)/degrees/remove', async (req, res) => {
	let userId;
	try{
		userId = Authentication.authenticate(req.body.token);
	}catch(err){
		res.status(401).send(err);
		return;
	}

	var handler = new UserInfoHandler(req.params.id);
	let otheruserExists = await handler.thisUserExists();
	if(!otheruserExists){
		res.status(404).send("The user that's being connected to does not exist.");
		return;
	}

	let hasEditPermission = handler.hasEditPermission(userId);
	if(!hasEditPermission){
		res.status(401).send("You do not have permission to edit this information.");
		return;
	}
	
	// check that all the params are there.
	if(req.body.title === undefined || req.body.organization === undefined){
		res.status(400).send("Needed params are missing. Aborting POST request.");
		return;
	}

	let result = await handler.removeDegree(req.body.title, req.body.organization);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Removing degree did not succeed.\n" + result);
	}
	res.send("Degree removed succesfully.");
});

module.exports = router;