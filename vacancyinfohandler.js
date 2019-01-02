var QueryBuilder = require('./QueryBuilder')
var JSONPrettifier = require('./JSONprettifier');
var QueryExecutor = require('./QueryExecutor');
var qe = new QueryExecutor();

module.exports = class VacancyInfoHandler {
	constructor(id){
		this.vacancyID = id;
	}

	static async getAllVacancies(){
		var query = `SELECT ?jobTitle ?organizerName ?requiredDegree ?recruiter ?lat ?long ?bio ?status WHERE 
		{
			?v linkrec:jobTitle ?jobTitle .
			?v linkrec:organizer ?org .
			?org vcard:title ?organizerName .
			?v linkrec:requiredDegreeName ?requiredDegree .
			?v linkrec:recruiterEmail ?recruiter .
			?v linkrec:location ?loc .
			?loc geo:lat ?lat .
			?loc geo:long ?long .
			?v linkrec:BIO ?bio .
			?v linkrec:vacancyStatus ?status .
		}`;
		let qb = new QueryBuilder(query);

		// Execute the query and reform into the desired output
		return await qe.executeGetToOutput(qb.result());
	}

	static async getAllActiveVacancies(){
		var query = `SELECT ?jobTitle ?organizerName ?requiredDegree ?recruiter ?lat ?long ?bio WHERE 
		{
			?v linkrec:jobTitle ?jobTitle .
			?v linkrec:organizer ?org .
			?org vcard:title ?organizerName .
			?v linkrec:requiredDegreeName ?requiredDegree .
			?v linkrec:recruiterEmail ?recruiter .
			?v linkrec:location ?loc .
			?loc geo:lat ?lat .
			?loc geo:long ?long .
			?v linkrec:BIO ?bio .
			?v linkrec:vacancyStatus "active" .
		}`;
		let qb = new QueryBuilder(query);

		// Execute the query and reform into the desired output
		return await qe.executeGetToOutput(qb.result());
	}

	async getVacancyInfo(){
		var query = `SELECT ?jobTitle ?organizerName ?requiredDegree ?recruiter ?lat ?long ?bio WHERE 
		{
			?v linkrec:jobTitle ?jobTitle .
			?v linkrec:organizer ?org .
			?org vcard:title ?organizerName .
			?v linkrec:requiredDegreeName ?requiredDegree .
			?v linkrec:recruiterEmail ?recruiter .
			?v linkrec:location ?loc .
			?loc geo:lat ?lat .
			?loc geo:long ?long .
			?v linkrec:BIO ?bio .
			?v linkrec:vacancyID $id .
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.vacancyID);

		// Execute the query and reform into the desired output
		return await qe.executeGetToOutput(qb.result());
	}

	async addNewVacancy(){
		var query = `
			INSERT DATA {
				<http://linkrec.be/terms#job$id> linkrec:vacancyID $idTyped .
			}
		`;
		var qb = new QueryBuilder(query);
		qb.bindParam('$id', this.vacancyID);
		qb.bindParamAsInt('$idTyped', this.vacancyID);

		return await qe.executeUpdateQuery(qb.result());
	}

	async addVacancyInfo(params){
		//?v linkrec:location [ geo:lat $lat ; geo:long $long ] .
		//that inserts location twice. Not for users, just here. Somehow.
		let query = `
			INSERT {
				?v a linkrec:Vacancy .
				?v linkrec:jobTitle $title .
				?v linkrec:organizer ?c .
				?v linkrec:requiredDegreeName $degree .
				?v linkrec:recruiterEmail $email .
				?v linkrec:BIO $bio .
				?v linkrec:vacancyStatus $status .
				?v linkrec:location [geo:lat $lat ; geo:long $long ].
			}
			WHERE {
				?v linkrec:vacancyID $VacancyID .
				?c linkrec:companyid $CompanyID .
			}
		`
		let qb = new QueryBuilder(query);
		qb.bindParamAsString('$title', params.jobTitle);
		qb.bindParamAsString('$degree', params.requiredDegreeName);
		qb.bindParamAsString('$email', params.recruiterEmail);
		qb.bindParamAsString('$lat', params.lat);
		qb.bindParamAsString('$long', params.long);
		qb.bindParamAsString('$bio', params.bio);
		qb.bindParamAsString('$status', params.status);
		qb.bindParamAsInt('$VacancyID', this.vacancyID);
		qb.bindParamAsInt('$CompanyID', params.companyID);
		console.log(qb.result());

		let output = await qe.executeUpdateQuery(qb.result());
		return output;
	}

	static hasNeededParams(params){
		if(params.jobTitle === undefined)
			return false;		
		if(params.recruiterEmail === undefined)
			return false;
		if(params.requiredDegreeName === undefined)
			return false;
		if(params.companyID === undefined)
			return false;
		if(params.lat === undefined)
			return false;
		if(params.long === undefined)
			return false;
		if(params.bio === undefined)
			return false;
		if(params.status === undefined)
			return false;
		return true;
	}
}