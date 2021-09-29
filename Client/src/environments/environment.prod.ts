export const environment = {
	production: true,
	API_URL: 'https://alumni.mefst.hr/AlumniApi/api/',
	PUBLIC_URL: 'https://alumni.mefst.hr/AlumniApi/public/',
	AAI_PROVIDER_URL: 'https://alumni.mefst.hr/AAIlogin/api/aai/',
	DEFAULT_IMAGE: './assets/images/alumni.jpg',
	DEFAULT_IMAGE_DARK: './assets/images/placeholder_dark.png',
	LIGHT_THEME_LOCATION: './assets/css/themes/mdc-light-indigo/theme.css',
	DARK_THEME_LOCATION: './assets/css/themes/mdc-dark-indigo/theme.css',
	MAX_ANKETA_QUESTION: 20,
	APIRetryCount: 3,
	resolverContinueThroughError: true,
	PAGINATION_OBAVIJESTI_ROW_NUMBER: 4,
	PAGINATION_FORUM_ROW_NUMBER: 10,
	PAGINATION_CLANSTVO_ROW_NUMBER: 48,
	trajanjeErrAlert: 5000,
	PAGINATION_ANKETE: 12,
	PAGINATION_ANKETE_PUBLIC: 50,
	reCaptcha: {
		siteKey: '6LfFdDEbAAAAANzvja6l1VB8F6KOmIKxG4qHySRV',
		secretKey: '6LfFdDEbAAAAAPQmHCJyM90t9UyoV6wW4_EXSmJx',
	},
	aai: {
		issuer: 'login.aaiedu.hr',
		recourse: 'mefst-alumni',
		logoutUrl: "https://moj.aaiedu.hr/slo"
	},
	LDAP_DOMAIN: '@mefst.hr',	
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
};
