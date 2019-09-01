var express = require('express');
var path = require('path');
var nforce = require('nforce');
var hbs = require('hbs');
/////////////////###############################################
var api = process.env.API || '25.0';
/////////////////###############################################
var app = express();

app.set('view engine', 'hbs');
app.enable('trust proxy');
/////////////////###############################################
var sfdcOrg = nforce.createConnection({
	clientId: process.env.CONSUMER_KEY,
	clientSecret: process.env.CONSUMER_SECRET,
	redirectUri: process.env.CALLBACK_URL,
	apiVersion: api,  // optional, defaults to v24.0
	environment: 'production'  // optional, sandbox or production, production default
});
	console.log('Authenticate called');
	// authenticate using username-password oauth flow
	sfdcOrg.authenticate({ username: process.env.USERNAME,
		password: process.env.PASSWORD },
                function(err, resp){
		if(err) {
		  console.log('Error: ' + err.message);
		} else {
		  console.log('Access Token: ' + resp.access_token);
		  oauth = resp;
		}
	});
app.set('views', path.join(__dirname, 'views'));
app.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Lightning Out!',
    lightningEndPointURI: process.env.LIGHTNING_URL,
    authToken: sfdcOrg.oauth.access_token
  });
});

/////////////////###############################################
function isSetup() {
  return (process.env.CONSUMER_KEY != null) && (process.env.CONSUMER_SECRET != null);
}

function oauthCallbackUrl(req) {
  return req.protocol + '://' + req.get('host');
}

hbs.registerHelper('get', function(field) {
  return this.get(field);
});

app.get('/', function(req, res) {
  if (isSetup()) {
    var org = nforce.createConnection({
      clientId: process.env.CONSUMER_KEY,
      clientSecret: process.env.CONSUMER_SECRET,
      redirectUri: oauthCallbackUrl(req),
      mode: 'single'
    });

    if (req.query.code !== undefined) {
      // authenticated
      org.authenticate(req.query, function(err) {
        if (!err) {
          org.query({ query: 'SELECT id, name, type, industry, rating FROM Account' }, function(err, results) {
            if (!err) {
              res.render('index', {records: results.records});
            }
            else {
              res.send(err.message);
            }
          });
        }
        else {
          if (err.message.indexOf('invalid_grant') >= 0) {
            res.redirect('/');
          }
          else {
            res.send(err.message);
          }
        }
      });
    }
    else {
      res.redirect(org.getAuthUri());
    }
  }
  else {
    res.redirect('/setup');
  }
});

app.get('/setup', function(req, res) {
  if (isSetup()) {
    res.redirect('/');
  }
  else {
    var isLocal = (req.hostname.indexOf('localhost') == 0);
    var herokuApp = null;
    if (req.hostname.indexOf('.herokuapp.com') > 0) {
      herokuApp = req.hostname.replace(".herokuapp.com", "");
    }
    res.render('setup', { isLocal: isLocal, oauthCallbackUrl: oauthCallbackUrl(req), herokuApp: herokuApp});
  }
});

app.listen(process.env.PORT || 5000);
