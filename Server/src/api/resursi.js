const express = require('express');
const router = express.Router();
const { TYPES } = require('tedious');
const db = require('../db.js');
const { simpleDbResolve, handleRequestUser, constructDirDepth, decryptIfEncrypted, exists, groupFlatProperies, groupDataByKeySync, hasClaim } = require('../services/app.service');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs-extra');
const crypt = require('../kripto');
const { uuid } = require('uuidv4');
const { createDatotekaInsertRequest, createDatotekaRelacijaRequest } = require('../services/profile.service.js');

const modulName = 'eBiblioteka';

//#region GET DATA
//Ukoliko se ne posalje PkKategorija dohvacaju se sve kategorije NULTE razine
router.get('/ResursiKategorije', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Resursi.spResursKategorija_Select', conn, res);
	request.addParameter('PkResursKategorija', TYPES.Int, req.query.PkResursKategorija);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/ResursiPotkategorije', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Resursi.spResursPotKategorija_Select', conn, res);
	request.addParameter('PkResursKategorija', TYPES.Int, req.query.PkResursKategorija);
	req.query.skip && request.addParameter('skip', TYPES.Int, req.query.skip);
	req.query.take && request.addParameter('take', TYPES.Int, req.query.take);
	req.query.query && request.addParameter('query', TYPES.NVarChar, req.query.query);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/ResursiKomentari', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Resursi.spResursKomentar_Select', conn, res);
	request.addParameter('PkResursObjava', TYPES.Int, req.query.PkResursObjava);

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
			const pkGroup = groupDataByKeySync(result, 'PkResursKomentar');
			result = Object.keys(pkGroup).map((key) => {
				return { ...pkGroup[key].reduce((prev, curr) => ({ ...prev, ...curr }), {}) };
			});

			result = result.map((r) => groupFlatProperies(r));
			return res.status(200).send(result);
		}
		return res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	});
});

router.get('/ResursiKomentar', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Resursi.spResursKomentar_Select', conn, res);
	request.addParameter('PkResursKomentar', TYPES.Int, req.query.PkResursKomentar);
	request.addParameter('PkResursObjava', TYPES.Int, req.query.PkResursObjava);

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
			const pkGroup = groupDataByKeySync(result, 'PkResursKomentar');
			result = Object.keys(pkGroup).map((key) => {
				return { ...pkGroup[key].reduce((prev, curr) => ({ ...prev, ...curr }), {}) };
			});

			result = result.map((r) => groupFlatProperies(r));
			return res.status(200).send(result);
		}
		return res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	});
});

router.get('/ResursiObjave', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Resursi.spResursObjava_Select', conn, res);
	req.query.PkResursObjava && request.addParameter('PkResursObjava', TYPES.Int, req.query.PkResursObjava);
	req.query.PkResursKategorija && request.addParameter('PkResursKategorija', TYPES.Int, req.query.PkResursKategorija);
	req.query.skip && request.addParameter('skip', TYPES.Int, req.query.skip);
	req.query.take && request.addParameter('take', TYPES.Int, req.query.take);
	req.query.query && request.addParameter('query', TYPES.NVarChar, req.query.query);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
});

router.get('/ResursiObjavaPrilozi', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('Resursi.spResursObjavaPrilozi_select', conn, res);
	req.query.PkResursObjava && request.addParameter('PkResursObjava', TYPES.Int, req.query.PkResursObjava);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
		if (output == 'OK') {
			return res.status(200).send(result.map((r) => groupFlatProperies(r)));
		}
		return res.status(500).send({ message: 'STD:INVALID_REQUEST' });
	});
});
//#endregion

//#region INSERT DATA
router.post('/ResursiKategorija', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Kategorija' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursKategorija_Insert', conn, res);

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

router.post('/ResursiKomentar', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Komentar' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursKomentar_Insert', conn, res);

		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkUseraUnos', TYPES.Int, req.body.PkUseraUnos);
		request.addParameter('PkResursObjava', TYPES.Int, req.body.PkResursObjava);
		request.addParameter('ParentPk', TYPES.Int, req.body.ParentPk);
		request.addParameter('Dubina', TYPES.Int, req.body.Dubina);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.post('/ResursiObjava', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Datoteka' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursObjava_Insert', conn, res);

		request.addParameter('Naslov', TYPES.NVarChar, req.body.Naslov);
		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkUseraUnos', TYPES.Int, user.PkUsera);
		request.addParameter('PkResursKategorija', TYPES.Int, req.body.PkResursKategorija);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}

});

