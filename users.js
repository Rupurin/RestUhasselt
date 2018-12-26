var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();


router.get('/', async (req, res) => {
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
	var query = `SELECT DISTINCT ?name ?degreename ?degreeorganization ?email ?bio WHERE 
	{
		?p linkrec:id $id .
		?p foaf:name ?name .
		?p vcard:email ?email .
		OPTIONAL {
			?p linkrec:degree ?degree .
			?degree rdf:value ?degreename .
			?degree vcard:organization ?degreeorganization .
			?p linkrec:BIO ?bio .
		}
	}`;
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', req.params.id);
	
	// Execute the query and reform into the desired output
	let output = await qe.executeGetToOutput(qb.result());
	// send the output
	res.send(output);
});

async function updateUserName(res, id, newname){
	//first, delete the old name
	var query = `DELETE {?p foaf:name ?name .} WHERE 
	{
		?p linkrec:id $id .
		?p foaf:name ?name .
	}`; 
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', id);

	let result = await qe.executeUpdateQuery(qb.result());
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Deletion of previous data did not succeed.\n" + result);
		return;
	}

	//second, insert the new name
	var query = `INSERT {?p foaf:name $newname .} WHERE 
	{
		?p linkrec:id $id .
	}`; 
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', id);
	qb.bindParamAsString('$newname', newname);

	result = await qe.executeUpdateQuery(qb.result());
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Insertion of new data did not succeed.\n" + result);
		return;
	}
	res.send(result);
}

async function updateEmail(res, id, newemail){
	//first, delete the old name
	var query = `DELETE {?p vcard:email ?email .} WHERE 
	{
		?p linkrec:id $id .
		?p vcard:email ?email .
	}`; 
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', id);

	let result = await qe.executeUpdateQuery(qb.result());
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Deletion of previous data did not succeed.\n" + result);
		return;
	}

	//second, insert the new name
	var query = `INSERT {?p vcard:email $newemail .} WHERE 
	{
		?p linkrec:id $id .
	}`; 
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', id);
	qb.bindParamAsString('$newemail', newemail);

	result = await qe.executeUpdateQuery(qb.result());
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Insertion of new data did not succeed.\n" + result);
		return;
	}
	res.send(result);
}

router.post('/:id', async (req, res) => {
	let id = req.params.id;
	let userExists = await qe.checkUserExists(id);

	if(!userExists){
		res.send("That user does not exist!");
		return;
	}

	// now that the user has been confirmed to exist, handle changes
	let anythingchanged = false;

	if(req.body.name !== undefined){
		 updateUserName(res, id, req.body.name);
		 anythingchanged = true;
	}
	if(req.body.email !== undefined){
		updateEmail(res, id, req.body.email);
		anythingchanged = true;
	}

	if(!anythingchanged){
		res.send("Nothing was done.");
	}
});

router.put('/', async (req, res) => {
	// check that all the params are there. TODO!

	// this is what we have to do to insert a new user:
	// STEP 1: get the latest ID
	var id = await qe.getMaximumID();

	//STEP 2: insert the new user so we can add his bits and bobs
	var query = `
	 INSERT DATA {
	 	<http://linkrec.be/terms#user$id> linkrec:id $idTyped .
	 }
	`;
	var qb = new QueryBuilder(query);
	qb.bindParam('$id', id + 1);
	qb.bindParamAsInt('$idTyped', id + 1);

	let result = await qe.executeUpdateQuery(qb.result());
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Insertion of new user did not succeed.\n" + result);
		return;
	}

	//STEP 3: insert the data of that new user, using what we just inserted
	query = `
		INSERT {
			?p foaf:name $name .
			?p vcard:email $email .
		}
		WHERE {
			?p linkrec:id $idTyped .
		}
	`
	qb = new QueryBuilder(query);
	qb.bindParamAsString('$name', req.body.name);
	qb.bindParamAsString('$email', req.body.email);
	qb.bindParamAsInt('$idTyped', id + 1);

	result = await qe.executeUpdateQuery(qb.result());
	if (!qe.updateQuerySuccesful(result)) {
		res.send("Insertion of data for the new user did not succeed.\n" + result);
		return;
	}

	res.send("New user inserted succesfully.");
})

module.exports = router;