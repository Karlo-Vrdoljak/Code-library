var express = require('express'),
	request = require('request'),
	crypt = require('../kripto.js'),
	router = express.Router(),
	db = require('../db.js'),
	jwt = require('./jwt'),
	TYPES = require('tedious').TYPES,
	kripto = require('../kripto'),
	fs = require('fs');

const ActiveDirectory = require('activedirectory2');

const axios = require('axios').default;

const { first } = require('rxjs');
const { uuid } = require('uuidv4');
const { handleRequestUser, decryptIfEncrypted, makeObservableConnection, groupFlatProperies } = require('../services/app.service.js');
const { createUpsertOsobniPodaciRequest } = require('../services/profile.service.js');

function fetchUserLogin(user, res) {
	return new Promise((resolve) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('[Sigurnost].[spApplicationUserLogin_select]', conn, res);
		user.LoginName && request.addParameter('LoginName', TYPES.NVarChar, user.LoginName);
		user.LDAPLoginName && request.addParameter('LDAPLoginName', TYPES.NVarChar, user.LDAPLoginName);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, dbUser) => {
			const adminUser = dbUser.find((u) => u.IsAdmin);
			if (adminUser) {
				resolve(adminUser);
			} else {
				resolve(dbUser[0]);
			}
		});
	});
}
function fetchUserByPk(PkUsera, res) {
	return new Promise((resolve) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('[Sigurnost].[spApplicationUser_select_NO_JSON]', conn, res);
		request.addParameter('PkUsera', TYPES.Int, PkUsera);

		db.execStoredProcFromNode(request, conn, res, (output, outputParams, dbUser) => {
			resolve(dbUser[0]);
		});
	});
}

function findUserByUUID(UUID, res) {
	return new Promise((resolve) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('[Sigurnost].[spApplicationUserUUID_select]', conn, res);
		request.addParameter('UUID', TYPES.NVarChar, UUID);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, dbUser) => {
			resolve(dbUser[0]);
		});
	});
}

/**
 *
 * @param {{status:0|1|2|3, user:any, res:any}} , REGISTRIRAN = 0, AKTIVAN = 1, ZABORAVIO_PASS = 2, ADMIN_ISKLJUCIO = 3,
 */
function setUserAccountActivityStatus({ status, user, res }) {
	return new Promise((resolve) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('[Sigurnost].[spApplicationUserStatusRacuna_Update]', conn, res);
		request.addParameter('KorisnikPkUsera', TYPES.Int, crypt.decryptString(user.PkUsera));
		request.addParameter('StatusKorisnika', TYPES.Int, status);
		request.addParameter('AktivanDaNe', TYPES.Int, user.UserAktivanDaNe);
		request.addParameter('RowVersion', TYPES.NVarChar, user.RowVersion);
		db.execStoredProcFromNode(request, conn, res, (output, outputParams, dbResult) => {
			resolve(dbResult[0]);
		});
	});
}

/**
 *
 * @param {status:0|1|2|3} StatusKorisnika , REGISTRIRAN = 0, AKTIVAN = 1, ZABORAVIO_PASS = 2, ADMIN_ISKLJUCIO = 3,
 */
function checkKorisnikStatusCanLogin(StatusKorisnika) {
	switch (true) {
		case StatusKorisnika == 0:
			return { rejectLogin: true, message: 'STD:INACTIVE_USER' };
		case StatusKorisnika == 1:
			return { rejectLogin: false };
		case StatusKorisnika == 2:
			return { rejectLogin: true, message: 'STD:PASS_RESET_CHECK_MAIL' };
		case StatusKorisnika == 3:
			return { rejectLogin: true, message: 'STD:BANNED_ACC' };
		default:
			return { rejectLogin: true, message: 'STD:INACTIVE_USER' };
	}
}



