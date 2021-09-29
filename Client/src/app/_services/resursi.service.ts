import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResursKategorija, ResursKomentar, ResursObjava } from '../_interfaces/resursi';
import { AppPrilog, BreadCrumb, exists } from '../_interfaces/types';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { catchError, map, retry } from 'rxjs/operators';
import { AppService } from './app.service';
import { ProfileService } from './profile.service';

@Injectable({
	providedIn: 'root'
})
export class ResursiService {
	readonly resursBaseRoute: string = environment.API_URL + 'resursi/';

	constructor(private http: HttpClient, private appService: AppService, private profileService: ProfileService) { }

	mapAvatarPath(item) {
		if (item.AvatarPath) {
			item.AvatarPath = this.appService.PublicUrl + item.AvatarPath;
		}
		return item;
	}

	//#region GET DATA
	public getResursiKategorije(PkResursKategorije: number = null, query: string = null): Observable<ResursKategorija[]> {
		const params = {
			...(PkResursKategorije && { PkResursKategorija: PkResursKategorije }),
			...(query && { query }),
		};

		return this.http.get<ResursKategorija[]>(this.resursBaseRoute + 'ResursiKategorije', { params: params }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError<ResursKategorija[]>('ResursiService.getResursiKategorije')));
	}

	public getResursiPotKategorije({ PkResursKategorija, skip = null, take = null, query = null }): Observable<ResursKategorija[]> {
		return this.http.get<ResursKategorija[]>(this.resursBaseRoute + 'ResursiPotkategorije', { params: { PkResursKategorija, ...(skip == 0 ? { skip: 0 } : exists(skip) ? { skip } : {}), ...(take && { take }), ...(query && { query }) } }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError<ResursKategorija[]>('ResursiService.getResursiPotKategorije')));
	}

	public getResursiObjave({ query = null, skip = null as number, take = null as number, PkResursKategorije = null as number, PkResursObjave = null as number }): Observable<ResursObjava[]> {
		let queryParams: {} = null;
		if (PkResursKategorije && !PkResursObjave) {
			queryParams = { PkResursKategorija: PkResursKategorije };
		} else if (!PkResursKategorije && PkResursObjave) {
			queryParams = { PkResursObjava: PkResursObjave };
		} else {
			queryParams = {};
		}
		queryParams = {
			...queryParams,
			...(skip && { skip }),
			...(take && { take }),
			...(query && { query }),
		};

		return this.http.get<ResursObjava[]>(this.resursBaseRoute + 'ResursiObjave', { params: queryParams }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError<ResursObjava[]>('ResursiService.getResursiObjave')),
			map((objava) => objava.map((item) => this.mapAvatarPath(item)))
		);
	}
	public getResursiObjavaPrilozi(data: any): Observable<any> {
		return this.http.get(this.resursBaseRoute + 'ResursiObjavaPrilozi', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.getResursiObjavaPrilozi')));
	}

	public getResursiKomentari(PkObjave: number) {
		return this.http.get<ResursKomentar[]>(this.resursBaseRoute + 'ResursiKomentari', { params: { PkResursObjava: PkObjave } }).pipe(
			map((comments) => comments.map((comment) => this.wrapToPriloziArray(comment))),
			map((komentari: ResursKomentar[]) => {
				return new Promise(async (resolve) => {
					try {
						komentari = komentari.map((item) => this.mapAvatarPath(item));
						for (const komentar of komentari) {
							if (komentar.prilozi) {
								for (let prilog of komentar.prilozi) {
									prilog = await this.setCoverImageSrc(prilog);
								}
							}
						}
						resolve(this.CommentsflattArrayToTree(komentari));
					} catch (err) {
						resolve(komentari);
					}
				});
			}),
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError<ResursKomentar[]>('ResursiService.getResursiKomentari'))
		);
	}

	public getResursiKomentar(PkResursKomentar: number, PkResursObjava: number) {
		return this.http.get<ResursKomentar[]>(this.resursBaseRoute + 'ResursiKomentar', { params: { PkResursKomentar: PkResursKomentar, PkResursObjava: PkResursObjava } }).pipe(
			map((comments) => comments.map((comment) => this.wrapToPriloziArray(comment))),
			map((komentari: ResursKomentar[]) => {
				return new Promise(async (resolve) => {
					try {
						komentari = komentari.map((item) => this.mapAvatarPath(item));
						for (const komentar of komentari) {
							komentar.children = [];

							if (komentar.prilozi) {
								for (let prilog of komentar.prilozi) {
									prilog = await this.setCoverImageSrc(prilog);
								}
							}
						}
						resolve(komentari);
					} catch (err) {
						resolve(komentari);
					}
				});
			}),
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError<ResursKomentar[]>('ResursiService.getResursiKomentar'))
		);
	}

	public getKomentarBezPriloga(PkKomentar: number, PkObjava: number) {
		return this.http.get<ResursKomentar[]>(this.resursBaseRoute + 'ResursiKomentar', { params: { PkResursKomentar: PkKomentar, PkObjava: PkObjava } }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError<ResursKomentar[]>('ResursiService.getKomentarBezPriloga'))
		);
	}
	//#endregion

	//#region INSERT DATA
	postResursiKategorija(data: any): Observable<any> {
		return this.http.post(this.resursBaseRoute + 'ResursiKategorija', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.postResursiKategorija')));
	}

	postResursiObjava(params: any): Observable<any> {
		return this.http.post(this.resursBaseRoute + 'ResursiAttachment/objava', this.appService.toFormData(params)).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.postResursiObjava')));
	}
	
	postResursiAttachment(params: any): Observable<any> {
		return this.http
			.post(this.resursBaseRoute + 'ResursiAttachment', this.appService.toFormData(params), {
				// headers: { 'content-type': 'multipart/form-data' },
			})
			.pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.postResursiAttachment')));
	}
	
	postResursiComment(params: any): Observable<any> {
		return this.http.post(this.resursBaseRoute + 'ResursiAttachment/comment', this.appService.toFormData(params)).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.postResursiComment')));
	}
	//#endregion

	//#region UPDATE DATA
	updateResursiKategorija(data: any): Observable<any> {
		return this.http.put(this.resursBaseRoute + 'ResursiKategorija', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.updateResursiKategorija')));
	}

	updateResursiPost(data: any): Observable<any> {
		return this.http.put(this.resursBaseRoute + 'ResursiObjava', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.updateResursiPost')));
	}

	updateComment(data: any): Observable<any> {
		return this.http.put(this.resursBaseRoute + 'ResursiKomentar', data)
			.pipe(retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ResursiService.updateComment')));
	}
	//#endregion

	//#region DELETE DATA
	deleteResursiKategorija(PkResursKategorija: number) {
		return this.http.delete(this.resursBaseRoute + 'ResursiKategorija', { params: { PkResursKategorija } }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.deleteResursiKategorija')));
	}

	deleteResursiPost(PkPosta: number) {
		return this.http.delete(this.resursBaseRoute + 'ResursiObjava', { params: { PkResursObjava: PkPosta } }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ResursiService.deleteResursiPost')));
	}

	deleteComment(PkKomentar: number) {
		return this.http.delete(this.resursBaseRoute + 'ResursiKomentar', { params: { PkKomentar: PkKomentar } })
			.pipe(
				retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ResursiService.deleteComment')));
	}

	//#endregion
	
	public filterBreadCrumb(bc: BreadCrumb[], filterQuery: string): { filtered: boolean; breadcrumb: BreadCrumb[] } {
		const elementIndex: number = bc.findIndex((el) => el.query && (el.query[0] as string).toUpperCase() === filterQuery.toUpperCase());
		if (elementIndex !== -1) {
			bc.splice(elementIndex + 1);
			return { filtered: true, breadcrumb: bc };
		} else {
			return { filtered: false, breadcrumb: bc };
		}
	}

	private CommentsflattArrayToTree(comments: ResursKomentar[]) {
		var map = {},
			node,
			roots = [],
			i;

		for (i = 0; i < comments.length; i += 1) {
			map[comments[i].PkResursKomentar] = i;
			comments[i].children = [];
		}

		for (i = 0; i < comments.length; i += 1) {
			node = comments[i];
			if (node.ParentPk) {
				comments[map[node.ParentPk]].children.push(node);
			} else {
				roots.push(node);
			}
		}
		return roots;
	}

	private wrapToPriloziArray(comment: ResursKomentar): ResursKomentar {
		const prilozi: AppPrilog[] = [];
		const brojPriloga: number = comment.datoteka.length;
		//Ukoliko ne postoje prilozi, rezultat coverImage-a i datoteka je niz s jednim clanom, gdje su svi properties null
		//Stoga prvo provjeravamo da li postoji PkDatoteka za prvi clan niza, jer ukoliko nije to znac ida nema priloga.
		if (comment.datoteka[0].PkDatoteka) {
			//Velicina niza coverImage-a i datoteka je uvijek ista
			for (let i = 0; i < brojPriloga; i++) {
				let prilog: AppPrilog = {
					PkOsobniPodaciPkUsera: comment.PkOsobniPodaciPkUsera,
					coverImage: comment.coverImage[i],
					datoteka: comment.datoteka[i],
				};

				prilozi.push(prilog);
			}
			//Postavljamo priloge
			comment.prilozi = prilozi;
		}

		//Brisemo propove jer su sada wrapani u prilozi array i redudantni su
		delete comment.coverImage;
		delete comment.datoteka;
		delete comment.groupId;
		return comment;
	}

	async setCoverImageSrc(pr: AppPrilog) {
		try {
			pr.coverImage.src = await this.profileService.getFileDomSafe(pr.coverImage.path).toPromise();
			return pr;
		} catch (err) {
			pr.coverImage.src = null;
			return pr;
		}
	}
}
