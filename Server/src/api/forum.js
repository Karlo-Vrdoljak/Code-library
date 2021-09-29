const express = require('express');
const router = express.Router();
const { TYPES } = require('tedious');
const db = require('../db.js');
const { simpleDbResolve, handleRequestUser, constructDirDepth, decryptIfEncrypted, exists, groupFlatProperies, groupDataByKeySync, hasClaim } = require('../services/app.service');
const formidable = require('formidable');
const fs = require('fs-extra');
const crypt = require('../kripto');
const { uuid } = require('uuidv4');
const { createDatotekaInsertRequest, createDatotekaRelacijaRequest } = require('../services/profile.service.js');

const modulName = 'Forum';
//#region GET DATA
//Ukoliko se ne posalje PkKategorija dohvacaju se sve kategorije NULTE razine
router.get('/kategorije', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Forum.spKategorija_Select', conn, res);
	request.addParameter('PkKategorija', TYPES.Int, req.query.PkKategorija);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/potkategorije', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Forum.spPotKategorija_Select', conn, res);
	request.addParameter('PkKategorija', TYPES.Int, req.query.PkKategorija);
	req.query.skip && request.addParameter('skip', TYPES.Int, req.query.skip);
	req.query.take && request.addParameter('take', TYPES.Int, req.query.take);
	req.query.query && request.addParameter('query', TYPES.NVarChar, req.query.query);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/komentari', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Forum.spKomentar_Select', conn, res);
	request.addParameter('PkObjava', TYPES.Int, req.query.PkObjava);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			result = result.map((r) => {
				const { groupId, PkObjavaOccurence } = r;
				Object.keys(r).forEach((k) => {
					if (k.includes(groupId)) {
						const [first, last] = k.split(groupId);
						const newKey = `${first}.${PkObjavaOccurence - 1}.${last}`;
						delete Object.assign(r, { [newKey]: r[k] })[k];
					}
				});
				return r;
			});
			const pkGroup = groupDataByKeySync(result, 'PkKomentar');
			result = Object.keys(pkGroup).map(key => {
				return { ...pkGroup[key].reduce((prev, curr) => ({ ...prev, ...curr }), {}) }
			});
			result = result.map((r) => groupFlatProperies(r));
			return res.status(200).send(result);
		}
		return res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	});
});

router.get('/komentar', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Forum.spKomentar_Select', conn, res);
	request.addParameter('PkKomentar', TYPES.Int, req.query.PkKomentar);
	request.addParameter('PkObjava', TYPES.Int, req.query.PkObjava);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			result = result.map((r) => {
				const { groupId, PkObjavaOccurence } = r;
				Object.keys(r).forEach((k) => {
					if (k.includes(groupId)) {
						const [first, last] = k.split(groupId);
						const newKey = `${first}.${PkObjavaOccurence - 1}.${last}`;
						delete Object.assign(r, { [newKey]: r[k] })[k];
					}
				});
				return r;
			});
			const pkGroup = groupDataByKeySync(result, 'PkKomentar');
			result = Object.keys(pkGroup).map(key => {
				return { ...pkGroup[key].reduce((prev, curr) => ({ ...prev, ...curr }), {}) }
			});

			result = result.map((r) => groupFlatProperies(r));
			return res.status(200).send(result);
		}
		return res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	});
});

router.get('/objave', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Forum.spObjava_Select', conn, res);
	req.query.PkObjava && request.addParameter('PkObjava', TYPES.Int, req.query.PkObjava);
	req.query.PkKategorija && request.addParameter('PkKategorija', TYPES.Int, req.query.PkKategorija);
	req.query.skip && request.addParameter('skip', TYPES.Int, req.query.skip);
	req.query.take && request.addParameter('take', TYPES.Int, req.query.take);
	req.query.query && request.addParameter('query', TYPES.NVarChar, req.query.query);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/objavaPrilozi', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Forum.spObjavaPrilozi_select', conn, res);
	req.query.PkObjava && request.addParameter('PkForumObjava', TYPES.Int, req.query.PkObjava);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			return res.status(200).send(result.map((r) => groupFlatProperies(r)));
		}
		return res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	});
});
//#endregion

