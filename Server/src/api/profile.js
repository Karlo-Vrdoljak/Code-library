const express = require('express');
const router = express.Router();
const { TYPES } = require('tedious');
const db = require('../db.js');
const { simpleDbResolve, handleRequestUser, exists, groupDataByKeySync, constructDirDepth, decryptIfEncrypted, groupFlatProperies, devLogger } = require('../services/app.service');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs-extra');
const { uuid } = require('uuidv4');
const crypt = require('../kripto');
const { createUpsertOsobniPodaciRequest, createDatotekaInsertRequest, createDatotekaRelacijaRequest, fetchDatotekaInfo, deletePrilog } = require('../services/profile.service.js');
const { checkFileExists, removeDiacritics } = require('../tools');

router.get('/profile', function (req, res) {
	if (!(req.query && req.query.PkUsera)) {
		return res.status(500).send({ message: null });
	}
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.[spOsobniPodaciSvi]', conn, res);
	request.addParameter('PkUsera', TYPES.Int, req.query.PkUsera);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			const grouped = result.reduce((acc, curr) => {
				const { PkUsera, LDAPLoginName, PrivatnostPodataka, AvatarPath, VrstaClanstvaNaziv, PkVrstaClanstva, Email, ImePrezimeUsera, ImeUsera, PrezimeUsera, LoginName, StatusKorisnika, UserAktivanDaNe, PkOsobniPodaciPkUsera, Spol, DatumRodenja, OIB, JMBAG, Mobitel, PkDrzava, Grad, Adresa, IDDrzaveNN, NazivDrzave, ...rest } = curr;
				const osobniPodaci = { PkUsera, LDAPLoginName, PrivatnostPodataka, AvatarPath, VrstaClanstvaNaziv, PkVrstaClanstva, Email, ImePrezimeUsera, ImeUsera, PrezimeUsera, LoginName, StatusKorisnika, UserAktivanDaNe, PkOsobniPodaciPkUsera, Spol, DatumRodenja, OIB, JMBAG, Mobitel, PkDrzava, Grad, Adresa, IDDrzaveNN, NazivDrzave };
				if (!acc.osobniPodaci) {
					acc.osobniPodaci = osobniPodaci;
				}
				if (!acc.profile) {
					acc.profile = [rest];
				} else {
					acc.profile = [...acc.profile, rest];
				}
				return acc;
			}, {});
			if (grouped.profile) {
				grouped.profile = groupDataByKeySync(grouped.profile, 'PkOsobniPodaciVrsta');
			}
			return res.status(200).send(grouped);
		}
		return res.status(500).send({ message: null });
	});
});

router.post('/upsertOsobniPodaci', async function (req, res) {
	const user = await handleRequestUser(req, res);
	const { request, conn } = createUpsertOsobniPodaciRequest(req, res);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.put('/profile', function (req, res) {
	return res.status(500).send({ message: "Implement me: router.put('/profile')" });
	//
	// const conn = db.createConnection(res.locals.currDatabase);
	// const request = db.createRequest('Alumni.[spOsobniPodaciSvi]', conn, res);
	// request.addParameter('PkUsera', TYPES.Int, req.query.PkUsera);
	//
	// db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.delete('/profile', function (req, res) {
	return res.status(500).send({ message: "Implement me: router.delete('/profile')" });
	//
	// const conn = db.createConnection(res.locals.currDatabase);
	// const request = db.createRequest('Alumni.[spOsobniPodaciSvi]', conn, res);
	// request.addParameter('PkUsera', TYPES.Int, req.query.PkUsera);
	//
	// db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/osobniPodaciVrste', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[AP].[spOsobniPodaciVrsta_Select]', conn, res);
	request.addParameter('PkOsobniPodaciVrsta', TYPES.Int, req.query.PkOsobniPodaciVrsta);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/getDrzave', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[AP].[spDrzave_Select]', conn, res);
	request.addParameter('PkDrzava', TYPES.Int, req.query.PkDrzava);
	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/profileVrsta', (req, res) => {
	const { PkOsobniPodaciObrazovanjeRadnoIskustvo, PkOsobniPodaciKompetencijaNapredovanje } = req.query;
	if (PkOsobniPodaciObrazovanjeRadnoIskustvo) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciObrazovanjeRadnoIskustvo_select]', conn, res);
		request.addParameter('PkOsobniPodaciObrazovanjeRadnoIskustvo', TYPES.Int, PkOsobniPodaciObrazovanjeRadnoIskustvo);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else if (PkOsobniPodaciKompetencijaNapredovanje) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciKompetencijaNapredovanje_select]', conn, res);
		request.addParameter('PkOsobniPodaciKompetencijaNapredovanje', TYPES.Int, PkOsobniPodaciKompetencijaNapredovanje);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	}
});