const login = {
	handleLoginPermit: (dbUser, reject) => {
		if (dbUser.UserAktivanDaNe == 0) {
			return reject({ message: 'STD:INACTIVE_USER' });
		}
		const status = checkKorisnikStatusCanLogin(dbUser.StatusKorisnika);
		if (status.rejectLogin) {
			return reject({ message: status.message });
		}
		return null;
	},

	
	/**
	 *
	 * @param {any} req
	 * @returns {Promise<Object|string>}  {error: string} | token: string
	 */
	userLogin: function (req, res, user) {
		return new Promise(async (resolve, reject) => {
			let dbUser = null;
			try {
				dbUser = await fetchUserLogin(user, res);
			} catch (error) {
				reject({ message: 'STD:INVALID_CREDENTIALS' });
			}
			if (dbUser) {
				this.handleLoginPermit(dbUser, reject);
				if (user.LoginName === kripto.decryptAdminPassword(user.Lozinka, false)) {
					//TODO DB login dobar?
					resolve(jwt.loginJwt({ ...dbUser, ...{ currDatabase: res.locals.currDatabase } }));
				} else if (user.Lozinka == kripto.decryptString(dbUser.Lozinka)) {
					resolve(jwt.loginJwt({ ...dbUser, ...{ currDatabase: res.locals.currDatabase } }));
				}
			}
			reject({ message: 'STD:INVALID_CREDENTIALS' });
		});
	}

};

router.get('/test', function (req, res) {
	res.send({ message: 'OK' });
});
router.get('/test/auth', function (req, res) {
	res.send(req.user);
});

router.put('/refreshJWT', async function (req, res) {
	const { token } = req.body;
	const { payload } = jwt.decodeToken(token) || {};
	if (payload) {
		const { LoginName } = payload;
		const dbUser = await fetchUserLogin({ LoginName }, res);
		if (dbUser) {
			res.send({ token: jwt.loginJwt({ ...dbUser, ...{ currDatabase: res.locals.currDatabase } }) });
		}
	} else {
		res.send({});
	}
});


router.post('/login', async function (req, res) {
	if (req.body && req.body.user) {
		const { LoginName, Lozinka } = req.body.user;
		if (LoginName.endsWith(global.appConfig.ldap.ldapDomena)) {
			try {
				const token = await login.signInWithLDAP({ LoginName, Lozinka }, res);
				if (token) {
					res.send({ token });
				}
			} catch (error) {
				global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace(error);
			}
		}
		login
			.userLogin(req, res, req.body.user)
			.then((token) => {
				res.send({ token: token });
			})
			.catch((err) => {
				res.status(401).send(err);
			});
	} else {
		res.status(401).send({ message: 'STD:INVALID_REQUEST' });
	}
});

router.get('/appUsers', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUser_select]', conn, res);
	db.execStoredProc(request, conn, res, '[]');
});

router.get('/appGroups', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUserGroup_select]', conn, res);
	db.execStoredProc(request, conn, res, '[]');
});

router.get('/userGroup', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationGroupZaUsera_select]', conn, res);
	request.addParameter('PkUsera', TYPES.Int, req.query.PkUsera);

	db.execStoredProc(request, conn, res, '[]');
});
router.get('/groupUsers', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUserZaAppGroupu_select]', conn, res);
	request.addParameter('PkApplicationUserGroup', TYPES.Int, req.query.PkApplicationUserGroup);

	db.execStoredProc(request, conn, res, '[]');
});
router.post('/appGroupSetUser', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUserApplicationUserGroup_InsertOrDelete]', conn, res);
	request.addParameter('KorisnikPkUsera', TYPES.Int, req.body.KorisnikPkUsera);
	request.addParameter('PkApplicationUserGroup', TYPES.Int, req.body.PkApplicationUserGroup);
	request.addParameter('UserSePridruzujeDaNe', TYPES.Int, req.body.UserSePridruzujeDaNe);
	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('User', TYPES.NVarChar, req.body.User);
	db.execStoredProc(request, conn, res, '[]');
});

