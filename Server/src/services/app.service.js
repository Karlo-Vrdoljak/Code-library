const axios = require('axios').default;
const ONE_SECOND = 1000;
const path = require('path');
const fs = require('fs');
const crypt = require('../kripto');

const { from } = require('rxjs');

function simpleDbResolve(output, outputParams, result, res, errMessage = 'STD:INVALID_REQUEST') {
	if (output == 'OK') {
		return res.status(200).send(result);
	}
	return res.status(500).send({ message: errMessage });
}
/**
 *
 * @param {'Produkcijska baza podataka'|'Testna baza podataka'} dbType
 */
async function pingDatabase(dbType, secure = false) {
	const { productionDatabaseServer, testDatabaseServer } = global.appConfig.databaseParams;
	try {
		const swapType = () => (dbType == 'Produkcijska baza podataka' ? productionDatabaseServer : testDatabaseServer);
		const httpOrHttps = () => (secure ? 'https://' : 'http://');
		const url = `${httpOrHttps()}${swapType()}`;
		await axios.get(url, { timeout: ONE_SECOND });
		return {};
	} catch (error) {
		const { response } = error;
		if (!(response && response.status)) {
			return { error: null };
		}
		return { error: true };
	}
}

async function dbResolveMiddleware(req, res, next) {
	if (req.method != 'OPTIONS') {
		const result = await pingDatabase(res.locals.currDatabase, req.secure);
		if (result.error) {
			res.status(503).send({ message: 'STD:CHECK_INTERNET_OR_VPN' });
		} else {
			next();
		}
	} else {
		next();
	}
}
/**
 *
 * @param {string[]} pathParts ['c', 'users', 'user', 'etc']
 */
function constructDirDepth(pathParts, rootDir = null) {
	const { directoryParams } = global.appConfig;

	return pathParts.reduce(
		(acc, dir) => {
			const targetPath = path.join(acc, dir);
			if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath);
			return targetPath;
		},
		rootDir ? path.join(rootDir) : path.join(directoryParams.nodeSrv)
	);
}
function atob(a) {
	return Buffer.from(a, 'base64').toString('binary');
}

function handleJWT(token) {
	if (!token) return {};
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(
		atob(base64)
			.split('')
			.map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join('')
	);

	return JSON.parse(jsonPayload);
}

async function handleRequestUser(req, res) {
	const user = req.user;
	if (user) {
		const { payload } = user;
		if (payload.PkUsera) {
			payload.PkUsera = +crypt.decryptString(payload.PkUsera);
		}
		return payload;
	} else if (req.headers && req.headers.authorization) {
		const { payload } = handleJWT(req.headers.authorization);
		if (payload.PkUsera) {
			payload.PkUsera = +crypt.decryptString(payload.PkUsera);
		}
		return payload;
	} else {
		// const { fetchUserByPk } = require('../jwt/security');
		// const defaultUser = await fetchUserByPk(1, res); // 1 is usually admin user
		// defaultUser.PkUsera = +crypt.decryptString(defaultUser.PkUsera);
		// return defaultUser;
		return {};
	}
}
/**
 *
 * @param {any} test against all possible falsy values (will still return false on "0" and "''")
 * @returns
 */
function exists(x) {
	if (x === '[object Object]') return false;
	if (['null', 'undefined'].includes(x)) return false;
	return !!x;
}
/**
 *
 * @param {any[]} valuesToGroup
 * @param {string} key
 * @returns {any} grouped by key
 */
function groupDataByKeySync(valuesToGroup, key) {
	return valuesToGroup.reduce((hash, obj) => {
		if (obj[key] === undefined) return hash;
		return Object.assign(hash, { [obj[key]]: (hash[obj[key]] || []).concat(obj) });
	}, {});
}
/**
 *
 * @param {any[]} valuesToGroup array
 * @param any[]} properties array of keys to group
 * @returns
 */