router.post('/profileVrsta', async function (req, res) {
	const { PkOsobniPodaciVrsta } = req.body;
	const user = await handleRequestUser(req, res);

	const handleObrazovanjeIliIskustvo = () => {
		const { Opis, PeriodDo, PeriodOd, PkOsobniPodaciPkUsera, StupanjObrazovanjaIliZanimanje, UstanovaIMjesto, OsobniPodaciVrstaNaziv, PkOsobniPodaciObrazovanjeRadnoIskustvo } = req.body;

		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciObrazovanjeRadnoIskustvo_insert]', conn, res);
		request.addParameter('UstanovaIMjesto', TYPES.NVarChar, UstanovaIMjesto);
		request.addParameter('StupanjObrazovanjaIliZanimanje', TYPES.NVarChar, StupanjObrazovanjaIliZanimanje);
		request.addParameter('PeriodOd', TYPES.Date, PeriodOd);
		request.addParameter('PeriodDo', TYPES.Date, PeriodDo);
		request.addParameter('Opis', TYPES.NVarChar, Opis);
		request.addParameter('PkOsobniPodaciVrsta', TYPES.Int, PkOsobniPodaciVrsta);
		request.addParameter('PkOsobniPodaciPkUsera', TYPES.Int, PkOsobniPodaciPkUsera);
		request.addParameter('UserZadnjePromjene', TYPES.NVarChar, user.ImePrezimeUsera);
		request.addOutputParameter('PkOsobniPodaciObrazovanjeRadnoIskustvo', TYPES.Int, null);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				const { PkOsobniPodaciObrazovanjeRadnoIskustvo } = outputParams;
				res.status(200).send({ PkOsobniPodaciObrazovanjeRadnoIskustvo });
			} else {
				res.status(500).send({ message: 'STD:INVALID_REQUEST' });
			}
		});
	};
	const handleKompetencije = () => {
		const { KompetencijaIliNapredovanje, Opis, OsobniPodaciVrstaNaziv, PkOsobniPodaciVrsta, PkOsobniPodaciKompetencijaNapredovanje, PkOsobniPodaciPkUsera } = req.body;
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciKompetencijaNapredovanje_insert]', conn, res);

		request.addParameter('KompetencijaIliNapredovanje', TYPES.NVarChar, KompetencijaIliNapredovanje);
		request.addParameter('Opis', TYPES.NVarChar, Opis);
		request.addParameter('PkOsobniPodaciVrsta', TYPES.Int, PkOsobniPodaciVrsta);
		request.addParameter('PkOsobniPodaciPkUsera', TYPES.Int, PkOsobniPodaciPkUsera);
		request.addParameter('UserZadnjePromjene', TYPES.NVarChar, user.ImePrezimeUsera);
		request.addOutputParameter('PkOsobniPodaciKompetencijaNapredovanje', TYPES.Int, null);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				const { PkOsobniPodaciKompetencijaNapredovanje } = outputParams;

				res.status(200).send({ PkOsobniPodaciKompetencijaNapredovanje });
			} else {
				res.status(500).send({ message: 'STD:INVALID_REQUEST' });
			}
		});
	};

	if (PkOsobniPodaciVrsta) {
		switch (PkOsobniPodaciVrsta) {
			case 1: // "OBRAZOVANJE"
				handleObrazovanjeIliIskustvo();
				break;
			case 2: // "RADNO_ISKUSTVO"
				handleObrazovanjeIliIskustvo();

				break;
			case 3: // "KOMPETENCIJE"
				handleKompetencije();
				break;
			case 4: // "OSTALA_NAPREDOVANJA"
				handleKompetencije();
				break;
			case 5: // "OSTALA_ZNANSTVENA_NAPREDOVANJA"
				handleKompetencije();
				break;
			default:
				res.status(500).send({ message: 'STD:INVALID_REQUEST' });
				break;
		}
	} else {
		res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	}
});

