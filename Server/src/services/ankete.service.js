const { TYPES } = require('tedious');
const { constructConnection, makeObservableConnectionWithOutput, makeObservableConnection, exists } = require('./app.service');

function insertPredlozakWithOutput({ predlozak, user, res, db }) {
	const { PredlozakNaziv, PredlozakNaslov, PredlozakOpis, ProglasenoAnketomDaNe } = predlozak;
	const { request, conn } = constructConnection('Ankete.spPredlozak_upsert', res.locals.currDatabase, res, db);
	request.addParameter('PredlozakNaziv', TYPES.NVarChar, PredlozakNaziv);
	request.addParameter('PredlozakNaslov', TYPES.NVarChar, PredlozakNaslov);
	request.addParameter('PredlozakOpis', TYPES.NVarChar, PredlozakOpis);
	request.addParameter('IzbrisanDaNe', TYPES.Int, 0);
	request.addParameter('UredivanjeDaNe', TYPES.Int, 1);
	request.addParameter('PkUserUnos', TYPES.Int, user.PkUsera);
	request.addParameter('PkUsera', TYPES.Int, user.PkUsera);
	// request.addParameter('DatumUnos', TYPES.Date, DatumUnos);
	request.addParameter('PkUserPromjena', TYPES.Int, user.PkUsera);
	request.addParameter('User', TYPES.NVarChar, user.ImePrezimeUsera);
	request.addParameter('ProglasenoAnketomDaNe', TYPES.Int, ProglasenoAnketomDaNe);
	request.addOutputParameter('PkPredlozak', TYPES.Int, null);
	return makeObservableConnectionWithOutput(request, conn, res, db, 'PkPredlozak');
}

function updatePredlozakWithOutput({ predlozak, PkPredlozak, user, res, db }) {
	const { PredlozakNaziv, PredlozakNaslov, PredlozakOpis, IzbrisanDaNe, UredivanjeDaNe, PkUserUnos, DatumUnos, PkUsera, ProglasenoAnketomDaNe } = predlozak;
	const { request, conn } = constructConnection('Ankete.spPredlozak_upsert', res.locals.currDatabase, res, db);
	request.addParameter('PredlozakNaziv', TYPES.NVarChar, PredlozakNaziv);
	request.addParameter('PredlozakNaslov', TYPES.NVarChar, PredlozakNaslov);
	request.addParameter('PredlozakOpis', TYPES.NVarChar, PredlozakOpis);
	request.addParameter('IzbrisanDaNe', TYPES.Int, IzbrisanDaNe);
	request.addParameter('UredivanjeDaNe', TYPES.Int, UredivanjeDaNe);
	request.addParameter('PkUserUnos', TYPES.Int, PkUserUnos);
	request.addParameter('PkUsera', TYPES.Int, PkUsera);
	request.addParameter('DatumUnos', TYPES.Date, DatumUnos);
	request.addParameter('PkUserPromjena', TYPES.Int, user.PkUsera);
	request.addParameter('User', TYPES.NVarChar, user.ImePrezimeUsera);
	request.addParameter('ProglasenoAnketomDaNe', TYPES.Int, ProglasenoAnketomDaNe);
	request.addOutputParameter('PkPredlozak', TYPES.Int, PkPredlozak);
	return makeObservableConnectionWithOutput(request, conn, res, db, 'PkPredlozak');
}
function insertPitanjePredlozak({ PkPitanje, PkPredlozak, pitanje, user, res, db }) {
	const { request, conn } = constructConnection('Ankete.spPredlozakPitanje_Insert', res.locals.currDatabase, res, db);
	const { PitanjeRedoslijed } = pitanje;

	request.addParameter('PkPredlozak', TYPES.Int, PkPredlozak);
	request.addParameter('PkPitanje', TYPES.Int, PkPitanje);
	request.addParameter('PitanjeRedoslijed', TYPES.Int, PitanjeRedoslijed);
	request.addParameter('PkUser', TYPES.Int, user.PkUsera);
	request.addParameter('User', TYPES.NVarChar, user.ImePrezimeUsera);
	request.addOutputParameter('PkPredlozakPitanje', TYPES.Int, null);
	return makeObservableConnectionWithOutput(request, conn, res, db, 'PkPredlozakPitanje');
}

function groupStats(statsPitanja) {
	const groupedStatsPitanja = [];
	statsPitanja.forEach((s) => {
		let exists = groupedStatsPitanja.find((gs) => gs.PkPitanje == s.PkPitanje);
		if (exists) {
			exists.Odgovori.push(s);
		} else {
			groupedStatsPitanja.push({
				PkPitanje: s.PkPitanje,
				Odgovori: [s]
			});
		}
	});
	return groupedStatsPitanja;
}
function fetchAnketaStatistika({ PkAnketa = null, PkPredlozak = null, db, res }) {
	const { request, conn } = constructConnection('Ankete.[spStatistikaAnketa_select]', res.locals.currDatabase, res, db);
	exists(PkAnketa) && request.addParameter('PkAnketa', TYPES.Int, PkAnketa);
	exists(PkPredlozak) && request.addParameter('PkPredlozak', TYPES.Int, PkPredlozak);
	return makeObservableConnection(request, conn, res, db);
}
function fetchAnketaStatistikaPitanja({ PkAnketa = null, PkPredlozak = null, db, res }) {
	const { request, conn } = constructConnection('Ankete.[spStatistikaAnketaPitanjaOdgovor_select]', res.locals.currDatabase, res, db);
	exists(PkAnketa) && request.addParameter('PkAnketa', TYPES.Int, PkAnketa);
	exists(PkPredlozak) && request.addParameter('PkPredlozak', TYPES.Int, PkPredlozak);
	return makeObservableConnection(request, conn, res, db);
}

module.exports = {
	insertPredlozakWithOutput,
	updatePredlozakWithOutput,
	insertPitanjePredlozak,
	groupStats,
	fetchAnketaStatistika,
	fetchAnketaStatistikaPitanja
};