//#region INSERT DATA
router.post('/kategorija', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Kategorija' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spKategorija_Insert', conn, res);

		request.addParameter('Naziv', TYPES.NVarChar, req.body.Naziv);
		request.addParameter('Opis', TYPES.NVarChar, req.body.Opis);
		request.addParameter('UserUnos', TYPES.NVarChar, user.ImePrezimeUsera);
		request.addParameter('PkUserUnos', TYPES.Int, user.PkUsera);
		request.addParameter('ParentPk', TYPES.Int, req.body.ParentPk);
		req.body.PublicDaNe && request.addParameter('PublicDaNe', TYPES.Int, req.body.PublicDaNe);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.post('/komentar', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Komentar' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spKomentar_Insert', conn, res);

		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkUseraUnos', TYPES.Int, req.body.PkUseraUnos);
		request.addParameter('PkObjava', TYPES.Int, req.body.PkObjava);
		request.addParameter('ParentPk', TYPES.Int, req.body.ParentPk);
		request.addParameter('Dubina', TYPES.Int, req.body.Dubina);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.post('/objava', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Objava' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spObjava_Insert', conn, res);

		request.addParameter('Naslov', TYPES.NVarChar, req.body.Naslov);
		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkUseraUnos', TYPES.Int, user.PkUsera);
		request.addParameter('PkKategorija', TYPES.Int, req.body.PkKategorija);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.post('/attachment', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Objava' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const form = new formidable.IncomingForm();
		const pathParts = ['uploads', 'tempFiles', 'korisnici', 'attachment'];

		const tempPath = constructDirDepth(pathParts);

		form.uploadDir = tempPath;
		form.keepExtensions = true;
		try {
			form.parse(req, async function (err, fields, { CoverImage, file }) {
				const { Naziv, Opis, PkObjava, PkOsobniPodaciPkUsera } = fields;
				const id = uuid();
				const savePath = constructDirDepth(['uploads', 'korisnici', PkOsobniPodaciPkUsera, 'attachments', 'forum', `${PkObjava}`, `${id}/`]);

				const dbSavePathRoot = `korisnici/${PkOsobniPodaciPkUsera}/attachments/forum/${PkObjava}/${id}/`;
				const dbSavePathcoverImage = CoverImage ? `korisnici/${PkOsobniPodaciPkUsera}/attachments/forum/${PkObjava}/${id}/${id}_${CoverImage.name}` : null; // not required field!
				const dbSavePathAttachment = `korisnici/${PkOsobniPodaciPkUsera}/attachments/forum/${PkObjava}/${id}/${id}_${file.name}`;
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
						PkForumObjava: PkObjava,
						PkDatoteka,
						PkDatotekaCoverImage,
						PkUsera: decryptIfEncrypted(PkOsobniPodaciPkUsera),
						PkForumObjavaKomentar: null
					},
					res
				);
				db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
			});
		} catch (error) {
			res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
		}
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}

});

async function insertComment({ Sadrzaj, PkUseraUnos, PkObjava, ParentPk = null, Dubina = null }, res) {
	return new Promise((resolve, reject) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spKomentar_Insert', conn, res);

		request.addParameter('Sadrzaj', TYPES.NVarChar, Sadrzaj);
		request.addParameter('PkUseraUnos', TYPES.Int, PkUseraUnos);
		request.addParameter('PkObjava', TYPES.Int, PkObjava);
		request.addParameter('ParentPk', TYPES.Int, ParentPk);
		request.addParameter('Dubina', TYPES.Int, Dubina);
		request.addOutputParameter('PkKomentar', TYPES.Int, null);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				const { PkKomentar } = outputParams;
				resolve({ PkKomentar });
			} else {
				resolve({ PkDatoteka: null });
			}
		});
	});
}

function executeSqlReqAsPromise({ request, conn, res }) {
	return new Promise((resolve) => {
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				resolve(result);
			} else {
				resolve({ message: output });
			}
		});
	});
}