function groupByProperties(valuesToGroup, properties) {
	let result = [];

	// iterate over each item in the original array
	valuesToGroup.forEach(function (item) {
		// check if the item belongs in an already created group
		let added = result.some(function (group) {
			// check if the item belongs in this group
			let shouldAdd = properties.every(function (prop) {
				return group[0][prop] === item[prop];
			});
			// add item to this group if it belongs
			if (shouldAdd) {
				group.push(item);
			}
			// exit the loop when an item is added, continue if not
			return shouldAdd;
		});

		// no matching group was found, so a new group needs to be created for this item
		if (!added) {
			result.push([item]);
		}
	});
	return result;
}
/**
 *
 * @param {string} input takes the input and tries to decrpyt if successful, returns the decrypted string else the original input
 */
function decryptIfEncrypted(input) {
	return crypt.tryDecryptOrReturnInput(input);
}

function devLogger() {
	return new console.Console(fs.createWriteStream('./output.txt'));
}

function forEachOwnProperty(object, iterator) {
	for (let property in object) {
		if (Object.prototype.hasOwnProperty.call(object, property)) {
			iterator(property, object[property]);
		}
	}
}
/**
 *
 * @param {any} flat a level 1 depth object containing keys as 'x.y.z':value
 * @param {any} unflat returns nested object constructed as {x: { y:{ z: value }}}
 * @returns {any[]} unflat
 */
function groupFlatProperies(flat, unflat = {}) {
	forEachOwnProperty(flat, function (property, value) {
		property = property.split('.');

		let currentNode = unflat;

		for (let i = 0; i < property.length; i++) {
			let currentProperty = property[i];

			if (typeof currentNode[currentProperty] === 'undefined') {
				if (i === property.length - 1) {
					currentNode[currentProperty] = value;
				} else {
					if (/^\+?(0|[1-9]\d*)$/.test(property[i + 1])) {
						currentNode[currentProperty] = [];
					} else {
						currentNode[currentProperty] = {};
					}
				}
			}

			currentNode = currentNode[currentProperty];
		}
	});

	return unflat;
}

const constructConnection = (procName, dbName, res, dbContext) => {
	const conn = dbContext.createConnection(dbName);
	const request = dbContext.createRequest(procName, conn, res);
	return { request, conn };
};

const makeObservableConnection = (request, conn, res, db) => {
	return from(
		new Promise((resolve) => {
			db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
				if (output == 'OK') {
					resolve(result);
				}
				resolve([]);
			});
		})
	);
};
const makeObservableConnectionWithOutput = (request, conn, res, db, key) => {
	return from(
		new Promise((resolve) => {
			db.execStoredProcFromNode(request, conn, res, (output, outputParams, result) => {
				if (output == 'OK') {
					if (key in outputParams) {
						resolve({ [key]: outputParams[key] });
					} else {
						resolve({ [key]: null });
					}
				}
				resolve({ [key]: null });
			});
		})
	);
};

const flatten = (array) => {
	return [].concat.apply([], array);
};

const stringToSentence = (text) => {
	if (text) {
		text = text.replace(/\s+/g, ' ').trim();
		text = text[0].toUpperCase() + text.slice(1);
		if (!text.length) return null;
		return text.endsWith('.') ? text : text + '.';
	} else {
		return null;
	}
};
/**
 *
 * @param {{modul:string,claim:string}} authParams modul je glavni ulaz ekrana, claim je sta smi radit na ton ekranu
 */
async function hasClaim({ modul, claim }, req) {
	const user = await handleRequestUser(req);
	
	if (user) {
		//Ukoliko je admin moze radit sta oce
		if (user.IsAdmin) return true;
		
		if (user.Claims) {
			try {
				const claims = JSON.parse(user.Claims);

				return claims[modul][claim];
			} catch (error) {
				return false;
			}
		} else {
			return false;
		}
	} else {
		return false;
	}

}

async function isAdmin(req) {
	const user = await handleRequestUser(req);

	if (user && user.IsAdmin) {
		return true;
	} else {
		return false;
	}
}

module.exports = {
	simpleDbResolve,
	dbResolveMiddleware,
	constructDirDepth,
	handleRequestUser,
	exists,
	groupDataByKeySync,
	groupByProperties,
	decryptIfEncrypted,
	devLogger,
	groupFlatProperies,
	constructConnection,
	makeObservableConnection,
	makeObservableConnectionWithOutput,
	flatten,
	stringToSentence,
	hasClaim,
	isAdmin
};
