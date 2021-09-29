var crypto = require('crypto');

let encObj = {};

//konfiguracijske varijable za kriptiranje 
// algoritam za dekodiranje konfig varijabli
const cfgEncAlgorithm = 'aes-256-ctr',
    // kljuc za dekodiranje konfig varijabli
    cfgSecret = {
        // iv mora biti 16 byte dug
        iv: 'd6F3Efeqd6F3Efeq'.toString('hex').slice(0, 16),
        // key mora biti 32 byte dug
        key: Buffer.from("d6F3Efeqd6F3Efeqd6F3Efeqd6F3Efeq".toString().slice(0, 32), 'utf8')
    };

encObj.cfgKeyDecrypt = function (inputString) {
    let decryptString = '';
    try {
        var decipher = crypto.createDecipheriv(cfgEncAlgorithm, cfgSecret.key, cfgSecret.iv)
        decryptString = decipher.update(inputString, 'hex', 'utf8')
        decryptString += decipher.final('utf8');
    }
    catch (error) {
        global.systemLogger.log({
            level: 'error',
            message: 'Greška: dekripcija cfgKey: ' + inputString + ' : ' + error.message
        });
    }
    return decryptString;
}

encObj.cfgKeyEncrypt = function (inputString) {
    var cryptString = '';
    try {
        var cipher = crypto.createCipheriv(cfgEncAlgorithm, cfgSecret.key, cfgSecret.iv);
        cryptString = cipher.update(inputString, 'utf8', 'hex');
        cryptString += cipher.final('hex');
    }
    catch (error) {
        global.systemLogger.log({
            level: 'error',
            message: 'Greška: enkripcija cfgKey: ' + inputString + ' : ' + error.message
        });
    }
    return cryptString;
};

// algoritam za kodiranje&dekodiranje podataka
// dataCryptoAlg aes-256-ctr
// dataSecretiv 448942efd74d41000dc5e2a64333
// dataSecretkey masterofpuppets2Lama.3e5t6csksjuhseikuhiuowse

const dataCryptoAlgorithm = encObj.cfgKeyDecrypt(global.appConfig.codes.delta),
    // saltevi za poboljsanje enkripcije
    dataSecret = {
        iv: encObj.cfgKeyDecrypt(global.appConfig.codes.alpha).toString('hex').slice(0, 16),
        key: Buffer.from(encObj.cfgKeyDecrypt(global.appConfig.codes.beta).toString().slice(0, 32), 'utf8')
    };











