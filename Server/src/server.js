'use strict';
var appConfig = require('./config/appConfig.js'), // config se prvi ucitava jer ostali fileovi mozda koriste config
	bodyParser = require('body-parser'),
	helmet = require('helmet'),
	morgan = require('morgan'),
	crypt = require('./kripto.js'),
	app = require('express')(),
	express = require('express'),
	path = require('path'),
	jwt = require('./jwt/jwt');

// const { require } = require('app-root-path');
const { useGlobalAppHandlers } = require('./error.handler');

const { handleRequestUser, isAdmin } = require('./services/app.service');
// inicijalizacija loggera
var winston = require('./winston');
global.systemLogger = winston.loggers.get('systemLogger');
global.apiLogger = winston.loggers.get('apiLogger');

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, curr_db, language');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	next();
});

app.use(helmet());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(
	bodyParser.urlencoded({
		limit: '5mb',
		extended: true
	})
);

if (appConfig.appLogParams.apiCallLog == true) {
	app.use(
		morgan(':status :date[iso] :method :url :response-time  :req[query] :req[body] :remote-addr :res[content-length]', {
			skip: function (req, res) {
				return req.method == 'OPTIONS';
			},
			stream: global.apiLogger.stream
		})
	);
}
app.use(async function (req, res, next) {
	res.locals.currDatabase = (req.headers && req.headers.curr_db) || 'Produkcijska baza podataka';
	res.locals.language = (req.headers && req.headers.language) || 'hr';
	if (global.appConfig.encryptionConfig.enkripcijaDaNe) {
		crypt.dekriptirajPk(req.query);
		crypt.dekriptirajPk(req.body);
	}
	next();
});

if (appConfig.mainParams.checkAuthHeader == true) app.use(jwt.jwtMiddleware());

app.use('/api/pretplata', require('./api/pretplate').pretplateRouter);
app.use('/api/security', require('./jwt/security').securityRouter);
app.use('/api/profile', require('./api/profile'));
app.use('/api/forum', require('./api/forum').forumRouter);
app.use('/api/resursi', require('./api/resursi').resursiRouter);
app.use('/api/administracija', async (req, res, next) => {
	//Security na router razini, ako osoba nije administrator svi apiji ga odbijaju
	if ('OPTIONS' == req.method) {
		res.send(200);
	} else {
		await isAdmin(req) ? next() : res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' })
	}
}, require('./api/administracija').administracijaRouter);
app.use('/api', require('./api'));
app.use('/public/', express.static(path.join(appConfig.directoryParams.nodeSrv, 'public')));
//ako URL ne pocinje sa API onda je greska
app.use(function (req, res, next) {
	global.systemLogger.log({
		level: 'warn',
		message: '404 Unknown API URL: ' + req.url
	});
	var err = new Error('Unknown API URL.');
	err.status = 404;
	next(err);
});
// generalna greska....
app.use(function (err, req, res, next) {
	if (appConfig.ukljuciConsoleLog.ukljuciStackTrace) {
		console.trace(err);
	}
	global.systemLogger.log({
		level: 'error',
		message: 'ERROR: ' + err.message + err.status
	});
	next(err);
	res.status(err.status || 500).end();
});

if (appConfig.ukljuciConsoleLog.ukljuciStackTrace) useGlobalAppHandlers();

//The 404 ruta UVIJEK MORA BITI ZADNJA RUTA !!!!!!!!
app.get('*', function (req, res) {
	global.systemLogger.log({
		level: 'warn',
		message: 'Nepoznati API URL ! ' + req.url
	});
	res.status(404).send('Nepoznati API URL !');
});

module.exports = app;
app.listen(appConfig.mainParams.applicationPort);
global.systemLogger.log({
	level: 'info',
	message: 'Server started at port ' + appConfig.mainParams.applicationPort
});
