var express = require('express')
var router = express.Router()
var QueryBuilder = require('./querybuilder')
let qbuilder = new QueryBuilder();

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

	var id = '"' + req.params.id + '"^^xsd:int';

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
	// PLEASE NOTE: execute bindParam BEFORE handling prefixes, otherwise it won't properly handle the param's type!!
	qb.bindParam('$id', id);
	//TODO: make function bindParamAsInt or something
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

router.get('/rdf2/update', (req, res) => {

	res.send("Deze endpoint werkt niet op het moment; ze is er alleen ingelaten om te laten zien hoe te updaten.");
	return;

	var fetch = require('isomorphic-fetch')
	var SparqlHttp = require('sparql-http-client')

	SparqlHttp.fetch = fetch;

	var endpoint = new SparqlHttp({endpointUrl: 'http://localhost:3030/Test/update'});
	var query = `INSERT {?p a ulbterm:Professor} WHERE {?p foaf:name "François Picalausa".}`;
	query = qbuilder.handleAllPrefixesKnown(query);

	endpoint.selectQuery(query).then(function(resp){
		return resp.text();
	}).then(function(body) {
		//parse body
		var result = JSON.parse(body);
		//output
		var output = JSON.stringify(result, null, ' ');
		console.log(output);
	}).catch(function (err){
		console.error(err);
	})

	//now check if it actually went through!
	endpoint = new SparqlHttp({endpointUrl: 'http://localhost:3030/Test/query'});
	query = `SELECT DISTINCT ?name {?p foaf:name ?name. ?p a ulbterm:Professor .}`;
	query = query.replace('foaf:name', '<http://xmlns.com/foaf/0.1/name>');	
	query = query.replace('ulbterm:Professor', '<http://code.ulb.ac.be/example/terms/Professor>');
	console.log(query);
	
	endpoint.selectQuery(query).then(function(resp){
		return resp.text();
	}).then(function(body) {
		//parse body
		var result = JSON.parse(body);
		//output
		var output = JSON.stringify(result, null, ' ');
		console.log(output);
		res.send(output);
	}).catch(function (err){
		console.error(err);
	})
});

module.exports = router;