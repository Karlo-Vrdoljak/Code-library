import { AppPrilog, Prilog } from "./types";

export interface Kategorija {
	PkKategorija: number;
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
	subCat?: Kategorija[];
	PotkategorijeCount?: number;
	ObjaveCount?: number;
	TotalRecords?:number;
}

export interface Objava {
	PkObjava: number;
	Naslov: string;
	Sadrzaj: string;
	PkUseraUnos: number;
	UserUnos: string;
	DatumUnosa: string | Date;
	DatumZadnjePromjene: string | Date;
	PkKategorija: number;
	komentariCount?: number;
	zadnjiKomentar?: string;
	zadnjiKomentarDatum?: string | Date;
	nazivKategorije?: string;
	TotalRecords?: number;
	prilozi?: AppPrilog[];
}

export interface Komentar {
	PkKomentar: number;
	Sadrzaj: string;
	DatumZadnjePromjene: string | Date;
	DatumUnosa: string | Date;
	PkUseraUnos: number;
	UserUnos: string;
	PkObjava: number;
	ParentPk: number;
	Dubina: number;
	children?: Komentar[];
	prilozi?: AppPrilog[];
	coverImage?: any[];
	datoteka?: any[];
	PkOsobniPodaciPkUsera?: number;
	groupId?: string;
	IzbrisanDaNe: boolean | number;
}
