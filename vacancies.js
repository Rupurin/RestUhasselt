var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();

router.get('/', async (req, res) => {
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
	qb = new QueryBuilder(query);

	// Execute the query and reform into the desired output
	let output = await qe.executeGetToOutput(qb.result());
	// send the output
	res.send(output);
});

router.get('/:id(\\d+)', async (req, res) => {
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
	qb = new QueryBuilder(query);
	qb.bindParamAsInt('$id', req.params.id);

	// Execute the query and reform into the desired output
	let output = await qe.executeGetToOutput(qb.result());
	// send the output
	res.send(output);
});

module.exports = router;