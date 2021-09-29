import { AppPrilog, Prilog, UploadedFile } from "./types";

export interface ResursKategorija {
	PkResursKategorija: number;
	Naziv: string;
	Opis: string;
	PkUserUnos: number;
	DatumUnosa: string | Date;
	UserUnos: string;
	PkUserZadnjePromjene: number;
	DatumZadnjePromjene: string | Date;
	UserZadnjePromjene: string;
	RowVersion: string;
	ParentPk: number;
	PublicDaNe: number;
	subCat?: ResursKategorija[];
	PotkategorijeCount?: number;
	ObjaveCount?: number;
	TotalRecords?:number;
}

export interface ResursObjava {
	PkResursObjava: number;
	Naslov: string;
	Sadrzaj: string;
	PkUseraUnos: number;
	UserUnos: string;
	DatumUnosa: string | Date;
	DatumZadnjePromjene: string | Date;
	PkResursKategorija: number;
	komentariCount?: number;
	zadnjiKomentar?: string;
	zadnjiKomentarDatum?: string | Date;
	nazivKategorije?: string;
	TotalRecords?: number;
	prilozi?: (AppPrilog & UploadedFile)[];
	coverImage?: any[];
	datoteka?: any[];
	PkOsobniPodaciPkUsera?: number;
	IzbrisanDaNe: boolean | number;
}

export interface ResursKomentar {
	PkResursKomentar: number;
	Sadrzaj: string;
	DatumZadnjePromjene: string | Date;
	DatumUnosa: string | Date;
	PkUseraUnos: number;
	UserUnos: string;
	PkResursObjava: number;
	ParentPk: number;
	Dubina: number;
	children?: ResursKomentar[];
	prilozi?: AppPrilog[];
	coverImage?: any[];
	datoteka?: any[];
	PkOsobniPodaciPkUsera?: number;
	groupId?: string;
	IzbrisanDaNe: number | boolean;
}
