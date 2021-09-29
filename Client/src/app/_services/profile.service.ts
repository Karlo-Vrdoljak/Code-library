import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, map, retry } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { GlobalVar } from '../globalVar';
import { environment } from '../../environments/environment';
import { SecurityService } from './security.service';
import { DomSanitizer } from '@angular/platform-browser';
import { clanoviDataForExcel, VrstaClanstva } from '../_interfaces/types';

@Injectable({
	providedIn: 'root',
})
export class ProfileService {
	PROFILE = 'profile/';
	constructor(public sanitizer: DomSanitizer, public securityService: SecurityService, public translate: TranslateService, private http: HttpClient, private appService: AppService, public globalVar: GlobalVar) { }

	mapProfilePicture(data: { osobniPodaci; profile }) {
		if (data.osobniPodaci?.AvatarPath) {
			data.osobniPodaci.AvatarPath = this.appService.PublicUrl + data.osobniPodaci.AvatarPath;
		} else {
			data.osobniPodaci.AvatarPath = null;
		}
		return data;
	}

	getProfileDataAll(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.PROFILE + 'profile', { params: data }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError('ProfileService.getProfileDataAll')),
			map((data: { osobniPodaci; profile }) => {
				data.osobniPodaci = data.osobniPodaci ?? {};
				data.profile = data.profile ?? {};
				return this.mapProfilePicture(data);
			})
		);
	}
	getOsobniPodaciVrste(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.PROFILE + 'osobniPodaciVrste', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.getOsobniPodaciVrste')));
	}
	getDrzave(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.PROFILE + 'getDrzave', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.getDrzave')));
	}
	upsertOsobniPodaci(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.PROFILE + 'upsertOsobniPodaci', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.upsertOsobniPodaci')));
	}
	postProfileVrsta(data): Observable<any> {
		return this.http.post(environment.API_URL + this.PROFILE + 'profileVrsta', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.postProfileVrsta')));
	}
	putProfileVrsta(data: any): Observable<any> {
		return this.http.put(environment.API_URL + this.PROFILE + 'profileVrsta', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.putProfileVrsta')));
	}
	getProfileVrsta(data): Observable<any> {
		return this.http.get(environment.API_URL + this.PROFILE + 'profileVrsta', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.getProfileVrsta')));
	}
	deleteProfileVrsta(data: any): Observable<any> {
		return this.http.delete(environment.API_URL + this.PROFILE + 'profileVrsta', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.deleteProfileVrsta')));
	}
	uploadCoverPhoto(params: any): Observable<any> {
		return this.http
			.post(environment.API_URL + this.PROFILE + 'uploadCoverImage', this.appService.toFormData(params), {
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
	postAttachment(params: any): Observable<any> {
		return this.http
			.post(environment.API_URL + this.PROFILE + 'attachment', this.appService.toFormData(params), {
				// headers: { 'content-type': 'multipart/form-data' },
			})
			.pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.postAttachment')));
	}
	getProfilePrilozi(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.PROFILE + 'attachments', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.getProfilePrilozi')));
	}
	getFileDomSafe(file: any) {
		return this.appService.getFile(environment.API_URL + this.PROFILE + 'uploadedFile', file).pipe(map(({ url }) => this.sanitizer.bypassSecurityTrustUrl(url)));
	}
	getFile(file: any) {
		return this.appService.getFile(environment.API_URL + this.PROFILE + 'uploadedFile', file);
	}
	deletePrilog(data: any): Observable<any> {
		return this.http.delete(environment.API_URL + this.PROFILE + 'deletePrilog', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.deletePrilog')));
	}
	editPrilog(data: any): Observable<any> {
		return this.http.put(environment.API_URL + this.PROFILE + 'editPrilog', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.editPrilog')));
	}

	getVrstaClanstva(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.PROFILE + 'vrstaClanstva', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.getVrstaClanstva')));
	}

	getVrstaClanstvaAll(): Observable<VrstaClanstva[]> {
		return this.http.get<VrstaClanstva[]>(environment.API_URL + this.PROFILE + 'vrstaClanstvaAll')
			.pipe(
				retry(environment.APIRetryCount),
				catchError(this.appService.handleError<VrstaClanstva[]>('ProfileService.getVrstaClanstvaAll')));
	}

	public getObavijestVidljivostVrstaClanstva(data: any) {
		return this.http.get(environment.API_URL + this.PROFILE + 'obavijestVidljivost', { params: data })
		.pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError('ProfileService.getObavijestVidljivostVrstaClanstva')));
	}

	getClanoviPoVrsti(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.PROFILE + 'clanoviVrsta', { params: data }).pipe(
			retry(environment.APIRetryCount),
			catchError(this.appService.handleError('ProfileService.getClanoviPoVrsti')),
			map((result: any[]) => {
				if (result?.length) {
					return result.map((r) => {
						if (r.osobniPodaci.AvatarPath) {
							r.osobniPodaci.AvatarPath = this.appService.PublicUrl + r.osobniPodaci.AvatarPath;
						} else {
							r.osobniPodaci.AvatarPath = null;
						}
						return r;
					});
				}
				return result;
			})
		);
	}

	getClanoviDataForExcelExport(): Observable<clanoviDataForExcel[]> {
		return this.http.get<clanoviDataForExcel[]>(environment.API_URL + this.PROFILE + 'clanoviDataForExcelExport').pipe(
			retry(environment.APIRetryCount),
			map((result: clanoviDataForExcel[]) => this.applyDataPrivacy(result)),
			catchError(this.appService.handleError<clanoviDataForExcel[]>('ProfileService.getClanoviDataForExcelExport'))
		);
	}

	private applyDataPrivacy(clanoviData: clanoviDataForExcel[]): clanoviDataForExcel[] {
		clanoviData.forEach(clan => {
			if (clan.PrivatnostPodataka) {
				clan = this.mutateClanDataForDataPrivacy(clan);
			}
		});

		return clanoviData;
	}

	private mutateClanDataForDataPrivacy(clan: clanoviDataForExcel): clanoviDataForExcel {
		const unaffectedFields: string[] = ['ImeUsera', 'PrezimeUsera', 'VrstaClanstvaNaziv', 'Spol', 'NazivDrzave', 'Grad', 'Email', 'PrivatnostPodataka'];

		Object.keys(clan).forEach(key => {
			if (!unaffectedFields.includes(key)) {
				if (clan[key]) clan[key] = '****';
			}
		});

		return clan;
	}

	postProfileLog(data): Observable<any> {
		return this.http.post(environment.API_URL + this.PROFILE + 'ProfileLog', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('ProfileService.ProfileLog')));
	}

}
