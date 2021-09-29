
var appRootPath = require('app-root-path'),
fs = require('fs');

// ucitavanje config datoteka
// appConfig.js je obuhvacena webpackom, JSON/ni nisu...


// ukljucivanje enkripcije je izbaceno iz jsona jer korisnik to ne smije vidit i mjenjat
// 14.9.2020 - odluceno na sastanku
global.appConfig = {
    encryptionConfig: {
        enkripcijaDaNe: true,
        encryptColumns: [
            "PkUsera",
            "PkOsobniPodaciPkUsera",
            "PkUseraUnos"
        ]
    }
};

var extAppConfig = fs.readFileSync('./config/appConfigExt.json', 'utf8');
extAppConfig = JSON.parse(extAppConfig.toString());

var customAppConfig = fs.readFileSync('./config/appConfig4App.json', 'utf8');
customAppConfig = JSON.parse(customAppConfig.toString());

global.appConfig = { ...global.appConfig, ...extAppConfig, ...customAppConfig };
global.appConfig.appRootPath = appRootPath;

var appConfig = global.appConfig;
module.exports = appConfig;