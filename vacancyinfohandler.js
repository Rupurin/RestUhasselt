var QueryBuilder = require('./QueryBuilder')
var JSONPrettifier = require('./JSONprettifier');
var QueryExecutor = require('./QueryExecutor');
var qe = new QueryExecutor();

module.exports = class VacancyInfoHandler {
	constructor(id){
		this.vacancyID = id;
	}

	async getAllVacancies(){
		var query = `SELECT ?jobTitle ?organizerName ?requiredDegree ?recruiter ?lat ?long ?experience ?bio WHERE 
		{
			?v linkrec:jobTitle ?jobTitle .
			?v linkrec:organizer ?org .
			?org vcard:title ?organizerName .
			?v linkrec:requiredDegreeName ?requiredDegree .
			?v linkrec:recruiterEmail ?recruiter .
			?v linkrec:location ?loc .
			?loc geo:lat ?lat .
			?loc geo:long ?long .
			?v linkrec:workExperience ?experience .
			?v linkrec:BIO ?bio .
		}`;
		let qb = new QueryBuilder(query);

		// Execute the query and reform into the desired output
		return await qe.executeGetToOutput(qb.result());
	}

	async getVacancyInfo(){
		var query = `SELECT ?jobTitle ?organizerName ?requiredDegree ?recruiter ?lat ?long ?experience ?bio WHERE 
		{
			?v linkrec:jobTitle ?jobTitle .
			?v linkrec:organizer ?org .
			?org vcard:title ?organizerName .
			?v linkrec:requiredDegreeName ?requiredDegree .
			?v linkrec:recruiterEmail ?recruiter .
			?v linkrec:location ?loc .
			?loc geo:lat ?lat .
			?loc geo:long ?long .
			?v linkrec:workExperience ?experience .
			?v linkrec:BIO ?bio .
			?v linkrec:vacancyID $id .
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.vacancyID);

		// Execute the query and reform into the desired output
		return await qe.executeGetToOutput(qb.result());
	}
}