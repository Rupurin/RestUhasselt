var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();

var CompanyHandler = require('./CompanyHandler');

router.get('/:id(\\d+)', async (req, res) => {
	let handler = new CompanyHandler(req.params.id);
	let output = await handler.getCompanyInfo();
	// send the output
	res.send(output);
});


module.exports = router;