function insertUser(registerMeta, res, sendMail = true, extraParams = {}) {
	return new Promise(async (resolve, reject) => {
		const conn = db.createConnection(res.locals.currDatabase);
		const request = db.createRequest('[Sigurnost].[spApplicationUser_insert]', conn, res);

		const handleLdapUsername = () => {
			if (registerMeta.Email && registerMeta.Email.includes('@')) {
				return registerMeta.Email.split('@')[0];
			}
		};

		request.addParameter('PrezimeUsera', TYPES.NVarChar, registerMeta.PrezimeUsera);
		request.addParameter('ImeUsera', TYPES.NVarChar, registerMeta.ImeUsera);
		request.addParameter('LDAPLoginName', TYPES.NVarChar, handleLdapUsername());
		request.addParameter('LoginName', TYPES.NVarChar, registerMeta.LoginName);
		request.addParameter('Lozinka', TYPES.NVarChar, kripto.encryptString(registerMeta.Lozinka));
		request.addParameter('ObaveznaIzmjenaLozinkeDaNe', TYPES.Int, registerMeta.ObaveznaIzmjenaLozinkeDaNe);
		request.addParameter('Email', TYPES.NVarChar, registerMeta.Email);
		request.addParameter('UserAktivanDaNe', TYPES.Int, registerMeta.UserAktivanDaNe);
		request.addParameter('StatusKorisnika', TYPES.Int, registerMeta.StatusKorisnika || 0);
		request.addParameter('UUID', TYPES.NVarChar, uuid());
		request.addParameter('PkUseraUnos', TYPES.Int, null);
		request.addParameter('User', TYPES.NVarChar, null);
		request.addParameter('Claims', TYPES.NVarChar, registerMeta.UserClaims || JSON.stringify(global.appConfig.jwtConfig.defaultUserClaims));
		request.addOutputParameter('PkUsera', TYPES.Int, null);
		db.execStoredProcFromNode(request, conn, res, async (output, outputParams, data) => {
			try {
				if (output == 'OK') {
					const { PkUsera } = outputParams;
					const dbUser = await fetchUserByPk(PkUsera, res);
					const { OIB } = extraParams;
					const { request: upsertOsobniPodaciReq, conn: upsertConn } = createUpsertOsobniPodaciRequest(
						{
							body: {
								Spol: null,
								ImeUsera: dbUser.ImeUsera,
								PrezimeUsera: dbUser.PrezimeUsera,
								DatumRodenja: null,
								OIB: OIB ? OIB : null,
								JMBAG: null,
								PkDrzava: null,
								Grad: null,
								Adresa: null,
								Email: dbUser.Email,
								Mobitel: null,
								LoginName: null,
								PkUsera: PkUsera,
								PkOsobniPodaciPkUsera: null
							}
						},
						res
					);
					db.execStoredProcFromNode(upsertOsobniPodaciReq, upsertConn, res, async (output, outputParams, data) => {
						resolve(dbUser);
					});
				} else {
					reject({ message: 'STD:REGISTER_FAILED' });
				}
			} catch (error) {
				reject(error);
			}
		});
	});
}

router.post('/appUserInsert', async function (req, res) {
	let userName = null;
	try {
		if (req.body.LoginName) {
			const dbUser = await fetchUserLogin(req.body, res);
			if (dbUser) userName = dbUser.LoginName;
		} else {
			return res.status(500).send({ message: 'STD:NO_USERNAME_PROVIDED' });
		}
		if (userName == req.body.LoginName) {
			return res.status(500).send({ message: 'STD:USERNAME_USED' });
		} else {
			const insertedUser = await insertUser(req.body, res);
			return res.status(200).send(insertedUser);
		}
	} catch (error) {
		res.status(500).send(error);
	}
});

router.post('/resendConfirmEmail', async function (req, res) {
	try {
		const { PkUsera } = req.body;
		const dbUser = await fetchUserByPk(PkUsera, res);
		global.systemLogger.log({
			level: 'info',
			message: 'IMAP-GMAIL: ' + JSON.stringify(result)
		});
		res.status(200).send({ message: 'OK' });
	} catch (error) {
		global.systemLogger.log({
			level: 'info',
			message: 'IMAP-GMAIL: ' + JSON.stringify(error)
		});
		res.status(500).send({ ...error, message: 'STD:EMAIL_NO_SEND' });
	}
});

router.post('/verifyAccount', async function (req, res) {
	try {
		const account = await findUserByUUID(req.body.UUID, res);
		if (account) {
			await setUserAccountActivityStatus({ status: 1, user: { ...account, UserAktivanDaNe: 1 }, res });
			res.status(200).send(await findUserByUUID(req.body.UUID, res));
		} else {
			res.status(500).send({ message: 'STD:ACC_NO_CONFIRM' });
		}
	} catch (error) {
		res.status(500).send({ ...error, message: 'STD:ACC_NO_CONFIRM' });
	}
});

