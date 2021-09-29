import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Kategorija, Komentar, Objava } from '../_interfaces/forum';
import { AppPrilog, BreadCrumb, exists } from '../_interfaces/types';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { catchError, map, retry } from 'rxjs/operators';
import { AppService } from './app.service';
import { ProfileService } from './profile.service';

@Injectable({
	providedIn: 'root',
})
export class ForumService {
	readonly forumBaseRoute: string = environment.API_URL + 'forum/';

	constructor(private http: HttpClient, private appService: AppService, private profileService: ProfileService) { }

	mapAvatarPath(item) {
		if (item.AvatarPath) {
			item.AvatarPath = this.appService.PublicUrl + item.AvatarPath;
		}
		return item;
	}

	//#region GET DATA
	public getKategorije(PkKategorije: number = null, query: string = null): Observable<Kategorija[]> {
		const params = {
			...(PkKategorije && { PkKategorija: PkKategorije }),
			...(query && { query }),
		};

		return this.http.get<Kategorija[]>(this.forumBaseRoute + 'kategorije', { params: params }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError<Kategorija[]>('ForumService.getKategorije')));
	}

	public getPotKategorije({ PkKategorija, skip = null, take = null, query = null }): Observable<Kategorija[]> {
		return this.http.get<Kategorija[]>(this.forumBaseRoute + 'potkategorije', { params: { PkKategorija, ...(skip == 0 ? { skip: 0 } : exists(skip) ? { skip } : {}), ...(take && { take }), ...(query && { query }) } }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError<Kategorija[]>('ForumService.getPotKategorije')));
	}

	public getObjave({ query = null, skip = null as number, take = null as number, PkKategorije = null as number, PkObjave = null as number }): Observable<Objava[]> {
		let queryParams: {} = null;
		if (PkKategorije && !PkObjave) {
			queryParams = { PkKategorija: PkKategorije };
		} else if (!PkKategorije && PkObjave) {
			queryParams = { PkObjava: PkObjave };
		} else {
			queryParams = {};
		}
		queryParams = {
			...queryParams,
			...(skip && { skip }),
			...(take && { take }),
			...(query && { query }),
		};

		return this.http.get<Objava[]>(this.forumBaseRoute + 'objave', { params: queryParams }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError<Objava[]>('ForumService.getObjave')),
			map((objava) => objava.map((item) => this.mapAvatarPath(item)))
		);
	}
	public getObjavaPrilozi(data: any): Observable<any> {
		return this.http.get(this.forumBaseRoute + 'objavaPrilozi', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.getObjavaPrilozi')));
	}

	public getKomentari(PkObjave: number) {
		return this.http.get<Komentar[]>(this.forumBaseRoute + 'komentari', { params: { PkObjava: PkObjave } }).pipe(
			map((comments) => comments.map((comment) => this.wrapToPriloziArray(comment))),
			map((komentari: Komentar[]) => {
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
			catchError(this.appService.handleError<Komentar[]>('ForumService.getKomentari'))
		);
	}

	public getKomentar(PkKomentar: number, PkObjava: number) {
		return this.http.get<Komentar[]>(this.forumBaseRoute + 'komentar', { params: { PkKomentar: PkKomentar, PkObjava: PkObjava } }).pipe(
			map((comments) => comments.map((comment) => this.wrapToPriloziArray(comment))),
			map((komentari: Komentar[]) => {
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
			catchError(this.appService.handleError<Komentar[]>('ForumService.getKomentar'))
		);
	}

	public getKomentarBezPriloga(PkKomentar: number, PkObjava: number) {
		return this.http.get<Komentar[]>(this.forumBaseRoute + 'komentar', { params: { PkKomentar: PkKomentar, PkObjava: PkObjava } }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError<Komentar[]>('ForumService.getKomentarBezPriloga'))
		);
	}
	//#endregion

	//#region INSERT DATA
	postKategorija(data: any): Observable<any> {
		return this.http.post(this.forumBaseRoute + 'kategorija', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.postKategorija')));
	}

	postObjava(data: any): Observable<any> {
		return this.http.post(this.forumBaseRoute + 'objava', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.postObjava')));
	}
	postAttachment(params: any): Observable<any> {
		return this.http
			.post(this.forumBaseRoute + 'attachment', this.appService.toFormData(params), {
			})
			.pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.postAttachment')));
	}
	postComment(params: any): Observable<any> {
		return this.http.post(this.forumBaseRoute + 'attachment/comment', this.appService.toFormData(params)).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.postComment')));
	}
	//#endregion

	//#region UPDATE DATA
	updateKategorija(data: any): Observable<any> {
		return this.http.put(this.forumBaseRoute + 'kategorija', data)
			.pipe(retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ForumService.updateKategorija')));
	}

	updatePost(data: any): Observable<any> {
		return this.http.put(this.forumBaseRoute + 'objava', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.updatePost')));
	}

	updateComment(data: any): Observable<any> {
		return this.http.put(this.forumBaseRoute + 'komentar', data)
			.pipe(retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ForumService.updateComment')));
	}
	//#endregion

	//#region DELETE DATA
	deleteKategorija(PkKategorija: number) {
		return this.http.delete(this.forumBaseRoute + 'kategorija', { params: { PkKategorija } }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.deleteKategorija')));
	}

	deletePost(PkPosta: number) {
		return this.http.delete(this.forumBaseRoute + 'objava', { params: { PkObjava: PkPosta } }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ForumService.deletePost')));
	}

	deleteComment(PkKomentar: number) {
		return this.http.delete(this.forumBaseRoute + 'komentar', { params: { PkKomentar: PkKomentar } })
			.pipe(
				retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ForumService.deleteComment')));

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

	private CommentsflattArrayToTree(comments: Komentar[]) {
		var map = {},
			node,
			roots = [],
			i;

		for (i = 0; i < comments.length; i += 1) {
			map[comments[i].PkKomentar] = i;
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

	private wrapToPriloziArray(comment: Komentar): Komentar {
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
