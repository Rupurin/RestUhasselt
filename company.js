var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));


//needed for authentication of the JWT
var Authentication = require('./authentication');
//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();

var CompanyHandler = require('./CompanyHandler');

//get the info of one company
router.get('/:id(\\d+)', async (req, res) => {
	let handler = new CompanyHandler(req.params.id);
	let output = await handler.getCompanyInfo();
	// send the output
	res.status(200).send(output);
});

//get a list of all the companys
router.get('/list', async (req, res) => {
	let output = await CompanyHandler.getCompanyList();
	// send the output
	res.status(200).send(output);
});

router.post('/', async (req, res) => {
	//authentication
	let token = req.body.token;
    let userId;
    try{
        userId = Authentication.authenticate(token);
    }catch(err){
        //authentication unsuccesfull respond with error
		res.status(401).send(err);
        return;
    }
	var handler = new CompanyHandler(userId);

	//existens check
	if(!await qe.checkCompanyExists(userId)){
		res.status(409).send("You do not yet have a company use put /company instead");
		return;
	}

	//update company
	result = await handler.updateCompanyInfo(req.body);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Insertion of data for the new company did not succeed.\n" + result);
		return;
	}

	res.status(200).send("Updated company succesfully.");
});

//create a new company
router.put('/', async (req, res) => {
	//authentication
	let token = req.body.token;
    let userId;
    try{
        userId = Authentication.authenticate(token);
    }catch(err){
        //authentication unsuccesfull respond with error
        res.status(401).send(err);
        return;
    }
	var handler = new CompanyHandler(userId);

	//existens check
	if(await qe.checkCompanyExists(userId)){
		res.status(409).send("You already have a company, you can edit this company with a post request");
		return;
	}

	//parameters check
	if(!CompanyHandler.hasNeededParams(req.body)){
		res.status(400).send("Needed parameters are missing.");
		return;
	}

	//create new empty company
	let result = await handler.addNewCompany();
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Insertion of new company did not succeed.\n" + result);
		return;
	}

	//add data to the newly created company TODO delete empty company if failed
	result = await handler.updateCompanyInfo(req.body);
	if (!qe.updateQuerySuccesful(result)) {
		res.status(500).send("Insertion of data for the new company did not succeed.\n" + result);
		return;
	}

	res.status(201).send("New company created succesfully.");
});

module.exports = router;