var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();
// intermediary class to handle user information
var UserInfoHandler = require('./UserInfoHandler');
// intermediary class to handle vacancy information
var VacancyInfoHandler = require('./VacancyInfoHandler');

router.get('/', async (req, res) => {
	var handler = new VacancyInfoHandler();
	let output = await handler.getAllVacancies();
	// send the output
	res.send(output);
});

router.get('/:id(\\d+)', async (req, res) => {
	let handler = new VacancyInfoHandler(req.params.id);
	let output = await handler.getVacancyInfo();
	// send the output
	res.send(output);
});

//(based on https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula)
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function vacancyMatchesUser(vacancy, user){
	//for now, let's make it suuuper basic

	// this could be upgraded with 
	var reqDegree = vacancy["requiredDegree"];
	if(reqDegree !== "None" && reqDegree !== user["degreename"]){
		return false;
	}

	//calculate if the vacancy is within the user's range
	var lat1 = parseFloat(vacancy["lat"]);
	var lon1 = parseFloat(vacancy["long"]);
	var lat2 = parseFloat(user["lat"]);
	var lon2 = parseFloat(user["long"]);
	var distance = getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2);

	var userMaxDistance = parseInt(user["maxDistance"], 10);
	if(distance > userMaxDistance)
		return false;

	vacancy["distance"] = distance + " km";

	return true;
}

router.get('/matching', async (req, res) => {
	//make sure req.body.userID is defined and exists!
	if(req.body.thisUserID === undefined){
		res.send("Please include the 'thisUserID' field.");
		return;
	}

	// Get the user's information
	let userhandler = new UserInfoHandler(req.body.thisUserID);
	let user = await userhandler.getUserInfo();
	// that returns a string so turn it back into JSON
	user = JSON.parse(user);
	// it only returns one user, so let's just take that user
	user = user[0];

	//get all vacancies
	let vacancyhandler = new VacancyInfoHandler();
	// TODO: find a way to pre-emptively prune vacancies that won't match
	let allVacancies = await vacancyhandler.getAllVacancies();
	// that returns a string so turn that back into JSON
	allVacancies = JSON.parse(allVacancies);

	var matchingVacancies = [];
	for(var singleVacancyObj in allVacancies){
		let singleVacancy = allVacancies[singleVacancyObj];
		//console.log(JSON.stringify(singleVacancy, null, ' '));
		if(vacancyMatchesUser(singleVacancy, user))
			matchingVacancies.push(singleVacancy);
	}

	res.send(matchingVacancies);
})

module.exports = router;