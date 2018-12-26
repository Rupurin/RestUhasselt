var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to make the JSON outputs prettier
var JSONPrettifier = require('./JSONprettifier');
var prettifier = new JSONPrettifier();


// TODO: move the following async functions to their own class, QueryExecutor

function getEndPoint(){	
	var fetch = require('isomorphic-fetch');
	var SparqlHttp = require('sparql-http-client');
	SparqlHttp.fetch = fetch;

	var endpoint = new SparqlHttp({
		endpointUrl: 'http://localhost:3030/Test/query',
		updateUrl: 'http://localhost:3030/Test/update'
	});
	return endpoint;
}

async function executeGetQuery(query){
	var endpoint = getEndPoint();
	let result = await endpoint.selectQuery(query).then(function(resp){
		return resp.text();
	});
	return result;
}

async function executeUpdateQuery(query){
	var endpoint = getEndPoint();
	let result = endpoint.postQuery(query, {update:true}).then(function(resp){
		return resp.text();
	});
	return result;
}

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

	let result = await executeGetQuery(qb.result());
	try{
		let output = prettifier.prettify(JSON.parse(result));
		res.send(output);
	} catch(err){
		//result is the error explanation so send that along
		res.send(result);
	}
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
	
	let result = await executeGetQuery(qb.result());
	try{
		let output = prettifier.prettify(JSON.parse(result));
		res.send(output);
	} catch(err){
		//result is the error explanation so send that along
		res.send(result);
	}
});

async function updateUserName(res, id, newname){
	//first, delete the old name
	var endpoint = getEndPoint();
	var query = `DELETE {?p foaf:name ?name .} WHERE 
	{
		?p linkrec:id $id .
		?p foaf:name ?name .
	}`; 
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', id);

	let result = await executeUpdateQuery(qb.result());
	let updateSuccess = /Update succeeded/.test(result);
	if (!updateSuccess) {
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

	result = await executeUpdateQuery(qb.result());
	//check for result being correct!
	updateSuccess = /Update succeeded/.test(result);
	if (!updateSuccess) {
		res.send("Insertion of new data did not succeed.\n" + result);
		return;
	}
	res.send(result);
}

router.post('/:id', (req, res) => {
	//replace the name
	if(req.body.name !== undefined){
		 updateUserName(res, req.params.id, req.body.name);
	}
	else{
		res.send("Nothing was done.");
	}
});

async function getMaximumID(){
	var endpoint = getEndPoint();
	var query = `SELECT ?id WHERE 
	{
			?p linkrec:id ?id .
	}   ORDER BY DESC (?id)
	LIMIT 1`;
	var qb = new QueryBuilder(query);

	let result = await executeGetQuery(qb.result());
	let output;
	try{
		output = JSON.parse(result);
	} catch(err){
		//result is the error explanation so send that along
		res.send(result);
		return;
	}
	var id = output.results.bindings[0]["id"]["value"];
	return parseInt(id);
}

router.put('/', async (req, res) => {
	// check that all the params are there. TODO

	// this is what we have to do to insert a new user:
	// STEP 1: get the latest ID
	var id = await getMaximumID();

	//STEP 2: insert the new user so we can add his bits and bobs
	var query = `
	 INSERT DATA {
	 	<http://linkrec.be/terms#user$id> linkrec:id $idTyped .
	 }
	`;
	var qb = new QueryBuilder(query);
	qb.bindParam('$id', id + 1);
	qb.bindParamAsInt('$idTyped', id + 1);

	let result = await executeUpdateQuery(qb.result());
	let updateSuccess = /Update succeeded/.test(result);
	if (!updateSuccess) {
		res.send("Insertion of new user did not succeed.\n" + result);
		return;
	}

	//STEP 3: insert the data of that new user, based on what we just inserted
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

	result = await executeUpdateQuery(qb.result());
	updateSuccess = /Update succeeded/.test(result);
	if (!updateSuccess) {
		res.send("Insertion of data for the new user did not succeed.\n" + result);
		return;
	}

	res.send("New user inserted succesfully.");

	//get all the params, then throw the data 
})

module.exports = router;