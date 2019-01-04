var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));
const fs   = require('fs');//read public/private keys
const jwt  = require('jsonwebtoken');

//this is needed to build the queries
var QueryBuilder = require('./QueryBuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();

var UserInfoHandler = require('./UserInfoHandler');

// required for encryption & matching
const bcrypt = require('bcrypt');

// PRIVATE and PUBLIC key
var privateKEY  = fs.readFileSync('./keys/privateKey.ppk', 'utf8');
var publicKEY  = fs.readFileSync('./keys/PublickKey', 'utf8');
var tokenTime = "1d"; //"120s";
var tokenCreator = "UHasselt-wis-Jana-Steven-Gilles"
var tokenSubject = "wis-api";
var tokenAlgoritme = "RS256";

/**
 * create and returns an authentication token
 * @param post:
 *      userName = name of the user
 *      userPass = password of the user
 */
router.post('/', async (req, res) => {
    let name = req.body.userName;
    let pass = req.body.userPass;
    let userInfo = UserInfoHandler.getUserInfo(name);
    
	if(name === undefined){
		res.send("error: No username found in login request.");
		return;
    }
    if(pass === undefined){
		res.send("error: No password found in login request.");
		return;
    }
    userInfo = JSON.parse(await userInfo)[0];
    if(userInfo === undefined || userInfo.id === undefined){
		res.send("error: User does not exist.");
		return;
    }
    let matches = await bcrypt.compare(pass, userInfo.pass);
    if(!matches){
		res.send("error: Incorrect password.");
		return;
    }

    var signOptions = {
        issuer:  tokenCreator,
        subject:  tokenSubject,
        expiresIn:  tokenTime,
        algorithm:  tokenAlgoritme
    };
    payload = {Userid: userInfo.id};

    let Token = jwt.sign(payload, privateKEY, signOptions);

    res.send(Token);
});

/**
 * validates the authentication token.
 * @return the user id if the token is valid
 * @throws an exception with the error information if the token was not valid
 * @param {string} token the authentication token
 */
function authenticate(token){
    var verifyOptions = {
        issuer:  tokenCreator,
        subject:  tokenSubject,
        expiresIn:  tokenTime,
        algorithm:  [tokenAlgoritme]
    };

    var payload = jwt.verify(token, publicKEY, verifyOptions);

    return payload.Userid;
}

/**
 * example of the token validation
 * it wil return the user id inside the token
 * or wil return the error if the token is invalid
 * @param post
 *      token
 */
router.post('/test', async (req, res) => {
    let token = req.body.token;
    
    let userId;
    try{
        userId = authenticate(token);
    }catch(err){
        //authentication unsuccesfull respond with error
        res.send(err);
        return;
    }

    //authentication success userId = the id of the logged in user
    res.send(userId);
});


//bcrypt testing call?
router.post('/encrypt', async (req, res) => {
    const saltRounds = 10;

    var hash = await bcrypt.hash(req.body.string, saltRounds);
    res.send(hash);
});

//bcrypt testing call?
router.post('/match', async (req, res) => {
    const saltRounds = 10;

    var hash = await bcrypt.compare(req.body.string, req.body.hash);
    if(hash){
        res.send("matches");
    }
    else{
        res.send("does not match");
    }
});

module.exports = {router, authenticate};