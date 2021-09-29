import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, retry } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { environment } from '../../environments/environment';
import { GlobalVar } from '../globalVar';

@Injectable({
	providedIn: 'root',
})
export class AaiAuthService {
	SECURITY = 'security/';

	constructor(public translate: TranslateService, private http: HttpClient, private appService: AppService, public globalVar: GlobalVar) {}

	fetchAaiLoginUrl({ issuer, recourse }): Observable<any> {
		const req = { issuer, recourse };
		return this.http.get(environment.AAI_PROVIDER_URL + 'link', { params: req }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('OauthService.fetchGoogleOauthUrl')));
	}
	fetchUserResource({ auth, issuer, recourse }): Observable<any> {
		const req = {
			auth,
			issuer,
			recourse,
		};
		return this.http.post(environment.AAI_PROVIDER_URL + 'fetchUserInfo', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('OauthService.fetchGoogleOauthUrl')));
	}
	registerOrLogin({ givenName, hrEduPersonUniqueID, sn, hrEduPersonOIB }) {
		// const OIB = '70522565531';

		const req = {
			givenName,
			hrEduPersonUniqueID,
			...(sn && { sn }),
			hrEduPersonOIB,
		};
		return this.http.post(environment.API_URL + this.SECURITY + 'aaiLogin', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('OauthService.fetchGoogleOauthUrl')));
	}
}
