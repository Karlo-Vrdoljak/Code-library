// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	API_URL: 'http://localhost:8099/api/',
	PUBLIC_URL: 'http://localhost:8099/public/',
	AAI_PROVIDER_URL: 'http://lvh.me:8088/api/aai/',
	DEFAULT_IMAGE: './assets/images/placeholder.png',
	DEFAULT_IMAGE_DARK: './assets/images/placeholder_dark.png',
	LIGHT_THEME_LOCATION: '../../assets/css/themes/mdc-light-indigo/theme.css',
	DARK_THEME_LOCATION: '../../assets/css/themes/mdc-dark-indigo/theme.css',
	MAX_ANKETA_QUESTION: 20,
	APIRetryCount: 3,
	resolverContinueThroughError: true,
	trajanjeErrAlert: 5000,
	PAGINATION_OBAVIJESTI_ROW_NUMBER: 4,
	PAGINATION_FORUM_ROW_NUMBER: 3,
	PAGINATION_CLANSTVO_ROW_NUMBER: 6,
	PAGINATION_ANKETE: 4,
	PAGINATION_ANKETE_PUBLIC: 10,
	reCaptcha: {
		siteKey: '6LfFdDEbAAAAANzvja6l1VB8F6KOmIKxG4qHySRV',
		secretKey: '6LfFdDEbAAAAAPQmHCJyM90t9UyoV6wW4_EXSmJx',
	},
	aai: {
		issuer: 'fed-lab.aaiedu.hr',
		recourse: 'mefst-alumni-test',
		logoutUrl: "https://fed-lab.aaiedu.hr/slo"
	},
	LDAP_DOMAIN: '@lama.hr',
	userApplicationGroupsPk: {
		Admin: 1,
		OsnovnaPrava: 6
	},
	vrsteClanstvaPk: {
		STUDENTI: 1,
		ALUMNI: 2,
		PROFESORI: 3,
		ANONIMNI: 4
	},
	StatusKorisnikaDef: {
		Registriran: 0,
		Aktivan: 1,
		ZaboravioPass: 2,
		Blokiran: 3
	},
	UserClaims: {
		Forum: {
			modulName: 'Forum',
			Kategorija: 'Kategorija',
			Objava: "Objava",
			Komentar: "Komentar"
		},
		eBiblioteka: {
			modulName: 'eBiblioteka',
			Kategorija: "Kategorija",
			Datoteka: "Datoteka",
			Komentar: "Komentar"
		},
		Ankete: {
			modulName: 'Ankete',
			Predlozak: "Predlozak",
			Anketa: "Anketa"
		},
		Obavijesti: {
			modulName: 'Obavijesti',
			Dodavanje: "Dodavanje"
		}
	}
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error'; // Included with Angular CLI.

// below is a bypass dev siteKey and secretKey, no validation handle whatsoever.
// siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
// secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',

// API_URL: 'http://lamabeta.lama.hr:8096/api/',
// PUBLIC_URL: 'http://lamabeta.lama.hr:8096/public/',
