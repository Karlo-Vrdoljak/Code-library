import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Pretplata } from '../_interfaces/types';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class PretplateService {
  readonly pretplateBaseRoute: string = environment.API_URL + 'pretplata/';

  constructor(
    private http: HttpClient,
    private appService: AppService) { }

  //Funkcija vraca niz od jednog clana (pretplate) ukoliko postoji ili prazni niz ukoliko pretplata ne postoji
  public checkUserPretplata(params: { modul: string, segment: string, pk: number }): Observable<Pretplata[]> {
    return this.http.get<Pretplata[]>(this.pretplateBaseRoute + 'check', { params: params }).pipe(
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError<Pretplata[]>('PretplateService.checkUserPretplata'))
    );
  }

  //Vracamo novo insertiranu pretplatu u obliku niza s jednim clanom
  public userPretplataInsert(params: { modul: string, segment: string, pk: number }): Observable<Pretplata[]> {
    return this.http.post<Pretplata[]>(this.pretplateBaseRoute, params).pipe(
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError<Pretplata[]>('PretplateService.userPretplataInsert'))
    );
  }

  public userPretplataDelete(params: { PkPretplate: number }): Observable<any> {
    return this.http.delete<any>(this.pretplateBaseRoute, { params: params }).pipe(
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError<any>('PretplateService.userPretplataDelete'))
    );
  }

  public getUserPretplate(): Observable<Pretplata[]> {
    return this.http.get<Pretplata[]>(this.pretplateBaseRoute).pipe(
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError<Pretplata[]>('PretplateService.getUserPretplate'))
    );
  }

  //Funkcija vraca sve podatke o entitetu na kojeg je korisnik pretplace, npr. ako je korisnik pretplacen na kategoriju unutar foruma
  //biti ce mu vracene informacije o toj kategoriju zajedno s countom koliko novih postova ima 
  public getPretplateData(params: {Pk: number, DatumZadnjeProvjere: string, Modul: string, Segment: string}): Observable<any> {
    return this.http.get<any[]>(this.pretplateBaseRoute + 'pretplataData', {params: params}).pipe(
      map(data => data[0]),
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError<any[]>('PretplateService.getPretplateData'))
    );
  }

  public updateDatumZadnjeProvjere(params: {PkPretplate: number}): Observable<any> {
    return this.http.put<any>(this.pretplateBaseRoute + 'datumZadnjeProvjere', params).pipe(
      retry(environment.APIRetryCount),
      catchError(this.appService.handleError<any>('PretplateService.updateDatumZadnjeProvjere'))
    );
  }
}
