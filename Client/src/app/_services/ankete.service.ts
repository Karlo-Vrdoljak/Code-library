import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, map, retry } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { GlobalVar } from '../globalVar';
import { AnketaPredlozak } from '../_interfaces/types';
import { environment } from './../../environments/environment';
import { SecurityService } from './security.service';

@Injectable({
	providedIn: 'root',
})
export class AnketeService {
	ANKETE = 'ankete/';
	constructor(public securityService: SecurityService, public translate: TranslateService, private http: HttpClient, private appService: AppService, public globalVar: GlobalVar) {}

	getPredlosci({ PkPredlozak = null, skip = 0, take = environment.PAGINATION_ANKETE, PkUsera = null }): Observable<any> {
		const req = {
			PkPredlozak,
			skip,
			take,
			PkUsera,
		};
		return this.http.get(environment.API_URL + this.ANKETE + 'predlosci', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}

	getAnkete({ PkAnketa = null, skip = 0, take = null, PkUsera = null, IsPublic = 0 }): Observable<any> {
		if (!take) {
			take = IsPublic ? environment.PAGINATION_ANKETE_PUBLIC : environment.PAGINATION_ANKETE;
		}
		const req = {
			PkAnketa,
			skip,
			take,
			PkUsera,
			IsPublic,
		};
		return this.http.get(environment.API_URL + this.ANKETE + 'ankete', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}

	getPredlozakTemplating({ PkPredlozak }): Observable<any> {
		const req = {
			...(PkPredlozak && { PkPredlozak }),
		};
		return this.http.get(environment.API_URL + this.ANKETE + 'predlozak/templating', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	upsertPredlozak({ predlozak }): Observable<any> {
		const req = {
			predlozak,
		};
		return this.http.post(environment.API_URL + this.ANKETE + 'predlozak/templating', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	reorderQuestion({ swap, current, target, PkPredlozak }) {
		const req = { swap, current, target, PkPredlozak };
		return this.http.put(environment.API_URL + this.ANKETE + 'predlozak/templating/question/reorder', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	updateQuestionAndReplaceAnswers({ pitanje, odgovori, PkPredlozak }): Observable<any> {
		const req = { pitanje, odgovori, PkPredlozak };
		return this.http.put(environment.API_URL + this.ANKETE + 'predlozak/templating/question/replace', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	deleteQuestion({ PkPitanje, PkPredlozak }) {
		const req = { PkPitanje, PkPredlozak };
		return this.http.delete(environment.API_URL + this.ANKETE + 'predlozak/templating/question/delete', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}

	deletePredlozakSoft({ PkPredlozak }) {
		const req = { PkPredlozak };
		return this.http.delete(environment.API_URL + this.ANKETE + 'predlozak/delete', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	proglasiAnketom({ PkPredlozak, AnketaAnonimnaDaNe, AnketaOtvorenaDo, AnketaOtvorenaOd, Clanstva, AnketaNaziv }) {
		const req = { PkPredlozak, AnketaAnonimnaDaNe, AnketaOtvorenaDo, AnketaOtvorenaOd, Clanstva, AnketaNaziv };
		return this.http.put(environment.API_URL + this.ANKETE + 'predlozak/proglasiAnketom', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	submitAnketa({ anketa, pitanja, PkAnketa, PkPredlozak }) {
		const req = { anketa, pitanja, PkAnketa, PkPredlozak };
		return this.http.post(environment.API_URL + this.ANKETE + 'anketa/solved', req).pipe(catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	checkIfUserAlreadySolvedOrNotEligible({ PkAnketa }) {
		const req = { PkAnketa };
		return this.http.get(environment.API_URL + this.ANKETE + 'anketa/solved/check', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	getStatistika({ PkAnketa = null, PkPredlozak = null }) {
		const req = {
			...(PkAnketa && { PkAnketa }),
			...(PkPredlozak && { PkPredlozak }),
		};
		return this.http.get(environment.API_URL + this.ANKETE + 'anketa/statistika', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	deleteAnketa({ PkAnketa }) {
		const req = { PkAnketa };
		return this.http.delete(environment.API_URL + this.ANKETE + 'anketa/delete', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	copyPredlozak({ predlozak }: { predlozak: AnketaPredlozak }) {
		const req = { predlozak };
		return this.http.post(environment.API_URL + this.ANKETE + 'predlozak/copy', req).pipe(catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
	manageAnketa({ PkAnketa, IsActive, AnketaOtvorenaOd, AnketaOtvorenaDo }) {
		const req = { PkAnketa, IsActive, AnketaOtvorenaOd, AnketaOtvorenaDo };
		return this.http.put(environment.API_URL + this.ANKETE + 'anketa/manage', req).pipe(catchError(this.appService.handleError('AnketeService.getAnkete')));
	}
}