router.put('/profileVrsta', async function (req, res) {
	const { PkOsobniPodaciVrsta } = req.body;
	const user = await handleRequestUser(req, res);

	const handleObrazovanjeIliIskustvo = () => {
		const { Opis, PeriodDo, PeriodOd, PkOsobniPodaciPkUsera, StupanjObrazovanjaIliZanimanje, UstanovaIMjesto, OsobniPodaciVrstaNaziv, PkOsobniPodaciObrazovanjeRadnoIskustvo } = req.body;
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciObrazovanjeRadnoIskustvo_update]', conn, res);
		request.addParameter('UstanovaIMjesto', TYPES.NVarChar, UstanovaIMjesto);
		request.addParameter('StupanjObrazovanjaIliZanimanje', TYPES.NVarChar, StupanjObrazovanjaIliZanimanje);
		request.addParameter('PeriodOd', TYPES.Date, PeriodOd);
		request.addParameter('PeriodDo', TYPES.Date, PeriodDo);
		request.addParameter('Opis', TYPES.NVarChar, Opis);
		request.addParameter('PkOsobniPodaciVrsta', TYPES.Int, PkOsobniPodaciVrsta);
		request.addParameter('PkOsobniPodaciPkUsera', TYPES.Int, PkOsobniPodaciPkUsera);
		request.addParameter('UserZadnjePromjene', TYPES.NVarChar, user.ImePrezimeUsera);
		request.addParameter('PkOsobniPodaciObrazovanjeRadnoIskustvo', TYPES.Int, PkOsobniPodaciObrazovanjeRadnoIskustvo);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				res.status(200).send({ PkOsobniPodaciObrazovanjeRadnoIskustvo });
			} else {
				res.status(500).send({ message: 'STD:INVALID_REQUEST' });
			}
		});
	};

	const handleKompetencije = () => {
		const { KompetencijaIliNapredovanje, Opis, OsobniPodaciVrstaNaziv, PkOsobniPodaciVrsta, PkOsobniPodaciKompetencijaNapredovanje, PkOsobniPodaciPkUsera } = req.body;
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciKompetencijaNapredovanje_update]', conn, res);

		request.addParameter('PkOsobniPodaciKompetencijaNapredovanje', TYPES.Int, PkOsobniPodaciKompetencijaNapredovanje);
		request.addParameter('KompetencijaIliNapredovanje', TYPES.NVarChar, KompetencijaIliNapredovanje);
		request.addParameter('Opis', TYPES.NVarChar, Opis);
		request.addParameter('PkOsobniPodaciVrsta', TYPES.Int, PkOsobniPodaciVrsta);
		request.addParameter('PkOsobniPodaciPkUsera', TYPES.Int, PkOsobniPodaciPkUsera);
		request.addParameter('UserZadnjePromjene', TYPES.NVarChar, user.ImePrezimeUsera);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				res.status(200).send({ PkOsobniPodaciKompetencijaNapredovanje });
			} else {
				res.status(500).send({ message: 'STD:INVALID_REQUEST' });
			}
		});
	};

	if (PkOsobniPodaciVrsta) {
		switch (PkOsobniPodaciVrsta) {
			case 1: // "OBRAZOVANJE"
				handleObrazovanjeIliIskustvo();
				break;
			case 2: // "RADNO_ISKUSTVO"
				handleObrazovanjeIliIskustvo();

				break;
			case 3: // "KOMPETENCIJE"
				handleKompetencije();
				break;
			case 4: // "OSTALA_NAPREDOVANJA"
				handleKompetencije();
				break;
			case 5: // "OSTALA_ZNANSTVENA_NAPREDOVANJA"
				handleKompetencije();
				break;
			default:
				res.status(500).send({ message: 'STD:INVALID_REQUEST' });
				break;
		}
	} else {
		res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	}
});

router.delete('/profileVrsta', function (req, res) {
	const { PkOsobniPodaciKompetencijaNapredovanje, PkOsobniPodaciObrazovanjeRadnoIskustvo } = req.query;
	if (exists(PkOsobniPodaciKompetencijaNapredovanje)) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciKompetencijaNapredovanje_delete]', conn, res);
		request.addParameter('PkOsobniPodaciKompetencijaNapredovanje', TYPES.Int, PkOsobniPodaciKompetencijaNapredovanje);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else if (exists(PkOsobniPodaciObrazovanjeRadnoIskustvo)) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Alumni.[spOsobniPodaciObrazovanjeRadnoIskustvo_delete]', conn, res);
		request.addParameter('PkOsobniPodaciObrazovanjeRadnoIskustvo', TYPES.Int, PkOsobniPodaciObrazovanjeRadnoIskustvo);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	}
});

