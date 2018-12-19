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
	/*
	Stappen om draaiend te krijgen:
	1) download de zip op jena apache fuseki
	2) steek de .war in tomcat/webapps
	3) start tomcat (is deel van XAMPP, btw)
	4) ga naar localhost:8080/fuseki/
	5) maak nieuwe dataset, noem die "Test" (anders werkt het voorbeeld niet)
	6) upload staff.rdf (voor dit voorbeeld)
	7) probeer een paar queries in de tool daar, zoals:
	 	SELECT DISTINCT ?class
	 	WHERE {
			?s a ?class .
	 	}
	 	en
	 	PREFIX foaf: <http://xmlns.com/foaf/0.1/>
	 	SELECT ?name
	 	WHERE {
			?s foaf:name ?name .
	 	}
	8) run ".\fuseki-server --mem --update /Test" in de uitgezipte map van fuseki
	9) NIEUW: upload de file test.rdf
		(om de een of andere reden werkt updaten niet als ge op een file werkt)
	10) navigeer naar 
	http://localhost:3030/Test/query?query=SELECT%20DISTINCT%20%3Fclass%20WHERE%20%7B%3Fs%20a%20%3Fclass%20.%7D
		(kan zijn dat het andere poort is, kijk naar output van fuseki-server)
		Dit is dezelfde query als 7a, maar over HTTP
	11) open nieuwe terminal
	12) run "npm i"
	13) wacht tot alles geinstalleerd is
	14) run "node index.js"
	15) ga naar /rdf2
	16) meld resultaten
	17) ???
	18) Profit!

	Als er iets fout gaat:
		opzoeken en bidden
	*/
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