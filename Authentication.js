var express = require('express')
var router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));
const fs   = require('fs');//read public/private keys
const jwt  = require('jsonwebtoken');

//this is needed to build the queries
var QueryBuilder = require('./querybuilder');
//this is needed to execute the queries
var QueryExecutor = require('./queryexecutor');
var qe = new QueryExecutor();

var UserInfoHandler = require('./UserInfoHandler');

// PRIVATE and PUBLIC key
var privateKEY  = fs.readFileSync('./keys/privateKey.ppk', 'utf8');
var publicKEY  = fs.readFileSync('./keys/PublickKey', 'utf8');
var tokenTime = "120s";
var tokenCreator = "UHasselt-wis-Jana-Steven-Gilles"
var tokenSubject = "wis-api";
var tokenAlgoritme = "RS256";

/**
 * create and returns an authentication token
 * @param post:
 *      name = name of the user
 *      pass = password of the user
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
    if(userInfo.id === undefined){
		res.send("error: User does not exists.");
		return;
    }
    if(userInfo.pass !== pass){
		res.send("error: Incorrect password.");
		return;
    }

    var signOptions = {
        issuer:  tokenCreator,
        subject:  tokenSubject,
        expiresIn:  tokenTime,
        algorithm:  tokenAlgoritme   // RSASSA [ "RS256", "RS384", "RS512" ]
    };
    payload = {Userid: userInfo.id};

    let Token = jwt.sign(payload, privateKEY, signOptions);

    res.send(Token);
});

router.post('/test', async (req, res) => {
    let token = req.body.token;
    
    try{
        let userId = authenticate(token);
    }catch(err){
        
        res.send(err);
    }
    res.send(userId);
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

module.exports = {router, authenticate};