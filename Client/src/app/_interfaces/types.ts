import { SafeUrl } from '@angular/platform-browser';

export interface RequestCleanup {
	warn: (message: string, header?: string) => void;
	err: (err: any) => void;
	done: () => void;
	doneBg: () => void;
	doneToast: (msg: string, header?: string) => void;
	start: () => Promise<boolean>;
	startBg: () => Promise<boolean>;
	isLoading: boolean;
}
export const TYPING_DEBOUNCE = 500;
export const ONE_SECOND = 1000;
export const SIZE_5MB = '5242880';
export const SIZE_50MB = '52428800';
export const ACCEPT_IMAGES = 'image/*';
export enum EStep {
	ONE = 1,
	TWO = 2,
}
export const MAX_LOADER_SHOW = 10000;

export enum ELocalStorage {
	ACC_CONFIRM = 'alumni_user_in_confirmation_process',
	THEME = 'alumni_theme',
	LANG = 'alumni_lang',
	JWT = 'alumniToken',
	SELECTED_KATEGORIJE = 'alumni_selected_kategorije_obavijest_view',
	AAI_JWT = 'alumni_aai_jwt'
}

export enum EAccountStatus {
	REGISTRIRAN = 0,
	AKTIVAN = 1,
	ZABORAVIO_PASS = 2,
	ADMIN_ISKLJUCIO = 3,
}
export enum EObavijestObjavaStatus {
	INACTIVE = 0,
	PREPATION = 1,
	OBJAVLJEN = 2,
}
export const purgeFalsyValueFromKeyValueObject = (obj) => (obj ? obj : {});
export const purgeArrayIfFalsy = (array) => (array ? array : []);
export const handle = (promise) => promise.then((res) => [null, res]).catch((err) => [err, null]);
export const navItems = [

	{
		id: 'resursi',
		label: 'DIGITALNABIBLIOTEKA',
		icon: 'pi pi-book',
		link: '/resources',
	},
	{
		id: 'pretplate',
		label: 'MOJE_PRETPLATE',
		icon: 'pi pi-envelope',
		link: '/subscriptions'
	},
	{
		id: 'administracija',
		label: 'ADMINISTRACIJA',
		icon: 'pi pi-user-edit',
		link: '/administration'
	}
];

export const dateFormatTemplatePrimeNG = 'dd.mm.yy.';

export enum RegexValidators {
	MOBILE_PHONE = '^[- +()0-9]+$',
}

export interface VrstaClanstva {
	PkVrstaClanstva: number;
	VrstaClanstvaNaziv: string;
}

export interface HomeObavijesti {
	NazivKategorije: string;
	ObavijestCoverImagePath: string;
	ObavijestDatumObjave: string;
	ObavijestDatumUnosa: string;
	ObavijestDatumZadnjePromjene: string;
	ObavijestHtml: string;
	ObavijestKategorijaAktivnaDaNe: number;
	ObavijestKategorijaDatumUnosa: string;
	ObavijestKategorijaUserUnos: string;
	ObavijestNaslov: string;
	ObavijestStatus: number;
	ObavijestUserUnos: string;
	ObavijestTags: string;
	ObavijestUserZadnjePromjene: string;
	PkObavijest: number;
	PkObavijestKategorija: number;
	PkUsera: number;
	DatumIskljucenjaObavijest?: Date;
	VidljivoClanovima?: any[];
}

export interface Interaction {
	id: EInteractionReducer;
	args?: any;
}
export enum EInteractionReducer {
	scroll,
	logoff,
	avatarChanged,
	loggedIn,
	personalInfoChanged
}
export enum EPrimengKeys {
	globalToast = 'globalToast',
	globalConfirm = 'globalConfirm',
}
export interface ObavijestKategorija {
	PkObavijestKategorija: number;
	NazivKategorije?: string;
	UserUnos?: string;
	DatumUnosa?: any;
	AktivnaDaNe: number;
}
export interface BreadCrumb {
	label: string;
	link: string;
	query?: string[];
	noTranslate?: boolean;
}

export interface OsobniPodaci {
	Adresa?: string;
	DatumRodenja?: Date;
	Grad?: string;
	IDDrzaveNN?: string;
	JMBAG?: string;
	Mobitel?: string;
	NazivDrzave?: string;
	OIB?: string;
	PeriodDo?: Date;
	PeriodOd?: Date;
	PkDrzava?: number;
	PkOsobniPodaciPkUsera: number;
	Spol?: string;
	Email: string;
	ImePrezimeUsera: string;
	ImeUsera: string;
	PrezimeUsera: string;
	LoginName: string;
	StatusKorisnika: number;
	UserAktivanDaNe: number;
	VrstaClanstvaNaziv: string;
	PkVrstaClanstva: number;
	AvatarPath?: string;
	PkUsera: number;
	PrivatnostPodataka: boolean;
}

/**
 *
 * @param {any} test against all possible falsy values (will still return false on "0" and "''")
 * @returns
 */
export function exists(x) {
	if (x == '[object Object]') return false;
	if (['null', 'undefined'].includes(x)) return false;
	return !!x;
}

