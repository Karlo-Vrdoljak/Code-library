import { AppGroup } from 'src/app/_interfaces/appGroups';
import { environment } from './../../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, retry } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { GlobalVar } from '../globalVar';

@Injectable({
  providedIn: 'root',
})
export class OauthService {
  private GOOGLE = 'google/';
  constructor(public translate: TranslateService, private http: HttpClient, private appService: AppService, public globalVar: GlobalVar) { }

  fetchGoogleOauthUrl(): Observable<any> {
    return this.http.get(environment.API_URL + this.GOOGLE + 'oauth').pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('OauthService.fetchGoogleOauthUrl')));
  }
  fetchGoogleUser(data: any): Observable<any> {
    return this.http.get(environment.API_URL + this.GOOGLE + 'oauth/complete', {params: data}).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('OauthService.fetchGoogleUser')));
  }
}