var encryptString = encObj.encryptString = function (inputString) {
    if (inputString && inputString !== '' && inputString !== null && inputString !== undefined && inputString.length > 0) {
        try {
            const cipher = crypto.createCipheriv(dataCryptoAlgorithm, dataSecret.key, dataSecret.iv);
            let encrypted = cipher.update(inputString, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        } catch (error) {
            global.systemLogger.log({
                level: 'warn',
                message: 'Greška u enkripciji stringa: ' + inputString + ' ' + error.message
            });
            return;
        }
    } else {
        return inputString;
    }

};

var decryptString = encObj.decryptString = function (inputString) {
    if (inputString && inputString !== '' && inputString !== null && inputString !== undefined && inputString.length > 0) {
        try {
            const decipher = crypto.createDecipheriv(dataCryptoAlgorithm, dataSecret.key, dataSecret.iv);
            let decrypted = decipher.update(inputString, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            global.systemLogger.log({
                level: 'warn',
                message: 'Greška u dekripciji stringa: ' + inputString + ' ' + error.message
            });
            return;
        }
    } else {
        return inputString;
    }
};

encObj.tryDecryptOrReturnInput = function (inputString) {
    if (inputString && inputString !== '' && inputString !== null && inputString !== undefined && inputString.length > 0) {
        try {
            const decipher = crypto.createDecipheriv(dataCryptoAlgorithm, dataSecret.key, dataSecret.iv);
            let decrypted = decipher.update(inputString, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            return inputString
        }
    } else {
        return inputString;
    }
}


// --------------------------------------------------------
// DEKRIPCIJA ZA SLANJE SA KLIJENTA NA SERVER
// --------------------------------------------------------
var dekriptirajPk = encObj.dekriptirajPk = function (obj) {
    if (obj) {

        let kolone = [];// kolone koje se enkriptiraju iz configa --lowercase
        global.appConfig.encryptionConfig.encryptColumns.forEach(element => {
            kolone.push(element.toLowerCase())
        });

        let propertyArray = Object.keys(obj);

        // ovdje moram radit foreach jer properti moze biti objekt koji rekurzivno poziva funkciju
        propertyArray.forEach(prop => {

            if (typeof obj[prop] == "object" && obj[prop] !== null) {
                dekriptirajPk(obj[prop]);
            } else {


                if (prop && kolone.includes(prop.toLowerCase())) {
                    obj[prop] = decryptString(obj[prop]);
                }

            }
        });
    }
}



// --------------------------------------------------------
// ENKRIPCIJA ZA SLANJE NA KLIJENT
// --------------------------------------------------------
var encryptColumnsToClient = encObj.encryptColumnsToClient = function (ResultObjArray) {
    // sada kad imam objekte prolazim po property i trazim koje treba enkriptirati
    let vratiErr = false;


    if (ResultObjArray && ResultObjArray[0]) {

        let kolone = []; // kolone koje se enkriptiraju iz configa --lowercase
        global.appConfig.encryptionConfig.encryptColumns.forEach(element => {
            kolone.push(element.toLowerCase())
        });

        // za svaki objekt u arrayu
        for (const obj of ResultObjArray) {


            // pronalazim one kolone koje enkriptiramo
            let propertyArray = Object.keys(obj);
            propertyArray = propertyArray.filter(prop => {
                return kolone.includes(prop.toLowerCase())
            })

            propertyArray.forEach(prop => {

                if (prop && obj[prop]) {
                    let enkriptirano = encryptString(obj[prop].toString());
                    if (enkriptirano) {
                        obj[prop] = enkriptirano;
                    } else {
                        vratiErr = true;
                    }
                }

            });


            // prekidam i ovaj loop
            if (vratiErr) {
                break;
            }
        }
    }

    if (vratiErr == true) {
        return 'NOK';
    } else {
        return ResultObjArray;
    }
}





/**
 *  _____________ ADMIN pass hash BEGIN __________
 */

encObj.decryptAdminPassword = function (inputString, log = true) {
    if (inputString && inputString !== '' && inputString !== null && inputString !== undefined && inputString.length > 3) {
        try {
            inputString = removeSaltFromAdminPassword(inputString);
            let date = new Date();
            const [m,y,d] = [date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCFullYear()];
            let keyPayload = m+y+d + dataSecret.key;
            const key = Buffer.from(keyPayload.toString().slice(0, 32), 'utf8')
            const decipher = crypto.createDecipheriv(dataCryptoAlgorithm, key, dataSecret.iv);
            let decrypted = decipher.update(inputString, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            if (log) {
                global.systemLogger.log({
                    level: 'warn',
                    message: 'Greška u dekripciji stringa: ' + inputString + ' ' + error.message
                });
            }
            return;
        }
    } else {
        return inputString;
    }
};

let indexSplit = function(value, index)
{
 return [value.substring(0, index), value.substring(index)];
}

let getRandomText = function(length) {
  let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".match(/./g);
  let text = "";
  for (var i = 0; i < length; i++) text += charset[Math.floor(Math.random() * charset.length)];
  return text;
}
let addSaltToAdminPassword = function(pass) {
    return indexSplit(pass,1).map(i => i + getRandomText(4)).join('');
}

let removeSaltFromAdminPassword = function(pass) {
    return indexSplit(pass,1).map((str,i) => i == 1? str.slice(4,str.length - 4): str).join('')
}

/**
 * @param {string} username username od acc-a u kojeg admin zeli ući
 * @description kreira dnevni pass za admina
 */
 encObj.generateAdminPassword = function (username, log = true) {
    if (username && username !== '' && username !== null && username !== undefined && username.length > 3) {
        try {
            let date = new Date();
            const [m,y,d] = [date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCFullYear()];
            let keyPayload = m+y+d + dataSecret.key;
            const key = Buffer.from(keyPayload.toString().slice(0, 32), 'utf8');
            const cipher = crypto.createCipheriv(dataCryptoAlgorithm, key, dataSecret.iv);
            let encrypted = cipher.update(username, 'utf8', 'hex');
            encrypted += cipher.final('hex'); // 0 +1, len -2
            
            return addSaltToAdminPassword(encrypted);
        } catch (error) {
            if (log) {
                global.systemLogger.log({
                    level: 'warn',
                    message: 'Greška u enkripciji stringa: ' + username + ' ' + error.message
                });
            }
            return;
        }
    } else {
        return username;
    }
};
/**
 *  _____________ ADMIN pass hash END __________
 */






module.exports = encObj;