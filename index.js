const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const helmet = require('helmet')

app.use(helmet())

app.get('/', (req, res) => res.send('Hello world!'));

app.get('/user/:name', (req, res) => {
	res.send('Hello ' + req.params.name + '!');
});

function test(){
	return 'lol';
}

app.get('/asynctest', async (req, res) => {
	let t = await test();
	res.send(t);
})

app.get('/rdf2', (req, res) => {
	var fetch = require('isomorphic-fetch')
	var SparqlHttp = require('sparql-http-client')

	SparqlHttp.fetch = fetch

	var endpoint = new SparqlHttp({endpointUrl: 'http://localhost:3030/Test/query'});
	//var query = 'SELECT DISTINCT ?class WHERE {?s a ?class .}';
	var query = `SELECT ?name WHERE {?s foaf:name ?name .}`;
	query = query.replace('foaf:name', '<http://xmlns.com/foaf/0.1/name>');
	console.log(query)

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

app.get('/rdf2/update', (req, res) => {

	res.send("Deze endpoint werkt niet op het moment.");

	var fetch = require('isomorphic-fetch')
	var SparqlHttp = require('sparql-http-client')

	SparqlHttp.fetch = fetch;

	var endpoint = new SparqlHttp({endpointUrl: 'http://localhost:3030/Test/update'});
	var query = `INSERT {?p a ulbterm:Professor} WHERE {?p foaf:name "François Picalausa".}`;
	query = query.replace('foaf:name', '<http://xmlns.com/foaf/0.1/name>');	
	query = query.replace('ulbterm:Professor', '<http://code.ulb.ac.be/example/terms/Professor>');
	console.log(query)

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