router.post('/uploadCoverImage', async function (req, res) {
	const user = await handleRequestUser(req, res);

	const form = new formidable.IncomingForm();
	const pathParts = ['uploads', 'tempFiles', 'korisnici', 'avatar'];

	const tempPath = constructDirDepth(pathParts);

	form.uploadDir = tempPath;
	form.keepExtensions = true;
	try {
		form.parse(req, function (err, fields, { file }) {
			try {
				const savePath = constructDirDepth(['public', 'korisnici', fields.PkOsobniPodaciPkUsera, 'avatar/']);
				const id = uuid();
				const files = fs.readdirSync(savePath);
				for (const file of files) {
					fs.unlinkSync(path.join(savePath, file));
				}

				const dbSavePath = `korisnici/${fields.PkOsobniPodaciPkUsera}/avatar/${id}_${file.name}`;
				fs.renameSync(file.path, `${savePath}${id}_${file.name}`);
				// fs.removeSync(tempPath);
				// return res.status(200).send();
				const conn = db.createConnection(res.locals.currDatabase);
				const request = db.createRequest('[Alumni].[spOsobniPodaciAvatar_update]', conn, res);
				request.addParameter('PkOsobniPodaciPkUsera', TYPES.Int, decryptIfEncrypted(fields.PkOsobniPodaciPkUsera));
				request.addParameter('AvatarPath', TYPES.NVarChar, dbSavePath);

				db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
			} catch (error) {
				global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);

				res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
			}
		});
	} catch (error) {
		global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);

		res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
	}
});

router.get('/attachments', function (req, res) {
	const { PkOsobniPodaciPkUsera } = req.query;
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.[spOsobniPodaciPrilozi_select]', conn, res);
	request.addParameter('PkOsobniPodaciPkUsera', TYPES.Int, PkOsobniPodaciPkUsera);
	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			const prilozi = result.map((r) => groupFlatProperies(r));
			return res.status(200).send(prilozi);
		}
		return res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	});
});

router.get('/uploadedFile', function (req, res) {
	const { file } = req.query;
	const filePath = path.join(global.appConfig.directoryParams.uploadPath, file);

	if (fs.existsSync(filePath)) {
		res.status(200).sendFile(filePath);
	} else {
		res.status(400).send('STD:INVALID_REQUEST');
	}
});

router.post('/attachment', async function (req, res) {
	const user = await handleRequestUser(req, res);

	const form = new formidable.IncomingForm();
	const pathParts = ['uploads', 'tempFiles', 'korisnici', 'attachment'];

	const tempPath = constructDirDepth(pathParts);

	form.uploadDir = tempPath;
	form.keepExtensions = true;
	try {
		form.parse(req, async function (err, fields, { CoverImage, file }) {
			try {
				const { Naziv, Opis, PkOsobniPodaciPkUsera } = fields;
				const id = uuid();
				const savePath = constructDirDepth(['uploads', 'korisnici', PkOsobniPodaciPkUsera, 'attachments', `${id}/`]);
				// const files = fs.readdirSync(savePath);
				// for (const file of files) {
				// 	fs.unlinkSync(path.join(savePath, file));
				// }
				const dbSavePathRoot = `korisnici/${PkOsobniPodaciPkUsera}/attachments/${id}/`;
				const dbSavePathcoverImage = CoverImage ? `korisnici/${PkOsobniPodaciPkUsera}/attachments/${id}/${id}_${CoverImage.name}` : null; // not required field!
				const dbSavePathAttachment = `korisnici/${PkOsobniPodaciPkUsera}/attachments/${id}/${id}_${file.name}`;
				if (CoverImage) fs.renameSync(CoverImage.path, `${savePath}${id}_${CoverImage.name}`);
				fs.renameSync(file.path, `${savePath}${id}_${file.name}`);

				fs.removeSync(tempPath);

				const uploadFile = ({ dbPath, dbSavePathRoot, user, filename, file, Naziv, Opis, PkOsobniPodaciPkUsera }) =>
					new Promise((resolve) => {
						const { size, path, name, type, hash, lastModifiedDate } = file;
						const { conn, request } = createDatotekaInsertRequest(
							{
								Naziv,
								Opis,
								PkDatoteka: null,
								PkUseraPromjena: user.PkUsera,
								PkUseraUnos: user.PkUsera,
								UserPromjena: user.ImePrezimeUsera,
								UserUnos: user.ImePrezimeUsera,
								destination: dbSavePathRoot,
								encoding: null,
								filename,
								mimetype: type,
								originalname: name,
								path: dbPath, //dbSavePathcoverImage,
								size: size
							},
							res
						);
						db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
							if (output == 'OK') {
								const { PkDatoteka } = outputParams;
								resolve({ PkDatoteka });
							} else {
								resolve({ PkDatoteka: null });
							}
						});
					});

				let PkDatotekaCoverImage = null;
				if (CoverImage) {
					const { PkDatoteka: insertedPkCover } = await uploadFile({ Naziv, Opis, PkOsobniPodaciPkUsera, dbPath: dbSavePathcoverImage, filename: `${id}_${CoverImage.name}`, dbSavePathRoot, user, file: CoverImage });
					PkDatotekaCoverImage = exists(insertedPkCover) ? insertedPkCover : null;
				}
				const { PkDatoteka } = await uploadFile({ Naziv, Opis, PkOsobniPodaciPkUsera, dbPath: dbSavePathAttachment, filename: `${id}_${file.name}`, dbSavePathRoot, user, file });

				const { conn, request } = createDatotekaRelacijaRequest(
					{
						PkForumObjava: null,
						PkResursObjava: null,
						PkDatoteka,
						PkDatotekaCoverImage,
						PkUsera: decryptIfEncrypted(PkOsobniPodaciPkUsera)
					},
					res
				);
				db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
			} catch (error) {
				global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);

				res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
			}
		});
	} catch (error) {
		global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);

		res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
	}
});