router.post('/ResursiAttachment', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Datoteka' }, req);

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
				const savePath = constructDirDepth(['uploads', 'korisnici', PkOsobniPodaciPkUsera, 'attachments', 'Resursi', `${PkObjava}`, `${id}/`]);

				const dbSavePathRoot = `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkObjava}/${id}/`;
				const dbSavePathcoverImage = CoverImage ? `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkObjava}/${id}/${id}_${CoverImage.name}` : null; // not required field!
				const dbSavePathAttachment = `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkObjava}/${id}/${id}_${file.name}`;
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
						PkResursObjava: PkObjava,
						PkDatoteka,
						PkDatotekaCoverImage,
						PkUsera: decryptIfEncrypted(PkOsobniPodaciPkUsera),
						PkForumObjavaKomentar: null,
						PkResursObjavaKomentar: null
					},
					res
				);

				db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
			});
		} catch (error) {
			global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);

			res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
		}
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}


});

router.post('/ResursiAttachment/comment', async function (req, res) {
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

				const { PkResursObjava, Sadrzaj, UserUnos, ParentPk, Dubina } = fields;
				let { PkUsera: PkOsobniPodaciPkUsera } = user;
				let parent = exists(ParentPk) ? ParentPk : null;
				let dubina = exists(Dubina) ? Dubina : null;

				const { PkResursKomentar } = await insertComment({ Sadrzaj, PkResursObjava, PkUseraUnos: PkOsobniPodaciPkUsera, Dubina: dubina, ParentPk: parent }, res);

				if (keys) {
					PkOsobniPodaciPkUsera = crypt.encryptString('' + PkOsobniPodaciPkUsera);

					const prilozi = keys.map((k) => ({ file: files.file[+k], ...(files.CoverImage && { CoverImage: files.CoverImage[+k] }), Naziv: fields.NazivDatotekaMeta[+k], Opis: fields.OpisDatotekaMeta[+k] })).filter((i) => i);

					for (const { file, CoverImage, Naziv, Opis } of prilozi) {
						const id = uuid();
						const savePath = constructDirDepth(['uploads', 'korisnici', `${PkOsobniPodaciPkUsera}`, 'attachments', 'Resursi', `${PkResursObjava}`, 'comment', `${id}/`]);

						const dbSavePathRoot = `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkResursObjava}/comment/${id}/`;
						const dbSavePathcoverImage = CoverImage ? `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkResursObjava}/comment/${id}/${id}_${CoverImage.name}` : null; // not required field!
						const dbSavePathAttachment = `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkResursObjava}/comment/${id}/${id}_${file.name}`;
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
								PkResursObjava: PkResursObjava,
								PkDatoteka,
								PkDatotekaCoverImage,
								PkUsera: decryptIfEncrypted(PkOsobniPodaciPkUsera),
								PkResursObjavaKomentar: PkResursKomentar
							},
							res
						);
						await executeSqlReqAsPromise({ request, conn, res });
					}
				}

				fs.removeSync(tempPath);

				res.status(200).send({ PkResursKomentar });
			});
		} catch (error) {
			global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);

			res.status(500).send({ ...error, message: 'STD:INVALID_REQUEST' });
		}
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.post('/ResursiAttachment/objava', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Datoteka' }, req);

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

				const { Naslov, Sadrzaj, PkResursKategorija } = fields;
				let { PkUsera: PkOsobniPodaciPkUsera } = user;

				const { PkResursObjava } = await insertObjava({ Naslov, Sadrzaj, PkUseraUnos: PkOsobniPodaciPkUsera, PkResursKategorija }, res);

				if (keys) {
					PkOsobniPodaciPkUsera = crypt.encryptString('' + PkOsobniPodaciPkUsera);

					const prilozi = keys.map((k) => ({ file: files.file[+k], ...(files.CoverImage && { CoverImage: files.CoverImage[+k] }), Naziv: fields.NazivDatotekaMeta[+k], Opis: fields.OpisDatotekaMeta[+k] })).filter((i) => i);

					for (const { file, CoverImage, Naziv, Opis } of prilozi) {
						const id = uuid();
						const savePath = constructDirDepth(['uploads', 'korisnici', `${PkOsobniPodaciPkUsera}`, 'attachments', 'Resursi', `${PkResursObjava}`, `${id}/`]);

						const dbSavePathRoot = `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkResursObjava}/${id}/`;
						const dbSavePathcoverImage = CoverImage ? `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkResursObjava}/${id}/${id}_${CoverImage.name}` : null; // not required field!
						const dbSavePathAttachment = `korisnici/${PkOsobniPodaciPkUsera}/attachments/Resursi/${PkResursObjava}/${id}/${id}_${file.name}`;
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
								PkResursObjava: PkResursObjava,
								PkDatoteka,
								PkDatotekaCoverImage,
								PkUsera: decryptIfEncrypted(PkOsobniPodaciPkUsera)
							},
							res
						);
						await executeSqlReqAsPromise({ request, conn, res });
					}
				}

				fs.removeSync(tempPath);

				res.status(200).send({ PkResursObjava });
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
router.put('/ResursiKategorija', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Kategorija' }, req);

	if (hasAcces) {
		const user = await handleRequestUser(req, res);

		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursKategorija_Update', conn, res);

		request.addParameter('PkResursKategorija', TYPES.Int, req.body.PkResursKategorija);
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

router.put('/ResursiKomentar', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Komentar' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursKomentar_Update', conn, res);

		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkResursKomentar', TYPES.Int, req.body.PkResursKomentar);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

router.put('/ResursiObjava', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Datoteka' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursObjava_Update', conn, res);

		request.addParameter('Naslov', TYPES.NVarChar, req.body.Naslov);
		request.addParameter('Sadrzaj', TYPES.NVarChar, req.body.Sadrzaj);
		request.addParameter('PkResursObjava', TYPES.Int, req.body.PkResursObjava);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}

});
//#endregion

