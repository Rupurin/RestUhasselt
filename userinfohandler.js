var QueryBuilder = require('./QueryBuilder')
var JSONPrettifier = require('./JSONprettifier');
var QueryExecutor = require('./QueryExecutor');
var qe = new QueryExecutor();

module.exports = class UserInfoHandler {
	constructor(id){
		this.userID = id;
	}

	async getUserInfo(){
		var query = `SELECT DISTINCT ?name ?degreename ?degreeorganization ?email ?bio WHERE 
		{
			?p linkrec:userid $id .
			?p foaf:name ?name .
			?p vcard:email ?email .
			OPTIONAL {
				?p linkrec:degree ?degree .
				?degree rdf:value ?degreename .
				?degree vcard:organization ?degreeorganization .
				?p linkrec:BIO ?bio .
			}
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);
		
		// Execute the query and reform into the desired output
		let output = await qe.executeGetToOutput(qb.result());
		return output;
	}

	async deleteUserName(res){
		var query = `DELETE {?p foaf:name ?name .} WHERE 
		{
			?p linkrec:userid $id .
			?p foaf:name ?name .
		}`; 
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);

		let result = await qe.executeUpdateQuery(qb.result());
		if (!qe.updateQuerySuccesful(result)) {
			res.send("Deletion of previous data did not succeed.\n" + result);
			return false;
		}
		return true;
	}

	async insertUserName(res, newname){
		//second, insert the new name
		var query = `INSERT {?p foaf:name $newname .} WHERE 
		{
			?p linkrec:userid $id .
		}`; 
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);
		qb.bindParamAsString('$newname', newname);

		let result = await qe.executeUpdateQuery(qb.result());
		if (!qe.updateQuerySuccesful(result)) {
			res.send("Insertion of new data did not succeed.\n" + result);
			return false;
		}
		return true;
		//res.send(result);
	}

	async deleteEmail(res){		
		var query = `DELETE {?p vcard:email ?email .} WHERE 
		{
			?p linkrec:userid $id .
			?p vcard:email ?email .
		}`; 
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);

		let result = await qe.executeUpdateQuery(qb.result());
		if (!qe.updateQuerySuccesful(result)) {
			res.send("Deletion of previous data did not succeed.\n" + result);
			return false;
		}
		return true;
	}

	async insertEmail(res, newemail){
		var query = `INSERT {?p vcard:email $newemail .} WHERE 
		{
			?p linkrec:userid $id .
		}`; 
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);
		qb.bindParamAsString('$newemail', newemail);

		let result = await qe.executeUpdateQuery(qb.result());
		if (!qe.updateQuerySuccesful(result)) {
			res.send("Insertion of new data did not succeed.\n" + result);
			return false;;
		}
		return true;
	}

	async deleteLocation(res){
		var query = `DELETE {
			?loc geo:lat ?lat .
			?loc geo:long ?long .
		} WHERE 
		{
			?p linkrec:userid $id .
			?p linkrec:based_near ?loc .
			?loc geo:lat ?lat .
			?loc geo:long ?long .
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);

		let result = await qe.executeUpdateQuery(qb.result());
		if (!qe.updateQuerySuccesful(result)) {
			res.send("Deletion of previous data did not succeed.\n" + result);
			return false;
		}
		return true;
	}

	async insertLocation(res, newlat, newlong){
		var query = `INSERT 
		{
			?loc geo:lat $lat .
			?loc geo:long $long .
		} WHERE 
		{
			?p linkrec:userid $id .
			?p linkrec:based_near ?loc .
		}`; 
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);
		qb.bindParamAsString('$lat', newlat);
		qb.bindParamAsString('$long', newlong);

		let result = await qe.executeUpdateQuery(qb.result());
		if (!qe.updateQuerySuccesful(result)) {
			res.send("Insertion of new data did not succeed.\n" + result);
			return false;
		}
		return true;
	}

	hasNeededParams(params){
		if(params.name === undefined)
			return false;		
		if(params.email === undefined)
			return false;
		if(params.degreename === undefined)
			return false;
		if(params.degreeorganization === undefined)
			return false;		
		if(params.lat === undefined)
			return false;
		if(params.long === undefined)
			return false;
		if(params.bio === undefined)
			return false;
		if(params.maxDistance === undefined)
			return false;
		if(params.workExperience === undefined)
			return false;
		return true;
	}
}