export interface StupanjObrazovanjaIliZanimanje {
	Opis: string;
	OsobniPodaciVrstaNaziv: string;
	PeriodDo: Date;
	PeriodOd: Date;
	PkOsobniPodaciObrazovanjeRadnoIskustvo: number;
	PkOsobniPodaciVrsta: number;
	StupanjObrazovanjaIliZanimanje: string;
	UstanovaIMjesto: string;
}

export interface KompetencijaIliNapredovanje {
	KompetencijaIliNapredovanje: string;
	Opis: string;
	OsobniPodaciVrstaNaziv: string;
	PkOsobniPodaciKompetencijaNapredovanje: number;
	PkOsobniPodaciVrsta: number;
}

export interface ProfileVrsta {
	OsobniPodaciVrstaNaziv: string;
	PkOsobniPodaciVrsta: number;
}

export function setYearNavigatorRange(range = 100) {
	const year = new Date().getFullYear();
	const hundred = Math.round(year / 100) * 100;
	return `${hundred - range}:${hundred + range}`;
}

export type CRUD = 'insert' | 'edit' | 'delete' | 'read';

export interface VrstaClanstva {
	PkVrstaClanstva: number;
	VrstaClanstvaNaziv: string;
	BrojClanova?: number;
}

export interface Prilog {
	DatumUnosa: string;
	DatumZadnjePromjene: string;
	Naziv: string;
	Opis: string;
	PkDatoteka: number;
	destination: string;
	encoding: string;
	filename: string;
	mimetype: string;
	originalname: string;
	path: string;
	size: number;
	src?: string | SafeUrl;
}
export interface AppPrilog {
	PkOsobniPodaciPkUsera: string | number;
	coverImage: Prilog;
	datoteka: Prilog;
	prilogDummyPk?: number;
	imageSrc?: string;
}
export interface UploadedFile {
	CoverImage: File;
	file: File;
	PkObjava: number;
	PkResursObjava: number;
}
export interface AnketaPredlozak {
	PkPredlozak: number;
	PredlozakNaziv: string;
	PredlozakNaslov: string;
	PredlozakOpis: string;
	IzbrisanDaNe: number;
	UredivanjeDaNe: number;
	ProglasenoAnketomDaNe: number;
	PkUserUnos?: any;
	UserUnos?: any;
	DatumUnos?: any;
	PkUserPromjena?: any;
	UserPromjena?: any;
	DatumZadnjePromjene?: any;
	RowVersion: string;
	TotalRecords: number;
	pitanjaLength?: number;
	BrojKorisnikaKojiSuPristupiliAnketi?: number;
	AnketaNaziv?:string;
}

export enum EAnketeLinks {
	PREDLOSCI = '/surveys',
	PREDLOSCI_QUERY = 'ptab',
	ANKETE = '/surveys',
	ANKETE_QUERY = 'atab',
}
export enum EAnektaTipPitanja {
	JEDNOSTRUKI_ODABIR = 1,
	VISESTRUKI_ODABIR = 2,
	PADAJUCI_IZBORNIK = 3,
	TEKSTUALNI_ODGOVOR = 4,
}

export interface Pretplata {
	PkPretplate: number,
	PkUsera: number,
	Modul: string,
	Pk: number,
	DatumZadnjeProvjere: string | Date,
	Segment: string,
	data?: any
}

export interface clanoviDataForExcel {
	OIB: string,
	ImeUsera: string,
	PrezimeUsera: string,
	JMBAG: string,
	VrstaClanstvaNaziv: string,
	DatumRodenja: string | Date,
	Spol: string,
	Email: string,
	Mobitel: string,
	Grad: string,
	Adresa: string,
	NazivDrzave: string,
	PrivatnostPodataka: boolean
}

export interface UserClaims {
	Forum: {
		Kategorija: boolean,
		Objava: boolean,
		Komentar: boolean
	},
	eBiblioteka: {
		Kategorija: boolean,
		Datoteka: boolean,
		Komentar: boolean
	},
	Ankete: {
		Predlozak: boolean,
		Anketa: boolean
	},
	Obavijesti: {
		Dodavanje: boolean
	}
}
export interface AdministracijaUser {
	PkUsera: number,
	PrezimeUsera: string,
	ImeUsera: string,
	LoginName: string,
	UserAktivanDaNe: boolean | number,
	Claims: string | UserClaims,
	PkVrstaClanstva: number,
	VrstaClanstvaNaziv: string,
	PkApplicationUserGroup: number,
	AdministratorDaNe?: boolean,
	NazivGrupe: string,
	RowVersion: string,
	Blokiran?: boolean,
	StatusKorisnika: number
}

export interface LogAdministracijaUser {
	Akcija: string,
	DatumVrijemePristupio: string,
	ImePrezimeUsera: string,
	ImePrezimeUseraPristupio: string,
	PkLogOsobniPodaci: boolean | number,
	PkUsera: string,
	PkUseraPristupio: number,
	Podaci: string
}


export function extractTotalRecords(data: any[]): number {
	if (!data?.length) return 0;
	const [first] = data;
	const { TotalRecords } = first;
	return TotalRecords;
}


