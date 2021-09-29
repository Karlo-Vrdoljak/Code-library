const db = require('../db.js');
const { TYPES } = require('tedious');
const { exists } = require('./app.service.js');

function createUpsertOsobniPodaciRequest(req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.[spOsobniPodaci_Upsert]', conn, res);
	request.addParameter('Spol', TYPES.NVarChar, req.body.Spol);
	request.addParameter('ImeUsera', TYPES.NVarChar, req.body.ImeUsera);
	request.addParameter('PrezimeUsera', TYPES.NVarChar, req.body.PrezimeUsera);
	request.addParameter('DatumRodenja', TYPES.NVarChar, req.body.DatumRodenja);
	request.addParameter('OIB', TYPES.NVarChar, req.body.OIB);
	request.addParameter('JMBAG', TYPES.NVarChar, req.body.JMBAG);
	request.addParameter('PkDrzava', TYPES.NVarChar, req.body.PkDrzava);
	request.addParameter('Grad', TYPES.NVarChar, req.body.Grad);
	request.addParameter('Adresa', TYPES.NVarChar, req.body.Adresa);
	req.body.Email && request.addParameter('Email', TYPES.NVarChar, req.body.Email);
	request.addParameter('Mobitel', TYPES.NVarChar, req.body.Mobitel);
	req.body.LDAPLoginName && request.addParameter('LDAPLoginName', TYPES.NVarChar, req.body.LDAPLoginName);
	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('PrivatnostPodataka', TYPES.Bit, req.body.PrivatnostPodataka);
	request.addOutputParameter('PkOsobniPodaciPkUsera', TYPES.Int, req.body.PkOsobniPodaciPkUsera);
	return { request, conn };
}

function createDatotekaInsertRequest({ Naziv, Opis, PkDatoteka, originalname, encoding, size, mimetype, destination, filename, path, PkUseraUnos, PkUseraPromjena, UserUnos, UserPromjena }, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.[spDatoteka_insert]', conn, res);
	request.addParameter('originalname', TYPES.NVarChar, originalname);
	request.addParameter('encoding', TYPES.NVarChar, encoding);
	request.addParameter('size', TYPES.Int, size);
	request.addParameter('mimetype', TYPES.NVarChar, mimetype);
	request.addParameter('destination', TYPES.NVarChar, destination);
	request.addParameter('filename', TYPES.NVarChar, filename);
	request.addParameter('path', TYPES.NVarChar, path);
	request.addParameter('PkUseraUnos', TYPES.Int, PkUseraUnos);
	request.addParameter('PkUseraPromjena', TYPES.Int, PkUseraPromjena);
	request.addParameter('UserUnos', TYPES.NVarChar, UserUnos);
	request.addParameter('UserPromjena', TYPES.NVarChar, UserPromjena);
	request.addParameter('Naziv', TYPES.NVarChar, Naziv);
	request.addParameter('Opis', TYPES.NVarChar, Opis);
	request.addOutputParameter('PkDatoteka', TYPES.Int, exists(PkDatoteka) ? PkDatoteka : null);
	return { request, conn };
}
function createDatotekaRelacijaRequest({ PkForumObjava, PkResursObjava, PkUsera, PkDatoteka, PkDatotekaCoverImage, PkForumObjavaKomentar = null, PkResursObjavaKomentar = null }, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.[spDatotekaRelacija_insert]', conn, res);
	PkForumObjava && request.addParameter('PkForumObjava', TYPES.Int, PkForumObjava);
	PkResursObjava && request.addParameter('PkResursObjava', TYPES.Int, PkResursObjava);
	PkUsera && request.addParameter('PkUsera', TYPES.Int, PkUsera);
	PkDatoteka && request.addParameter('PkDatoteka', TYPES.Int, PkDatoteka);
	PkDatotekaCoverImage && request.addParameter('PkDatotekaCoverImage', TYPES.Int, PkDatotekaCoverImage);
	PkForumObjavaKomentar && request.addParameter('PkForumObjavaKomentar', TYPES.Int, PkForumObjavaKomentar);
	PkResursObjavaKomentar && request.addParameter('PkResursObjavaKomentar', TYPES.Int, PkResursObjavaKomentar);
	return { request, conn };
}

function fetchDatotekaInfo({ PkDatoteka }, res) {
	return new Promise((resolve, reject) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.spDatotekaRelacija_select', conn, res);
		request.addParameter('PkDatoteka', TYPES.Int, PkDatoteka);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				resolve(result);
			} else {
				reject('STD:INVALID_REQUEST');
			}
		});
	});
}

function deletePrilog(Relacija, res) {
	return new Promise((resolve, reject) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.spDatoteka_delete', conn, res);
		request.addParameter('PkDatoteka', TYPES.Int, Relacija.PkDatoteka);
		request.addParameter('PkDatotekaCoverImage', TYPES.Int, Relacija.PkDatotekaCoverImage);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				resolve(result);
			} else {
				reject('STD:INVALID_REQUEST');
			}
		});
	});
}

module.exports = {
	createUpsertOsobniPodaciRequest,
	createDatotekaInsertRequest,
	createDatotekaRelacijaRequest,
	fetchDatotekaInfo,
	deletePrilog
};
