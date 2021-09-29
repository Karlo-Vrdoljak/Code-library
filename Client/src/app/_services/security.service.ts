import { EInteractionReducer, ELocalStorage } from './../_interfaces/types';
import { AppGroup } from 'src/app/_interfaces/appGroups';
import { environment } from './../../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, retry } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { GlobalVar } from '../globalVar';
@Injectable({
	providedIn: 'root',
})
export class SecurityService {
	SECURITY = 'security/';
	constructor(public router: Router, public translate: TranslateService, private http: HttpClient, private appService: AppService, public globalVar: GlobalVar) { }

	getAppUsers(): Observable<any> {
		return this.http.get(environment.API_URL + this.SECURITY + 'appUsers').pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.getAppUsers')));
	}

	getAppGroups(): Observable<any> {
		return this.http.get(environment.API_URL + this.SECURITY + 'appGroups').pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.getAppGroups')));
	}
	getUserGroup(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.SECURITY + 'userGroup', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.getUserGroup')));
	}
	getGroupUsers(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.SECURITY + 'groupUsers', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.getGroupUsers')));
	}

	setUserInAppGroup(data: any) {
		return this.http.post(environment.API_URL + this.SECURITY + 'appGroupSetUser', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.setUserInAppGroup')));
	}

	getUserPrava(data: any): Observable<any> {
		return this.http.get(environment.API_URL + this.SECURITY + 'userPravaApp', { params: data }).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.getUserPrava')));
	}

	appUserInsert(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'appUserInsert', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.appUserInsert')));
	}
	appUserUpdate(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'appUserUpdate', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.appUserUpdate')));
	}
	appUserAktivanUpdate(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'appUserAktivanUpdate', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.appUserAktivanUpdate')));
	}
	adminChangePasswordForUser(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'adminChangePasswordForUser', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.adminChangePasswordForUser')));
	}
	userLogin(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'login', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.login')));
	}
	ldapUpsert(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'ldapLogin', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.login')));
	}
	changePassword(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'changePassword', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.changePassword')));
	}
	checkUsername(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'usernameExists', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.checkUsername')));
	}
	resendConfirmEmail(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'resendConfirmEmail', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.resendConfirmEmail')));
	}
	sendPassChangeEmail(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'sendPassChangeEmail', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.sendPassChangeEmail')));
	}
	resetForgottenPassword(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'resetForgottenPassword', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.resetForgottenPassword')));
	}
	verifyAccount(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'verifyAccount', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.verifyAccount')));
	}
	findUserByUsername(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'findUserByUsername', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.findUserByUsername')));
	}

	verifyCaptcha(data: any): Observable<any> {
		return this.http.post(environment.API_URL + this.SECURITY + 'verifyCaptcha', data).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.verifyCaptcha')));
	}
	syncEduplan({ osobniPodaci, OIB, PkUsera }) {
		const req = { osobniPodaci, OIB, PkUsera };
		return this.http.put(environment.API_URL + this.SECURITY + 'syncEduplan', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.syncEduplan')));
	}
	refreshJWT() {
		const token = this.fetchJWTInLocal();
		const req = { ...(token && { token }) };

		return this.http.put(environment.API_URL + this.SECURITY + 'refreshJWT', req).pipe(retry(environment.APIRetryCount), catchError(this.appService.handleError('SecurityService.syncEduplan')));
	}

	parseJwt(token) {
		if (!token) return {};
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join('')
		);

		return JSON.parse(jsonPayload);
	}
	fetchUserDataInLocal() {
		const { payload: user } = this.parseJwt(localStorage.getItem(ELocalStorage.JWT));
		return user?.PkUsera ? user : null;
	}
	fetchJWTInLocal() {
		return localStorage.getItem(ELocalStorage.JWT);
	}

	logoff(redirect?: string) {
		localStorage.removeItem('alumniToken');
		this.globalVar.korisnikPkUsera = null;
		this.globalVar.korisnikIme = null;
		this.globalVar.korisnikGrupe = null;
		this.globalVar.korisnikPrava = null;
		this.globalVar.user = null;
		const aaiJwt = localStorage.getItem(ELocalStorage.AAI_JWT);

		this.appService.nextInteraction({ id: EInteractionReducer.logoff });
		// if (aaiJwt) {
		// 	localStorage.removeItem(ELocalStorage.AAI_JWT);
		// 	const ref = window.open(environment.aai.logoutUrl, '_blank');
		// 	setTimeout(() => {
		// 		ref.close();
		// 	}, ONE_SECOND * 5);
		// }
		if (redirect) {
			this.router.navigate([redirect]);
		} else {
			this.router.navigate(['/login']);
		}
	}
	checkForView(route: ActivatedRouteSnapshot): boolean {
		if (this.globalVar.isAdmin == 1) return true;
		let found = false;
		if (this.globalVar.korisnikPrava.length) {
			found = this.globalVar.korisnikPrava.find((kp) => route.routeConfig.path.toString().includes(kp.url) && kp.PkEvent == 1) ? true : false;
		}
		return found;
	}
	// Provjera prava za određenu komponentu i određeni event
	hasComponentRight(pkKomponenta: any, pkEvent: any): boolean {
		// Varijabla kojom se definira da li korisnik ima pravo na tu komponentu i event
		let pravo = false;

		if (this.globalVar.isAdmin == 1) return true;

		if (this.globalVar.korisnikGrupe.find((kg) => kg.PkApplicationUserGroup == AppGroup.ADMINISTRATOR) || this.globalVar.devMode == true) {
			return true;
		}

		// Ako ima pravo na komponentu vraća true
		this.globalVar.korisnikPrava.forEach((element) => {
			if (element.PkApplicationComponent && element.PkApplicationComponent == pkKomponenta && element.PkEvent && element.PkEvent == pkEvent) {
				pravo = true;
			}
		});

		// Ako nije admin i nema pravo na komponentu vraća false
		return pravo;
	}

	warnNoRight() {
		this.appService.prikaziToast('error', this.translate.instant('NO_RIGHTS'), null, this.globalVar.trajanjeErrAlert, 'globalToast', null);
	}
	async handleJWT(jwt, useCleanup, redirect = true) {
		const { payload: user } = this.parseJwt(jwt.token);

		try {
			localStorage.setItem(ELocalStorage.JWT, jwt.token);

			const userGroups = (await this.getUserGroup({ PkUsera: user.PkUsera }).toPromise()) as any[];
			const userPrava = (await this.getUserPrava({ PkUsera: user.PkUsera }).toPromise()) as any[];

			this.globalVar.korisnikGrupe = userGroups;
			this.globalVar.korisnikPrava = userPrava;
			this.globalVar.korisnikPkUsera = user.PkUsera;
			this.globalVar.korisnikIme = user.ImePrezimeUsera;
			this.globalVar.isAdmin = user.IsAdmin;
			this.globalVar.user = user;

			useCleanup.done();
			useCleanup.isLoading = false;
			this.appService.nextInteraction({ id: EInteractionReducer.loggedIn });
			// this.router.navigate(['my-profile', user.PkUsera]);
			redirect && this.router.navigate(['resources']);
		} catch (error) {
			localStorage.removeItem(ELocalStorage.JWT);
			useCleanup.err(error);
			useCleanup.isLoading = false;

		}
	}

	hasRights(modul: string, claim: string): boolean {
		const user = this.fetchUserDataInLocal();
			
		if (user && user.Claims) {
			const claims = JSON.parse(user.Claims);
			return claims[modul][claim];
		} else {
			return false;
		}
	}
}
