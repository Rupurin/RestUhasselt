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
// intermediary class to handle user information
var UserInfoHandler = require('./UserInfoHandler');
// intermediary class to handle vacancy information
var VacancyInfoHandler = require('./VacancyInfoHandler');

router.get('/', async (req, res) => {
	let output = await VacancyInfoHandler.getAllVacancies();
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
	var dLat = deg2rad(lat2-lat1);	// deg2rad below
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

async function vacancyMatchesUser(vacancy, user, userId){
	let handler = new UserInfoHandler(userId);

	var reqDegree = vacancy["requiredDegree"];
	if(reqDegree !== "None"){
		let hasDegree = await handler.hasDegree(reqDegree);
		//console.log(`User ${userId} has ${reqDegree} is ` + hasDegree);
		if(!hasDegree)
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
	let userId;
    try{
        userId = Authentication.authenticate(req.body.token);
    }catch(err){
        res.send(err);
        return;
    }

	// Get the user's information
	let userhandler = new UserInfoHandler(userId);
	let user = await userhandler.getUserInfo();
	// that returns a string so turn it back into JSON
	user = JSON.parse(user);
	// that operation can only return one user, which is who we want
	user = user[0];

	//get all vacancies
	// TODO: find a way to pre-emptively prune vacancies that won't ever match
	let allVacancies = await VacancyInfoHandler.getAllActiveVacancies();
	// that returns a string so turn that back into JSON
	allVacancies = JSON.parse(allVacancies);

	var matchingVacancies = [];
	for(var singleVacancyObj in allVacancies){
		let singleVacancy = allVacancies[singleVacancyObj];
		//console.log(JSON.stringify(singleVacancy, null, ' '));
		let matches = await vacancyMatchesUser(singleVacancy, user, userId);
		if(matches){
			matchingVacancies.push(singleVacancy);
		}
	}

	res.send(matchingVacancies);
})

module.exports = router;