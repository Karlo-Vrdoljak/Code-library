const process = require('process');

function handleWithLog(reason, promise, exceptionType) {
	global.appConfig.ukljuciConsoleLog.ukljuciStackTrace && console.trace({ reason }, { promise }, { exceptionType });

	switch (exceptionType) {
		case 'unhandledRejection':
			global.systemLogger.log({
				level: 'error',
				message: 'HANDLER: Unhandled Promise Rejection caught, reason: ' + reason
			});
			break;
		case 'uncaughtException':
			global.systemLogger.log({
				level: 'error',
				message: 'HANDLER: Exception caught, missing a trycatch somewhere, reason: ' + reason
			});
			break;

		default:
			break;
	}
}

/**
 *
 * @param  {...any} names process error events on global node process scale. defaults to "unhandledRejection", "uncaughtException"
 */
function useGlobalAppHandlers(...args) {
	if (args.length == 0) {
		args = ['unhandledRejection', 'uncaughtException'];
	}
	args.includes('unhandledRejection') && process.on('unhandledRejection', (reason, p) => handleWithLog(reason, p, 'unhandledRejection'));
	args.includes('uncaughtException') && process.on('uncaughtException',  (error) => handleWithLog(error, null, 'uncaughtException'));

}

module.exports = {
	useGlobalAppHandlers
};
