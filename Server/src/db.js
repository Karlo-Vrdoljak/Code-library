var greska = [], // objekt koji vraca gresku
	outputvalue = [], // output parametar kod azuriranja podataka
	crypt = require('./kripto.js'),
	ConnectionPool = require('tedious-connection-pool');

var config = {
	server: global.appConfig.databaseParams.productionDatabaseServer,
	userName: crypt.decryptString(global.appConfig.databaseParams.productionUserName),
	password: crypt.decryptString(global.appConfig.databaseParams.productionPassword),
	options: {
		encrypt: true,
		database: global.appConfig.databaseParams.productionDatabaseName,
		instanceName: global.appConfig.databaseParams.productionDatabaseServerInstanceName,
		trustServerCertificate: true
	},
	authentication: {
		type: 'default',
		options: {
			userName: crypt.decryptString(global.appConfig.databaseParams.productionUserName),
			password: crypt.decryptString(global.appConfig.databaseParams.productionPassword)
		}
	}
};

var config4Test = {
	server: global.appConfig.databaseParams.testDatabaseServer,
	userName: crypt.decryptString(global.appConfig.databaseParams.testUserName),
	password: crypt.decryptString(global.appConfig.databaseParams.testPassword),
	options: {
		encrypt: true,
		database: global.appConfig.databaseParams.testDatabaseName,
		instanceName: global.appConfig.databaseParams.testDatabaseServerInstanceName
	},
	authentication: {
		type: 'default',
		options: {
			userName: crypt.decryptString(global.appConfig.databaseParams.testUserName),
			password: crypt.decryptString(global.appConfig.databaseParams.testPassword)
		}
	}
};

var poolConfig = {
	min: 2,
	max: 4,
	log: false,
	acquireTimeout: 300000
};

let pool, pool4Test;
function createPool() {
	try {
		pool = new ConnectionPool(poolConfig, config); // pool za produkcijsku bazu
		pool.on('error', function (err) {
			pool.drain();
		});
		pool.on('debug', (connection, message) => {
			global.systemLogger.log({
				level: 'error',
				message: ' pool error  ' + connection + message
			});
		});
		module.exports.pool = pool;

		pool4Test = new ConnectionPool(poolConfig, config4Test); // pool za testnu bazu
		pool4Test.on('error', function (err) {
			pool4Test.drain();
		});
		pool4Test.on('debug', (connection, message) => {
			global.systemLogger.log({
				level: 'error',
				message: ' pool4Test error  ' + connection + message
			});
		});
		module.exports.pool4Test = pool4Test;
	} catch (error) {
		global.systemLogger.log({
			level: 'error',
			message: 'create pool error  ' + error
		});
	}
}
createPool();

function createConnection(currDatabase) {
	try {
		//currDatabase = 'Testna baza podataka' za testnu, 'Produkcijska baza podataka' za produkciju
		var Connection = require('tedious').Connection;
		if (currDatabase === 'Testna baza podataka') {
			var connection = new Connection(config4Test);
		} else if (currDatabase === 'Produkcijska baza podataka') {
			connection = new Connection(config);
		} else {
			connection = null;
		}
		connection.connect();
		return connection;
	} catch (error) {
		global.systemLogger.log({
			level: 'error',
			message: ' SQL Create Connection error  ' + error
		});
		connection = null;
		return connection;
	}
}

function createRequest(query, connection, res) {
	var Request = require('tedious').Request;
	var req = new Request(query, function (err, rowCount) {
		if (err) {
			global.systemLogger.log({
				level: 'error',
				message: 'SQL Create Req error ' + err.message
			});

			if (res && !res.finished && !res.headersSent) {
				try {
					// res.status(500).write(JSON.stringify(err));
					// res.end();
					res.status(503).send({ message: 'STD:CHECK_INTERNET_OR_VPN' });
				} catch (error) {
					global.systemLogger.log({
						level: 'error',
						message: 'SQL Create Req error ' + (error && error.message)
					});
				}
			}
		}
		connection && connection.close();
	});
	return req;
}

function createRequestPool(query, connection) {
	var Request = require('tedious').Request;
	var req = new Request(query, function (err, rowCount) {
		if (err) {
			global.systemLogger.log({
				level: 'error',
				message: 'SQL Create POOL Req error ' + err.message
			});
		}
		connection.release();
	});
	return req;
}