router.delete('/deletePrilog', async function (req, res) {
	try {
		const { PkDatoteka } = req.query;
		const datotekaInfo = (await fetchDatotekaInfo({ PkDatoteka }, res)).map((item) => {
			item = groupFlatProperies(item);
			item.Datoteka.path = path.join(global.appConfig.directoryParams.uploadPath, item.Datoteka.path);
			item.Datoteka.destination = path.join(global.appConfig.directoryParams.uploadPath, item.Datoteka.destination);
			return item;
		});
		datotekaInfo.map(({ Datoteka }) => {
			if (fs.existsSync(Datoteka.path)) fs.removeSync(Datoteka.path);
		});
		const [first] = datotekaInfo;
		if (fs.existsSync(first.Datoteka.destination)) fs.rmdirSync(first.Datoteka.destination);

		for (const { Relacija } of datotekaInfo) {
			await deletePrilog(Relacija, res);
		}

		res.status(200).send({ message: 'OK' });
	} catch (error) {
		res.status(500).send(error);
	}
});

router.put('/editPrilog', function (req, res) {
	const { PkDatoteka, Naziv, Opis } = req.body;
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spDatoteka_update', conn, res);
	request.addParameter('PkDatoteka', TYPES.Int, PkDatoteka);
	request.addParameter('Naziv', TYPES.NVarChar, Naziv);
	request.addParameter('Opis', TYPES.NVarChar, Opis);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/vrstaClanstva', function (req, res) {
	const { PkVrstaClanstva } = req.query;
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spVrstaClanstva_Select', conn, res);
	request.addParameter('PkVrstaClanstva', TYPES.Int, PkVrstaClanstva);
	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/vrstaClanstvaAll', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spVrstaClanstva_SelectAll', conn, res);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/obavijestVidljivost', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spObavijestVidljivost_Select', conn, res);

	request.addParameter('PkObavijest', TYPES.Int, req.query.PkObavijest);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/clanoviVrsta', function (req, res) {
	const { PkVrstaClanstva, query, skip, take } = req.query;
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spClanovi_select', conn, res);
	request.addParameter('PkVrstaClanstva', TYPES.Int, PkVrstaClanstva);
	request.addParameter('skip', TYPES.Int, skip || 0);
	request.addParameter('take', TYPES.Int, take || 6);
	request.addParameter('Search', TYPES.NVarChar, query || null);
	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			const mapped = result
				.map((r) => groupFlatProperies(r))
				.map((r) => {
					r.osobniPodaci.PkUsera = crypt.encryptString('' + r.osobniPodaci.PkUsera);
					return r;
				});
			res.status(200).send(mapped);
		} else {
			res.status(500).send({ message: 'STD:INVALID_REQUEST' });
		}
	});
});

router.get('/clanoviDataForExcelExport', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Alumni.spClanoviDataForExcelExport_select', conn, res);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.post('/ProfileLog', async function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Logs.spLogOsobniPodaci_insert', conn, res);
	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('Akcija', TYPES.NVarChar, req.body.Akcija);
	request.addParameter('Podaci', TYPES.NVarChar, req.body.Podaci);
	request.addParameter('PkUseraPristupio', TYPES.Int, decryptIfEncrypted(req.body.PkUseraPristupio));
	
	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			res.status(200).send();
		} else {
			res.status(500).send({ message: 'STD:INVALID_REQUEST' });
		}
	});
});

module.exports = router;