router.post('/attachment/comment', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Komentar' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const form = new formidable.IncomingForm();
		const pathParts = ['uploads', 'tempFiles', 'korisnici', 'attachment'];

		const tempPath = constructDirDepth(pathParts);

		form.uploadDir = tempPath;
		form.keepExtensions = true;
		form.multiples = true;
		try {
			form.parse(req, async function (err, fields, files) {

				fields = groupFlatProperies(fields);
				const { prilogDummyPk: keys } = fields;
				files = groupFlatProperies(files);

				const { PkObjava, Sadrzaj, UserUnos, ParentPk, Dubina } = fields;
				let { PkUsera: PkOsobniPodaciPkUsera } = user;
				let parent = exists(ParentPk) ? ParentPk : null;
				let dubina = exists(Dubina) ? Dubina : null;

				const { PkKomentar } = await insertComment({ Sadrzaj, PkObjava, PkUseraUnos: PkOsobniPodaciPkUsera, Dubina: dubina, ParentPk: parent }, res);

				if (keys) {
					PkOsobniPodaciPkUsera = crypt.encryptString('' + PkOsobniPodaciPkUsera);

					const prilozi = keys.map((k) => ({ file: files.file[+k], ...(files.CoverImage && { CoverImage: files.CoverImage[+k] }), Naziv: fields.NazivDatotekaMeta[+k], Opis: fields.OpisDatotekaMeta[+k] })).filter(i => i);

					for (const { file, CoverImage, Naziv, Opis } of prilozi) {
						const id = uuid();
						const savePath = constructDirDepth(['uploads', 'korisnici', `${PkOsobniPodaciPkUsera}`, 'attachments', 'forum', `${PkObjava}`, 'comment', `${id}/`]);

						const dbSavePathRoot = `korisnici/${PkOsobniPodaciPkUsera}/attachments/forum/${PkObjava}/comment/${id}/`;
						const dbSavePathcoverImage = CoverImage ? `korisnici/${PkOsobniPodaciPkUsera}/attachments/forum/${PkObjava}/comment/${id}/${id}_${CoverImage.name}` : null; // not required field!
						const dbSavePathAttachment = `korisnici/${PkOsobniPodaciPkUsera}/attachments/forum/${PkObjava}/comment/${id}/${id}_${file.name}`;
						if (CoverImage) fs.renameSync(CoverImage.path, `${savePath}${id}_${CoverImage.name}`);
						fs.renameSync(file.path, `${savePath}${id}_${file.name}`);

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
								PkForumObjava: PkObjava,
								PkDatoteka,
								PkDatotekaCoverImage,
								PkUsera: decryptIfEncrypted(PkOsobniPodaciPkUsera),
								PkForumObjavaKomentar: PkKomentar
							},
							res
						);
						await executeSqlReqAsPromise({ request, conn, res });
					}
				}

				fs.removeSync(tempPath);

				res.status(200).send({ PkKomentar });
			});
		} catch (error) {
			global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);
			res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
		}
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}

});
//#endregion

//#region UPDATE DATA
router.put('/kategorija', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Kategorija' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spKategorija_Update', conn, res);

		request.addParameter('PkKategorija', TYPES.Int, req.body.PkKategorija);
		request.addParameter('Naziv', TYPES.NVarChar, req.body.Naziv);
		request.addParameter('Opis', TYPES.NVarChar, req.body.Opis);
		request.addParameter('UserPromjenio', TYPES.NVarChar, user.ImePrezimeUsera);
		request.addParameter('PkUseraPromjenio', TYPES.Int, user.PkUsera);
		request.addParameter('RowVersion', TYPES.NVarChar, req.body.RowVersion);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}

});

router.put('/komentar', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Komentar' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spKomentar_Update', conn, res);

		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkKomentar', TYPES.Int, req.body.PkKomentar);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.put('/objava', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Objava' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spObjava_Update', conn, res);

		request.addParameter('Naslov', TYPES.NVarChar, req.body.Naslov);
		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkObjava', TYPES.Int, req.body.PkObjava);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});
//#endregion

//#region DELETE DATA

//Ukoliko kategoriaj ima potkategorije, baza vraca error
router.delete('/kategorija', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Kategorija' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spKategorija_Delete', conn, res);

		request.addParameter('PkKategorija', TYPES.Int, req.query.PkKategorija);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

//Komentar ne brisemo iz baze vec dizemo flag da je izbrisan radi hijerarhijske strukture komentara
router.delete('/komentar', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Komentar' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spKomentar_Delete', conn, res);

		request.addParameter('PkKomentar', TYPES.Int, req.query.PkKomentar);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.delete('/objava', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Objava' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Forum.spObjava_Delete', conn, res);

		request.addParameter('PkObjava', TYPES.Int, req.query.PkObjava);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});
//#endregion
module.exports = { forumRouter: router };
