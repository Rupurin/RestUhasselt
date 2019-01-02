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
}