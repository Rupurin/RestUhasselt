var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded());
var QueryBuilder = require('./querybuilder')

router.get('/test', function (req, res) {
	res.send('Users home page.');
})

function prettifyJSONResponse(obj){
	let tmp = obj.results.bindings;
	tmp = JSON.stringify(tmp, null, ' ');
	return tmp;
}

router.get('/:id', (req, res) => {
	var fetch = require('isomorphic-fetch')
	var SparqlHttp = require('sparql-http-client')

	SparqlHttp.fetch = fetch;

	var endpoint = new SparqlHttp({endpointUrl: 'http://localhost:3030/Test/query'});
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
	// PLEASE NOTE: execute bindParam BEFORE handling prefixes, otherwise it might not properly handle the param's type!!
	qb.bindParamAsInt('$id', req.params.id);
	qb.handleAllPrefixesKnown();

	endpoint.selectQuery(qb.result()).then(function(resp){
		return resp.text();
	}).then(function(body) {
		//parse body
		var result = JSON.parse(body);
		let output = prettifyJSONResponse(result);
		res.send(output);
	}).catch(function (err){
		console.error(err);
		res.send("Error!");
	})
});

function updateUserName(res, id, newname){
	var fetch = require('isomorphic-fetch')
	var SparqlHttp = require('sparql-http-client')

	SparqlHttp.fetch = fetch;
	//first, delete the old name
	var endpoint = new SparqlHttp({updateUrl: 'http://localhost:3030/Test/update'});
	var query = `DELETE {?p foaf:name ?name .} WHERE 
	{
		?p linkrec:id $id .
		?p foaf:name ?name .
	}`; 
	qb = new QueryBuilder(query);
	// PLEASE NOTE: execute bindParam BEFORE handling prefixes, otherwise it might not properly handle the param's type!!
	qb.bindParamAsInt('$id', id);
	qb.handleAllPrefixesKnown();

	endpoint.postQuery(qb.result(), {update:true}).then(function(resp){
		return resp.text();
	}).then(function(body) {
		//should be OK, so we can safely do nothing here
	}).catch(function (err){
		console.error(err);
		res.send(err);
	})

	//second, insert the new name
	var query = `INSERT {?p foaf:name $newname .} WHERE 
	{
		?p linkrec:id $id .
	}`; 
	qb = new QueryBuilder(query);
	// PLEASE NOTE: execute bindParam BEFORE handling prefixes, otherwise it won't properly handle the param's type!!
	qb.bindParamAsInt('$id', id);
	qb.bindParamAsString('$newname', newname);
	qb.handleAllPrefixesKnown();

	endpoint.postQuery(qb.result(), {update:true}).then(function(resp){
		return resp.text();
	}).then(function(body) {
		res.send(body);
	}).catch(function (err){
		console.error(err);
		res.send(err);
	})
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