function execStoredProc(query, connection, output, defaultContent, callback) {
	var request = query;
	var greska = [];
	var outputParams = [];
	var dbResultObj = [];
	if (typeof query == 'string') {
		request = this.createRequest(query, connection);
	}
	var empty = true;

	request.on('row', function (columns) {
		empty = false;

		var rowObject = {};
		columns.forEach(function (column) {
			rowObject[column.metadata.colName] = column.value;
		});
		dbResultObj.push(rowObject);
	});

	request.on('doneProc', function (rowCount, more, returnStatus, rows) {
		// ako je doslo do greske
		if (greska.length > 0) {
			output.status(500).write(JSON.stringify(greska[0]));
		}
		// ako nema nista u selectu uzima output params
		if (empty && greska.length == 0) {
			if (global.appConfig.encryptionConfig.enkripcijaDaNe) {
				outputParams = crypt.encryptColumnsToClient(outputParams);
			}
			if (outputParams == 'NOK') {
				output.status(500).write(JSON.stringify({ message: 'error' }));
			} else {
				output.write(JSON.stringify(outputParams));
			}
		}
		// ako ima zapisa
		if (!empty && greska.length == 0) {
			// gledam da li je u pravom formatu i parsiram ako nije
			dbResultObj = parsirajJSON(dbResultObj);
			if (global.appConfig.encryptionConfig.enkripcijaDaNe) {
				dbResultObj = crypt.encryptColumnsToClient(dbResultObj);
			}
			if (dbResultObj == 'NOK') {
				output.status(500).write(JSON.stringify({ message: 'error' }));
			} else {
				output.write(JSON.stringify(dbResultObj));
			}
		}
		outputParams = [];
		output.end();
	});

	request.on('returnValue', function (parameterName, value, metadata) {
		var temp = {};
		temp[parameterName] = value;
		outputParams.push(temp);
	});

	connection.on('errorMessage', function (err) {
		if (err) {
			greska.push(err);
		}
	});

	request.on('error', function (err) {
		global.systemLogger.log({
			level: 'error',
			message: 'Req error ' + err.message
		});
	});

	connection.on('connect', function (err) {
		if (err) {
			console.log(err);
		}
		connection.callProcedure(request);
	});
}

function execStoredProcFromNode(query, connection, output, callback) {
	var request = query,
		greska = [],
		outputvalue = [],
		outputParams = {},
		dbResultObj = [],
		resultRowCount = 0,
		empty = true;

	request.on('doneProc', function (rowCount, more, returnStatus, rows) {
		if (greska.length > 0) {
			output = 'NOK';
			callback(output, outputParams, dbResultObj);
		}
		if (empty && greska.length == 0) {
			//output.write(defaultContent);
			output = 'OK';
			if (global.appConfig.encryptionConfig.enkripcijaDaNe) {
				outputParams = crypt.encryptColumnsToClient(outputParams);
				dbResultObj = crypt.encryptColumnsToClient(dbResultObj);
			}
			callback(output, outputParams, dbResultObj);
		}
	});

	request.on('row', function (columns) {
		var rowObject = {};
		columns.forEach(function (column) {
			rowObject[column.metadata.colName] = column.value;
		});
		dbResultObj.push(rowObject);
	});

	connection.on('errorMessage', function (err) {
		console.log('errorMessage');
		console.log('err', err);
		if (err) {
			greska.push(err);
		}
	});

	request.on('returnValue', function (parameterName, value, metadata) {
		outputParams[parameterName] = value;
	});

	connection.on('connect', function (err) {
		if (err) {
			console.log(err);
		}
		connection.callProcedure(request);
	});
}

function execStoredProcNoJSONLocalResults(dbRequest, connection, req, res, callback) {
	var request = dbRequest;
	var resultData = [];
	greska = [];

	request.on('row', function (columns) {
		var rowObject = {};
		columns.forEach(function (column) {
			rowObject[column.metadata.colName] = column.value;
		});
		resultData.push(rowObject);
	});
	request.on('doneProc', function () {
		if (global.appConfig.encryptionConfig.enkripcijaDaNe) {
			resultData = crypt.encryptColumnsToClient(resultData);
		}
		if (greska.length === 0) {
			if (typeof callback === 'function') {
				callback(
					{
						resultStatus: '0',
						resultData: resultData
					},
					req,
					res
				);
			} else {
				return {
					resultStatus: '0',
					resultData: resultData
				};
			}
		} else {
			if (typeof callback === 'function') {
				callback(greska, req, res);
			} else {
				return {
					greska
				};
			}
		}
	});
	connection.on('errorMessage', function (err) {
		console.log('error errorMessage', err.message);
		if (err) {
			greska = {
				resultStatus: '9999',
				resultData: err
			};
			return {
				resultStatus: err.message,
				resultData: err
			};
		}
	});
	connection.on('connect', function (err) {
		if (err) {
			console.log('error connect');
		}
		connection.callProcedure(request);
	});
}

