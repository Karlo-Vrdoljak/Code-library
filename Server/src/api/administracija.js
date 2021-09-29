const express = require('express');
const router = express.Router();
const { TYPES } = require('tedious');
const db = require('../db.js');
const { simpleDbResolve, handleRequestUser } = require('../services/app.service');

//#region GET DATA
//Api vraća sve usere s pripadajućim podatcima potrebnim za administraciju, kao claimovi, kojoj grupi pripada i vrsta clanstva
router.get('/users', async function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Administracija.spApplicationUsers_Select', conn, res);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});
//#endregion

//#region UPDATE DATA
router.put('/statusKorisnika', async function (req, res) {
	const user = await handleRequestUser(req, res);

	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Administracija.spStatusKorisnika_Update', conn, res);

	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('StatusKorisnika', TYPES.Int, req.body.StatusKorisnika);
	request.addParameter('UserPromjena', TYPES.NVarChar, user.ImePrezimeUsera);
	request.addParameter('PkUserPromjena', TYPES.Int, user.PkUsera);
	request.addParameter('RowVersion', TYPES.NVarChar, req.body.RowVersion);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.put('/userApplicationGroup', async function (req, res) {
	const user = await handleRequestUser(req, res);

	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Administracija.spSetUserGroup', conn, res);

	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('PkGrupa', TYPES.Int, req.body.PkGrupa);
	request.addParameter('UserUnos', TYPES.NVarChar, user.ImePrezimeUsera);
	request.addParameter('PkUseraUnos', TYPES.Int, user.PkUsera);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.put('/userClaims', async function (req, res) {
	const user = await handleRequestUser(req, res);

	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Administracija.spUserClaims_Update', conn, res);

	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('Claims', TYPES.NVarChar, JSON.stringify(req.body.Claims));
	request.addParameter('PkUserPromjena', TYPES.Int, user.PkUsera);
	request.addParameter('UserPromjena', TYPES.NVarChar, user.ImePrezimeUsera);
	request.addParameter('RowVersion', TYPES.NVarChar, req.body.RowVersion);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.put('/userVrstaClanstva', async function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Administracija.spVrstaClanstva_Update', conn, res);

	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('PkVrstaClanstva', TYPES.Int, req.body.PkVrstaClanstva);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});
//#endregion

router.get('/LogOsobniPodaci', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Logs.spLogOsobniPodaci_Select', conn, res);

	request.addParameter('PkUsera', TYPES.Int, req.query.PkUsera);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

module.exports = { administracijaRouter: router };