router.post('/findUserByUsername', async function (req, res) {
	try {
		const account = await fetchUserLogin(req.body, res);
		if (req.body.onlyAvatar && account) {
			return res.status(200).send({
				AvatarPath: account.AvatarPath
			});
		}
		if (account) {
			return res.status(200).send({
				ImeUsera: account.ImeUsera,
				PkUsera: account.PkUsera,
				PrezimeUsera: account.PrezimeUsera,
				Email: account.Email
			});
		}
	} catch (error) {
		res.status(500).send({ ...error, message: 'STD:INVALID_CREDENTIALS' });
	}
});


router.post('/appUserUpdate', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUser_update]', conn, res);

	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('PrezimeUsera', TYPES.NVarChar, req.body.PrezimeUsera);
	request.addParameter('ImeUsera', TYPES.NVarChar, req.body.ImeUsera);
	request.addParameter('LDAPLoginName', TYPES.NVarChar, req.body.LDAPLoginName);
	request.addParameter('LoginName', TYPES.NVarChar, req.body.LoginName);
	request.addParameter('ObaveznaIzmjenaLozinkeDaNe', TYPES.Int, req.body.ObaveznaIzmjenaLozinkeDaNe);
	request.addParameter('Email', TYPES.NVarChar, req.body.Email);
	request.addParameter('UserAktivanDaNe', TYPES.Int, req.body.UserAktivanDaNe);
	request.addParameter('RowVersion', TYPES.NVarChar, req.body.RowVersion);
	request.addParameter('PkUseraPromjena', TYPES.Int, req.body.PkUseraPromjena);
	request.addParameter('User', TYPES.NVarChar, req.body.User);
	db.execStoredProc(request, conn, res, '[]');
});

router.post('/appUserAktivanUpdate', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUserAktivan_Update]', conn, res);
	request.addParameter('KorisnikPkUsera', TYPES.Int, req.body.KorisnikPkUsera);
	request.addParameter('AktivanDaNe', TYPES.Bit, req.body.AktivanDaNe);
	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('RowVersion', TYPES.NVarChar, req.body.RowVersion);
	request.addParameter('User', TYPES.NVarChar, req.body.User);
	db.execStoredProc(request, conn, res, '[]');
});

router.get('/userPravaApp', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spPravaKorisnika_select]', conn, res);
	request.addParameter('PkUsera', TYPES.Int, req.query.PkUsera);

	db.execStoredProc(request, conn, res, '[]');
});
router.post('/adminChangePasswordForUser', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUser_AdminChangePassword]', conn, res);

	request.addParameter('KorisnikPkUsera', TYPES.Int, req.body.KorisnikPkUsera);
	request.addParameter('NovaLozinka', TYPES.NVarChar, kripto.encryptString(req.body.NovaLozinka));
	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('RowVersion', TYPES.NVarChar, req.body.RowVersion);
	request.addParameter('User', TYPES.NVarChar, req.body.User);
	db.execStoredProc(request, conn, res, '[]');
});

router.post('/changePassword', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUser_ChangePassword]', conn, res);
	request.addParameter('KorisnikPkUsera', TYPES.Int, req.body.KorisnikPkUsera);
	request.addParameter('StaraLozinka', TYPES.NVarChar, kripto.encryptString(req.body.StaraLozinka));
	request.addParameter('NovaLozinka', TYPES.NVarChar, kripto.encryptString(req.body.NovaLozinka));
	request.addParameter('PkUsera', TYPES.Int, req.body.PkUsera);
	request.addParameter('User', TYPES.NVarChar, req.body.User);
	db.execStoredProc(request, conn, res, '[]');
});

router.post('/usernameExists', function (req, res) {
	const conn = db.createConnection(res.locals.currDatabase);
	const request = db.createRequest('[Sigurnost].[spApplicationUserLogin_select]', conn, res);
	request.addParameter('LoginName', TYPES.NVarChar, req.body.LoginName);

	db.execStoredProcFromNode(request, conn, res, (output, outputParams, dbUser) => {
		res.send({ used: dbUser.length ? true : false });
	});
});

module.exports = { securityRouter: router, login: login, fetchUserByPk: fetchUserByPk };
