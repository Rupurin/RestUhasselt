var QueryBuilder = require('./QueryBuilder')
var JSONPrettifier = require('./JSONprettifier');


module.exports = class QueryExecutor {
	constructor(){
	}

	getEndPoint(){	
		var fetch = require('isomorphic-fetch');
		var SparqlHttp = require('sparql-http-client');
		SparqlHttp.fetch = fetch;

		var endpoint = new SparqlHttp({
			endpointUrl: 'http://localhost:3030/Test/query',
			updateUrl: 'http://localhost:3030/Test/update'
		});
		return endpoint;
	}

	async executeGetQuery(query){
		var endpoint = this.getEndPoint();
		let result = await endpoint.selectQuery(query).then(function(resp){
			return resp.text();
		});
		return result;
	}

	async executeUpdateQuery(query){
		var endpoint = this.getEndPoint();
		let result = await endpoint.postQuery(query, {update:true}).then(function(resp){
			return resp.text();
		});
		return result;
	}

	async executeAskQuery(query){
		let result = await this.executeGetQuery(query);
		let output = JSON.parse(result);
		return output["boolean"];
	}

	reformGetOutput(result){
		try{
			let body = JSON.parse(result);
			let prettifier = new JSONPrettifier();
			let output = prettifier.prettify(body);
			return output;
		} catch(err){
			//result is the error explanation so send that along
			return result;
		}
	}

	async executeGetToOutput(query){
		let result = await this.executeGetQuery(query);
		return this.reformGetOutput(result);
	}

	updateQuerySuccesful(result){
		return /Update succeeded/.test(result);
	}

	async getMaximumUserID(){
		var query = `SELECT ?id WHERE 
		{
				?p linkrec:userid ?id .
		}   ORDER BY DESC (?id)
		LIMIT 1`;
		var qb = new QueryBuilder(query);

		let result = await this.executeGetQuery(qb.result());
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

	async checkUserExists(id){
		let query = `ASK {?p linkrec:userid $id .}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', id);
		return await this.executeAskQuery(qb.result());
	}
}