//#region DELETE DATA

//Ukoliko kategoriaj ima potkategorije, baza vraca error
router.delete('/ResursiKategorija', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Kategorija' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursKategorija_Delete', conn, res);

		request.addParameter('PkResursKategorija', TYPES.Int, req.query.PkResursKategorija);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});

//Komentar ne brisemo iz baze vec dizemo flag da je izbrisan radi hijerarhijske strukture komentara
router.delete('/ResursiKomentar', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Komentar' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursKomentar_Delete', conn, res);

		request.addParameter('PkResursKomentar', TYPES.Int, req.query.PkResursKomentar);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}


});

router.delete('/ResursiObjava', async function (req, res) {
	const hasAcces = await hasClaim({ modul: modulName, claim: 'Datoteka' }, req);

	if (hasAcces) {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursObjava_Delete', conn, res);

		request.addParameter('PkResursObjava', TYPES.Int, req.query.PkResursObjava);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => simpleDbResolve(output, outputParams, result, res));
	} else {
		res.status(401).send({ message: 'STD:UNATHORIZED_ACCES' });
	}
});
//#endregion

//#region FUNCTIONS
async function insertComment({ Sadrzaj, PkUseraUnos, PkResursObjava, ParentPk = null, Dubina = null }, res) {
	return new Promise((resolve, reject) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursKomentar_Insert', conn, res);

		request.addParameter('Sadrzaj', TYPES.NVarChar, Sadrzaj);
		request.addParameter('PkUseraUnos', TYPES.Int, PkUseraUnos);
		request.addParameter('PkResursObjava', TYPES.Int, PkResursObjava);
		request.addParameter('ParentPk', TYPES.Int, ParentPk);
		request.addParameter('Dubina', TYPES.Int, Dubina);
		request.addOutputParameter('PkResursKomentar', TYPES.Int, null);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				const { PkResursKomentar } = outputParams;
				resolve({ PkResursKomentar });
			} else {
				resolve({ PkDatoteka: null });
			}
		});
	});
}

async function insertObjava({ Naslov, Sadrzaj, PkUseraUnos, PkResursKategorija }, res) {
	return new Promise((resolve, reject) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('Resursi.spResursObjava_Insert', conn, res);

		request.addParameter('Naslov', TYPES.NVarChar, Naslov);
		request.addParameter('Sadrzaj', TYPES.NVarChar, Sadrzaj);
		request.addParameter('PkUseraUnos', TYPES.Int, PkUseraUnos);
		request.addParameter('PkResursKategorija', TYPES.Int, PkResursKategorija);
		request.addOutputParameter('PkResursObjava', TYPES.Int, null);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
			if (output == 'OK') {
				const { PkResursObjava } = outputParams;
				resolve({ PkResursObjava });
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
//#endregion FUNCTIONS
module.exports = { resursiRouter: router };
