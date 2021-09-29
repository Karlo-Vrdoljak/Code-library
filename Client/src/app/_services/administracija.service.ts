import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AdministracijaUser } from '../_interfaces/types';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class AdministracijaService {
  readonly administracijaBaseRoute: string = environment.API_URL + 'administracija/';

  constructor(
    private http: HttpClient,
    private appService: AppService) { }

  getUsers() {
    return this.http.get<AdministracijaUser[]>(this.administracijaBaseRoute + 'users').pipe(
      retry(environment.APIRetryCount),
      map(users => users.map(user => {
        user.AdministratorDaNe = user.PkApplicationUserGroup === environment.userApplicationGroupsPk.Admin ? true : false;
        user.Blokiran = user.StatusKorisnika === environment.StatusKorisnikaDef.Blokiran ? true : false;
        user.Claims = JSON.parse(user.Claims as string);
        return user;
      })),
      catchError(this.appService.handleError<AdministracijaUser[]>('AdministracijaService.getUsers'))
    );
  }

  updateUserClaims(params: any) {
    return this.http.put(this.administracijaBaseRoute + 'userClaims', params)
      .pipe(
        retry(environment.APIRetryCount),
        map((user: any[]) => {
          //Uvijek vracamo jedan clan tj onaj updateani
          user[0].Claims = JSON.parse(user[0].Claims);
          return user[0];
        }),
        catchError(this.appService.handleError('AdministracijaService.updateUserClaims'))
      );
  }

  updateUserStatus(params: any) {
    return this.http.put(this.administracijaBaseRoute + 'statusKorisnika', params)
    .pipe(
      retry(environment.APIRetryCount),
      map((user: any[]) => user[0]),
      catchError(this.appService.handleError('AdministracijaService.updateUserStatus'))
    );
  }

  updateUserApplicationGroup(params: any) {
    return this.http.put(this.administracijaBaseRoute + 'userApplicationGroup', params)
    .pipe(
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError('AdministracijaService.updateUserApplicationGroup'))
    );
  }

  updateUserVrstaClanstva(params: any) {
    return this.http.put(this.administracijaBaseRoute + 'userVrstaClanstva', params)
    .pipe(
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError('AdministracijaService.updateUserVrstaClanstva'))
    );
  }

	// getLogOsobniPodaci(params: any) {
  //   return this.http.get<AdministracijaUser[]>(this.administracijaBaseRoute + 'LogOsobniPodaci').pipe(
  //     retry(environment.APIRetryCount),
  //     catchError(this.appService.handleError<AdministracijaUser[]>('AdministracijaService.getLogOsobniPodaci'))
  //   );
  // }

  getLogOsobniPodaci(params: any) {
    return this.http.get(this.administracijaBaseRoute + 'LogOsobniPodaci', params)
      .pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('AdministracijaService.getLogOsobniPodaci')));
  }

}
