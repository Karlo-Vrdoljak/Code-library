import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, map, retry } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { GlobalVar } from '../globalVar';
import { environment } from './../../environments/environment';
import { SecurityService } from './security.service';

@Injectable({
	providedIn: 'root',
})
export class ObavijestiService {
	OBAVIESTI = 'obavijesti/';
	constructor(public securityService: SecurityService, public translate: TranslateService, private http: HttpClient, private appService: AppService, public globalVar: GlobalVar) { }

	mapObavijestiCoverImagePath(data) {
		return data.map((d) => {
			if (d.ObavijestCoverImagePath) {
				d.ObavijestCoverImagePath = this.appService.PublicUrl + d.ObavijestCoverImagePath;
			} else {
				d.ObavijestCoverImagePath = this.appService.defaultImage;
			}
			if (d.CoverImagePath) {
				d.CoverImagePath = this.appService.PublicUrl + d.CoverImagePath;
			} else {
				d.CoverImagePath = this.appService.defaultImage;
			}
			return d;
		});
	}

	private filterObavijesti(obavijesti: any[]) {
		// removed cuz server side paginate
		return obavijesti;
	}

	getObavijest(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.OBAVIESTI + 'obavijest', { params: data }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError('ObavijestiService.getObavijestiKategorija')),
			map((data: any[]) => (data?.length ? this.mapObavijestiCoverImagePath(data)[0] : null))
		); //expect only one item
	}
	getObavijestCategoryGroup(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.OBAVIESTI + 'obavijestCategoryGroup', { params: data }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError('ObavijestiService.getObavijestiKategorija')),
			map((data: any) => {
				data = this.mapObavijestiCoverImagePath(data);
				return this.appService.groupDataByKeySync(data, 'NazivKategorije');
			})
		);
	}
	getObavijestForCategory(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.OBAVIESTI + 'obavijestForCategory', { params: data }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError('ObavijestiService.getObavijestiKategorija')),
			map((data: any) => {
				data = this.mapObavijestiCoverImagePath(this.filterObavijesti(data));
				return this.appService.groupDataByKeySync(data, 'NazivKategorije');
			})
		);
	}
	findObavijestForCategoryFTS(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.OBAVIESTI + 'obavijestForCategoryFTS', { params: data }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError('ObavijestiService.findObavijestForCategoryFTS')),
			map((data: any) => {
				data = this.mapObavijestiCoverImagePath(this.filterObavijesti(data));
				return this.appService.groupDataByKeySync(data, 'NazivKategorije');
			})
		);
	}
	postObavijest(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.OBAVIESTI + 'obavijest', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.postObavijest')));
	}
	putObavijest(data: any): Observable<any> {
		return this.http.put(environment.API_URL + this.OBAVIESTI + 'obavijest', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.putObavijestiKategorija')));
	}
	deleteObavijest(data: any): Observable<any> {
		return this.http.delete(environment.API_URL + this.OBAVIESTI + 'obavijest', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.deleteObavijestiKategorija')));
	}
	getObavijestiKategorija(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.OBAVIESTI + 'obavijestiKategorija', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.getObavijestiKategorija')));
	}
	getObavijestiKategorijaAll(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.OBAVIESTI + 'obavijestiKategorijaAll', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.getObavijestiKategorija')));
	}
	postObavijestiKategorija(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.OBAVIESTI + 'obavijestiKategorija', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.postObavijestiKategorija')));
	}
	putObavijestiKategorija(data: any): Observable<any> {
		return this.http.put(environment.API_URL + this.OBAVIESTI + 'obavijestiKategorija', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.putObavijestiKategorija')));
	}
	putChangeObavijestStatus(data: any): Observable<any> {
		return this.http.put(environment.API_URL + this.OBAVIESTI + 'obavijestStatus', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.putChangeObavijestStatus')));
	}
	deleteObavijestiKategorija(data: any): Observable<any> {
		return this.http.delete(environment.API_URL + this.OBAVIESTI + 'obavijestiKategorija', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ObavijestiService.deleteObavijestiKategorija')));
	}
	uploadCoverPhoto(params: any): Observable<any> {
		return this.http
			.post(environment.API_URL + this.OBAVIESTI + 'uploadCoverImage', this.appService.toFormData(params), {
				// headers: { 'content-type': 'multipart/form-data' },
			})
			.pipe(
				retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ObavijestiService.uploadCoverPhoto')),
				map((event) => {
					return event;
				})
			);
	}

	postVidljivostObavijestiVrstaClanstva(params: any): Observable<any> {
		return this.http.post(environment.API_URL + this.OBAVIESTI + 'vidljivostObavijestiVrstaClanstva', params)
			.pipe(
				retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ObavijestiService.postVidljivostObavijestiVrstaClanstva'))
			);

	}

	sendObavijestLinkMail(params: any) {
		return this.http.post(environment.API_URL + this.OBAVIESTI + 'sendObavijestLinkMail', params)
			.pipe(
				retry(environment.APIRetryCount),
				catchError(this.appService.handleError('ObavijestiService.sendObavijestLinkMail'))
			);
	}
}
