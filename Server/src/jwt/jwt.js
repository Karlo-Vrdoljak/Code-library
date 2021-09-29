const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const kripto = require('../kripto.js');

const jwtService = {


    config: null,
    init: function () {
        this.config = JSON.parse(JSON.stringify(global.appConfig.jwtConfig));
        this.decryptConfig();
        return this
    },
    /**
     * @wantedSideEffect jwtService.config
     * @description decrypts all config defined properties.
     */
    decryptConfig: function() {
        this.config.decryptKeys.forEach(prop => {
            // poziv za rekurzivno dekriptiranje svih propertya
            this.eachRecursive(this.config, prop, kripto.decryptString);
        });
        this.config.acceptableSecrets = this.config.acceptableSecrets.map(key => kripto.decryptString(key)); 
    },
    /**
     * 
     * @param {any} obj any object 
     * @param {string} target object key 
     * @param {function} fn a function that does whatever manupulation on obj's target property 
     */
    eachRecursive: function (obj, target, fn) {
        for (var k in obj) {
            if (typeof obj[k] == "object" && obj[k] !== null)
                this.eachRecursive(obj[k], target, fn);
            else if (k == target) {
                obj[k] = fn(obj[k]);
            }
        }
    },
    loginJwt: function (payload) {
        return jwt.sign({ payload }, this.config.jwtSecret, { expiresIn: this.config.expiresIn, algorithm: this.config.algorithm });
    },
    signJwt: function (payload,secret) {
        return jwt.sign({ payload }, secret, { expiresIn: this.config.expiresIn, algorithm: this.config.algorithm });
    },
    extractJwt: function (authHeader) {
        if (authHeader && authHeader.length) {
            return authHeader.split(' ')[1];
        }
        return null;
    },
    /**
     * 
     * @param {string} token
     * @return {boolean} true if valid, false otherwise
     */
    isValidJWTToken: function (token) {
        try {
            jwt.verify(token, this.config.jwtSecret, { algorithms: [this.config.algorithm] });
            return true;
        } catch (error) {
            return false;
        }
    },
    /**
     * 
     * @param {string} token
     * @return {*} decoded JWT token
     */
    decodeToken: function (token) {
        return jwt.decode(token);
    },
    /**
     * @param {*} req 
     * @param {string} token
     * @returns {Promise<boolean|any>} 
     */
    verifyJwtAndReturnAuthData: function (req = null, token = null) {
        return new Promise((resolve, reject) => {
            if (req && token == null) {
                token = this.extractJwt(req.headers.authorization);
            }
            if (token == null) {
                reject(false);
            }
            if(this.isValidJWTToken(token)) {
                resolve(this.decodeToken(token));
            } else {
                reject(false);
            }
        });
    },
    /**
     * @param {*} req HTTTP request
     * @param {*} payload decoded payload from Base64
     * @param {*} done callback to end this validation function 
     * {@link https://github.com/auth0/express-jwt/blob/5fb8c88067b9448d746d04ab60ad3b1996c7e310/README.md#multi-tenancy Click here for more details!}
     */
    findValidSecret: function (req, payload, done) {
        let tryValidateToken = (token, secret) => {
            try {
                jwt.verify(token, secret, { algorithms: [jwtService.config.algorithm] });
                return true;
            } catch (error) {
                return false;
            }
        };
        
        let token = jwtService.extractJwt(req.headers.authorization);
        if(token == null) {
            return done(null,null);
        }
        // 1st try with own app's secret key
        let ownSecret = tryValidateToken(token, jwtService.config.jwtSecret) == true? jwtService.config.jwtSecret: undefined;

        if(ownSecret != undefined) {
            return done(null, jwtService.config.jwtSecret);
        }
        
        // 2nd try with list of accepted secret keys

        let acceptableSecret = jwtService.config.acceptableSecrets.find(acceptableSecret => tryValidateToken(token, acceptableSecret));

        if(acceptableSecret != undefined) {
            return done(null, acceptableSecret);
        }
        return done(null,null); // let express-jwt handle the error to get 401
    },
    /**
     * Valid jwt token will hold payload object in "req.user"
     */
    jwtMiddleware: function () {
        let result = expressJwt({
            secret: this.findValidSecret, algorithms: [this.config.algorithm]
        }).unless({
            path: [
                '/api/test',
                '/api/security/test',
                '/api/security/login',
                /\/public*/,
                '/api/obavijesti/obavijest',
                '/api/obavijesti/obavijestCategoryGroup',
                '/api/obavijesti/obavijestForCategoryFTS',
                '/api/obavijesti/obavijestiKategorija',
                '/api/obavijesti/obavijestiKategorijaAll',
                '/api/obavijesti/obavijestForCategory',
                '/api/forum/kategorije',
                '/api/forum/potkategorije',
                '/api/forum/komentari',
                '/api/forum/objave',
                '/api/forum/objavaPrilozi',
                '/api/resursi/ResursiKategorije',
                '/api/resursi/ResursiPotkategorije',
                '/api/resursi/ResursiKomentari',
                '/api/resursi/ResursiObjave',
                '/api/resursi/ResursiObjavaPrilozi',
                '/api/profile/profile',
                '/api/profile/osobniPodaciVrste',
                '/api/profile/getDrzave',
                '/api/profile/profileVrsta',
                '/api/profile/attachments',
                '/api/profile/uploadedFile',
                '/api/profile/vrstaClanstva',
                '/api/profile/clanoviVrsta',
                '/api/google/oauth',
                '/api/ankete/ankete',
                '/api/ankete/predlosci',
                '/api/ankete/anketa/solved/check',
                '/api/ankete/anketa/solved',
                '/api/ankete/anketa/statistika',
                '/api/ankete/predlozak/templating',
                '/api/security/usernameExists',
                '/api/google/oauth/complete',
                '/api/security/appUserInsert',
                '/api/security/findUserByUsername',
                '/api/security/resendConfirmEmail',
                '/api/security/verifyAccount',
                '/api/security/sendPassChangeEmail',
                '/api/security/resetForgottenPassword',
                '/api/security/aaiLogin',
                '/api/security/ldapLogin',
                /\/*test/

            ]
        });
        return result;
    },
};

jwtService.init();

module.exports = jwtService;