var QueryBuilder = require('./QueryBuilder')
var JSONPrettifier = require('./JSONprettifier');
var QueryExecutor = require('./QueryExecutor');
var qe = new QueryExecutor();

module.exports = class UserInfoHandler {
	constructor(id){
		this.userID = id;
	}

	setUserID(id){
		this.userID = parseInt(id,10);
	}

	getUserID(){
		return this.userID;
	}

	async thisUserExists(){
		return qe.checkUserExists(this.userID);
	}

	async getUserInfo(){
		var query = `SELECT DISTINCT ?name ?degreename ?degreeorganization ?email ?bio ?lat ?long ?maxDistance WHERE 
		{
			?p linkrec:userid $id .
			?p foaf:name ?name .
			?p vcard:email ?email .
			?p linkrec:based_near ?loc .
			?loc geo:lat ?lat .
			?loc geo:long ?long .
			?p linkrec:maxDistance ?maxDistance .
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

	/**
	 * returns the id and password of the user
	 * @param {string} userName the username of the person you want to get info about
	 */
	static async getUserInfo(userName){
		var query = `SELECT DISTINCT ?id ?pass WHERE 
		{
			?p foaf:name $name .
			?p linkrec:userid ?id .
			?p linkrec:pass ?pass .
		}
		LIMIT 1`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsString('$name', userName);
		
		// Execute the query and reform into the desired output
		let output = await qe.executeGetToOutput(qb.result());
		return output;
	}

	async getWorkExperience(){
		var query = `SELECT ?field ?duration WHERE 
		{
			?p linkrec:userid $id .
			?p linkrec:workExperience ?exp .
			?exp linkrec:field ?field .
			?exp linkrec:workDuration ?duration .
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);
		
		// Execute the query and reform into the desired output
		let output = await qe.executeGetToOutput(qb.result());
		return output;
	}

	async addWorkExperience(params){
		var query = `INSERT 
		{
			?p linkrec:workExperience 
			[
				linkrec:field $field ;
				linkrec:workDuration $duration
			]
		}
		WHERE {
			?p linkrec:userid $idTyped .
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsString('$field', params.field);
		qb.bindParamAsString('$duration', params.duration);
		qb.bindParamAsInt('$idTyped', this.userID);
		
		// Execute the query and reform into the desired output
		return await qe.executeUpdateQuery(qb.result());
	}

	async addNewUser(){
		var query = `
			INSERT DATA {
				<http://linkrec.be/terms#user$id> linkrec:userid $idTyped .
			}
		`;
		var qb = new QueryBuilder(query);
		qb.bindParam('$id', this.userID);
		qb.bindParamAsInt('$idTyped', this.userID);

		return await qe.executeUpdateQuery(qb.result());
	}

	async addUserInfo(params){
		let query = `
			INSERT {
				?p foaf:name $name .
				?p vcard:email $email .
				?p linkrec:degree [ rdf:value $degreename ; vcard:organization $degreeorganization ] .
				?p linkrec:based_near [ geo:lat $lat ; geo:long $long ] .
				?p a linkrec:User .
				?p linkrec:BIO $bio .
				?p linkrec:maxDistance $maxDistance .
			}
			WHERE {
				?p linkrec:userid $idTyped .
			}
		`
		let qb = new QueryBuilder(query);
		qb.bindParamAsString('$name', params.name);
		qb.bindParamAsString('$email', params.email);
		qb.bindParamAsString('$degreename', params.degreename);
		qb.bindParamAsString('$degreeorganization', params.degreeorganization);
		qb.bindParamAsString('$lat', params.lat);	
		qb.bindParamAsString('$long', params.long);
		qb.bindParamAsString('$bio', params.bio);
		qb.bindParamAsString('$maxDistance', params.maxDistance);
		qb.bindParamAsInt('$idTyped', this.userID);

		let output = await qe.executeUpdateQuery(qb.result());
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

	async deleteJobHunting(){
		var query = `DELETE {
			?p linkrec:jobhunting ?j .
		} WHERE 
		{
			?p linkrec:userid $id .
			?p linkrec:jobhunting ?j .
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);

		let result = await qe.executeUpdateQuery(qb.result());
		// defer dealing with errors
		return result;
	}

	async insertJobHunting(){
		var query = `INSERT 
		{
			?p linkrec:jobhunting "true".
		} WHERE 
		{
			?p linkrec:userid $id .
		}`; 
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);

		let result = await qe.executeUpdateQuery(qb.result());
		// defer dealing with errors
		return result;
	}

	/*
	async insertNotJobHunting(){
		var query = `INSERT 
		{
			?p linkrec:jobhunting "false".
		} WHERE 
		{
			?p linkrec:userid $id .
		}`; 
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);

		let result = await qe.executeUpdateQuery(qb.result());
		// defer dealing with errors
		return result;
	}
	*/

	async setJobHunting(res, isJobHunting){
		if(isJobHunting === undefined){
			return;
		}

		let result = await this.deleteJobHunting();
		if (!qe.updateQuerySuccesful(result)) {
			//this just makes sure the service doesn't perform queries on wrong data
			res.send("Error: could not delete previous jobhunting data.");
			return result;
		}

		if(isJobHunting)
			result = await this.insertJobHunting();
		// if the user did set themselves as job hunting, this'll show the correct response to that;
		// if the user did not, then this'll show the output of deleteJobHunting, which is also what we want.
		return result;
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
		return true;
	}

	hasEditPermission(userID){
		return this.userID === userID;
	}

	async getOpenConnections(){
		var query = `
		SELECT ?name {
			?p foaf:name ?name .
			?x linkrec:userid $id .
			?x linkrec:connected ?p .
			FILTER NOT EXISTS {?p linkrec:connected ?x .}
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.userID);

		// Execute the query and reform into the desired output
		let output = await qe.executeGetToOutput(qb.result());
		return output;
	}

	
}