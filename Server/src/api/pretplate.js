const express = require('express');
const router = express.Router();
const { TYPES } = require('tedious');
const db = require('../db.js');
const { simpleDbResolve, handleRequestUser } = require('../services/app.service');

router.get('/check', async function (req, res) {
    const user = await handleRequestUser(req, res);

	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spCheckUserPretplata', conn, res);
	
    request.addParameter('Modul', TYPES.NVarChar, req.query.modul);
	request.addParameter('Segment', TYPES.NVarChar, req.query.segment);
    request.addParameter('PkUsera', TYPES.Int, user.PkUsera);
	request.addParameter('Pk', TYPES.Int, req.query.pk);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

//ruta je prazna jer je definirano app.use('/api/pretplata', require('./api/pretplate').pretplateRouter);
//stoga get req na /api/pretplata ulazi u ovaj api
router.get('', async function (req, res) {
    const user = await handleRequestUser(req, res);
	if (!user) return res.status(500).json({success: false, error: 'There is no logged in user!'});
	
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spPretplate_Select', conn, res);
	
    request.addParameter('PkUsera', TYPES.Int, user.PkUsera);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

//ruta je prazna jer je definirano app.use('/api/pretplata', require('./api/pretplate').pretplateRouter);
//stoga post req na /api/pretplata uazi u ovaj api
router.post('', async function (req, res) {
    const user = await handleRequestUser(req, res);

	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spPretplate_Insert', conn, res);
	
    request.addParameter('Modul', TYPES.NVarChar, req.body.modul);
	request.addParameter('Segment', TYPES.NVarChar, req.body.segment);
    request.addParameter('PkUsera', TYPES.Int, user.PkUsera);
	request.addParameter('Pk', TYPES.Int, req.body.pk);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

//ruta je prazna jer je definirano app.use('/api/pretplata', require('./api/pretplate').pretplateRouter);
//stoga delete req na /api/pretplata uazi u ovaj api
router.delete('', async function (req, res) {
    const user = await handleRequestUser(req, res);

	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spPretplate_Delete', conn, res);
	
    request.addParameter('PkPretplate', TYPES.Int, req.query.PkPretplate);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/pretplataData', async function (req, res) {
    const user = await handleRequestUser(req, res);
	if (!user) return res.status(500).send({success: false, message: 'There is no logged in user!'});
	
	const conn = db.createConnection(res.locals.currDatabase);
	let request = null;

	switch((req.query.Modul + '_' + req.query.Segment).toUpperCase()) {
		case 'FORUM_KATEGORIJA':
			request = db.createRequest('Alumni.spPretplateForumKategorija_Select', conn, res);
	
			request.addParameter('PkKategorija', TYPES.Int, req.query.Pk);
			request.addParameter('DatumZadnjeProvjere', TYPES.NVarChar, req.query.DatumZadnjeProvjere);

			break;
		case 'E-BIBLIOTEKA_KATEGORIJA':
			request = db.createRequest('Alumni.spPretplateResursiKategorija_Select', conn, res);
	
			request.addParameter('PkResursKategorija', TYPES.Int, req.query.Pk);
			request.addParameter('DatumZadnjeProvjere', TYPES.NVarChar, req.query.DatumZadnjeProvjere);
			break;
		default:
			res.status(400).send({success: false, message: 'Bad request!'});
			break;
	}


	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.put('/datumZadnjeProvjere', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spPretplate_UpdateDatumZadnjeProvjere', conn, res);

	request.addParameter('PkPretplate', TYPES.Int, req.body.PkPretplate);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));

});
module.exports = { pretplateRouter: router };
