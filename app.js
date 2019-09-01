var express = require('express');
var path = require('path');
var nforce = require('nforce');
var hbs = require('hbs');
/////////////////###############################################
var api = process.env.API || '25.0';
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
/////////////////###############################################
var app = express();

app.set('view engine', 'hbs');
app.enable('trust proxy');
/////////////////###############################################
var org = nforce.createConnection({
	clientId: process.env.CONSUMER_KEY,
	clientSecret: process.env.CONSUMER_SECRET,
	redirectUri: process.env.CALLBACK_URL,
	apiVersion: api,  // optional, defaults to v24.0
	environment: 'production'  // optional, sandbox or production, production default
});
	console.log('Authenticate called');
	// authenticate using username-password oauth flow
	org.authenticate({ username: process.env.USERNAME,
		password: process.env.PASSWORD },
                function(err, resp){
		if(err) {
		  console.log('Error: ' + err.message);
		} else {
		  console.log('Access Token: ' + resp.access_token);
		  oauth = resp;
		}
	});
/////////////////
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Lightning Out!',
    lightningEndPointURI: process.env.LIGHTNING_URL,
    authToken: org.oauth.access_token
  });
});

/////////////////
/////////////////###############################################
