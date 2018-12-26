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

async function executeGetQuery(endpoint, query){
	let result = await endpoint.selectQuery(query).then(function(resp){
		return resp.text();
	});
	return result;
}

async function executeUpdateQuery(endpoint, query){
	let result = endpoint.postQuery(qb.result(), {update:true}).then(function(resp){
		return resp.text();
	});
	return result;
}

router.get('/', async (req, res) => {
	var endpoint = getEndPoint();
	var query = `SELECT DISTINCT ?name ?degreename ?email ?bio WHERE 
	{
		?p foaf:name ?name .
		?p linkrec:degree ?degree .
		?degree rdf:value ?degreename .
		?p vcard:email ?email .
		?p linkrec:BIO ?bio .
	}`;
	qb = new QueryBuilder(query);

	let result = await executeGetQuery(endpoint, qb.result());
	try{
		let output = prettifier.prettify(JSON.parse(result));
		res.send(output);
	} catch(err){
		//result is the error explanation so send that along
		res.send(result);
	}
});

router.get('/:id(\\d+)', async (req, res) => {
	var endpoint = getEndPoint();
	var query = `SELECT DISTINCT ?name ?degreename ?email ?bio WHERE 
	{
		?p linkrec:id $id .
		?p foaf:name ?name .
		?p linkrec:degree ?degree .
		?degree rdf:value ?degreename .
		?p vcard:email ?email .
		?p linkrec:BIO ?bio .
	}`;
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', req.params.id);
	
	let result = await executeGetQuery(endpoint, qb.result());
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

	let result = await executeUpdateQuery(endpoint, qb.result());
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

	result = await executeUpdateQuery(endpoint, qb.result());
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

module.exports = router;