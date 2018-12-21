const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const helmet = require('helmet')

app.use(helmet())

app.get('/', (req, res) => res.send('Hello world!'));

//left in as an example of how to accept params
app.get('/user/:name', (req, res) => {
	res.send('Hello ' + req.params.name + '!');
});

function handleRDFPrefix(query, prefixShort, prefixLong){
	let i = query.indexOf(prefixShort);
	if(i === -1)
		return query;
	//else: 
	//we know the short prefix is in the query
	//so we'll need to replace it
	let tmp = query.substr(i, query.length);	

	//tmp is now prefixShort:xxxx
	tmp = tmp.substr(0,tmp.indexOf(" "));

	//tmp2 is now xxxx
	let tmp2 = tmp.substr(tmp.indexOf(":") + 1, tmp.length);
	//make tmp2 into the full, non-shortened URI
	tmp2 = "<" + prefixLong + tmp2 + ">";

	return query.replace(tmp, tmp2);
}

function handleAllPrefixesKnown(query){
	query = handleRDFPrefix(query, 'linkrec', 'http://linkrec.be/terms');
	query = handleRDFPrefix(query, 'rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
	query = handleRDFPrefix(query, 'foaf', 'http://xmlns.com/foaf/0.1/');
	console.log(query);
	return query;
}

function prettifyJSONResponse(obj){
	let tmp = obj.results.bindings;
	tmp = JSON.stringify(tmp, null, ' ');
	return tmp;
}

app.get('/rdf2', (req, res) => {
	var fetch = require('isomorphic-fetch')
	var SparqlHttp = require('sparql-http-client')

	SparqlHttp.fetch = fetch

	var endpoint = new SparqlHttp({endpointUrl: 'http://localhost:3030/Test/query'});
	var query = `SELECT DISTINCT ?name ?degreename WHERE 
	{
		?s foaf:name ?name .
		?s linkrec:degree ?degree .
		?degree rdf:value ?degreename .
	}`;
	query = handleAllPrefixesKnown(query);

	endpoint.selectQuery(query).then(function(resp){
		return resp.text();
	}).then(function(body) {
		//parse body
		var result = JSON.parse(body);
		let output = prettifyJSONResponse(result);
		res.send(output);
	}).catch(function (err){
		console.error(err);
	})
});

app.get('/rdf2/update', (req, res) => {

	res.send("Deze endpoint werkt niet op het moment; ze is er alleen ingelaten om te laten zien hoe te updaten.");
	return;

	var fetch = require('isomorphic-fetch')
	var SparqlHttp = require('sparql-http-client')

	SparqlHttp.fetch = fetch;

	var endpoint = new SparqlHttp({endpointUrl: 'http://localhost:3030/Test/update'});
	var query = `INSERT {?p a ulbterm:Professor} WHERE {?p foaf:name "François Picalausa".}`;
	query = handleAllPrefixesKnown(query);

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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))