// TRANSAKCIJA
function createTransactionRequest(query, connection) {
	var Request = require('tedious').Request;
	var req = new Request(query, function (err, rowCount) {
		if (err) {
			global.apiLogger.log({
				level: 'error',
				message: ' error in db.createTransactionRequest  ' + err
			});
		}
		connection; //&& connection.close();
	});
	return req;
}

function beginTransaction(connection, callback) {
	connection.on('connect', function (err) {
		if (err) {
			console.log('error in db.beginTransaction', err);
			global.apiLogger.log({
				level: 'error',
				message: ' error in db.beginTransaction  ' + err
			});
		}
		connection.beginTransaction(function (err, result) {
			if (err) {
				console.log('error in db.beginTransaction', err);
				global.apiLogger.log({
					level: 'error',
					message: ' error in db.beginTransaction  ' + err
				});
			}
			if (result) {
				callback();
			}
		});
	});
}

function commitTransaction(connection) {
	connection.commitTransaction(function (err) {
		if (err) {
			console.log('error in db.commitTransaction', err);
			global.apiLogger.log({
				level: 'error',
				message: ' error in db.commitTransaction  ' + err
			});
			connection.rollbackTransaction(function (err) {});
		}
		connection.close();
	});
}

function execStoredProcInTransaction(query, connection, output, outputParams = {}, callback) {
	var request = query,
		greska = [],
		outputvalue = [],
		dbResultObj = [],
		resultRowCount = 0,
		empty = true;
	if (connection.state.name == 'LoggedIn') {
		connection.callProcedure(request);
	}

	request.on('row', function (columns) {
		var rowObject = {};
		columns.forEach(function (column) {
			rowObject[column.metadata.colName] = column.value;
		});
		dbResultObj.push(rowObject);
	});

	connection.on('errorMessage', function (err) {
		if (err) {
			greska.push(err);
		}
	});

	request.on('requestCompleted', function () {
		if (greska.length > 0) {
			output = greska[0];
			callback(output, outputParams, dbResultObj);
		}
		if (empty && greska.length == 0) {
			//output.write(defaultContent);
			output = 'OK';
			if (global.appConfig.encryptionConfig.enkripcijaDaNe) {
				outputParams = crypt.encryptColumnsToClient(outputParams);
				dbResultObj = crypt.encryptColumnsToClient(dbResultObj);
			}
			callback(output, outputParams, dbResultObj);
		}
	});

	request.on('error', function () {
		connection.rollbackTransaction(function (err) {
			if (err) {
			}
		});
		connection.close(); // ovo nisam siguran
	});

	connection.on('infoMessage', function (info) {
		if (info.number === 3621) {
			console.log('DeadLock', info.number, info.message, info.state); // 3621 - ercode napravi handler za ovu gresku
		}
		// if (info) {
		//   greska.push(info);
		// }
	});

	request.on('returnValue', function (parameterName, value, metadata) {
		outputParams[parameterName] = value;
	});

	connection.on('connect', function (err) {
		if (err) {
			console.log(err);
		}
		connection.callProcedure(request);
	});
}

function parsirajJSON(data) {
	try {
		var jsonKeys = Object.keys(data);
		var dataObj = '';
		var jsonKey = '';
		for (var i = 0; i < jsonKeys.length; i++) {
			jsonKey = Object.keys(data[i]);
			dataObj = dataObj + data[i][jsonKey].toString();
		}
		return JSON.parse(dataObj);
	} catch (error) {
		return data;
	}
}

module.exports.createConnection = createConnection;
module.exports.pool = pool;
module.exports.pool4Test = pool4Test;
module.exports.createRequest = createRequest;
module.exports.createRequestPool = createRequestPool;
module.exports.execStoredProc = execStoredProc;
module.exports.execStoredProcFromNode = execStoredProcFromNode;
module.exports.execStoredProcNoJSONLocalResults = execStoredProcNoJSONLocalResults;

module.exports.createTransactionRequest = createTransactionRequest;
module.exports.beginTransaction = beginTransaction;
module.exports.commitTransaction = commitTransaction;
module.exports.execStoredProcInTransaction = execStoredProcInTransaction;
