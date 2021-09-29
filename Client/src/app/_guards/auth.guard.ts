import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SecurityService } from './../_services/security.service';

@Injectable({
	providedIn: 'root',
})
export class AuthGuard implements CanActivate {
	constructor(public router: Router, public security: SecurityService) {}
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		const { requiredClaims } = route.data;

		const user = this.security.fetchUserDataInLocal();

		if (user) {
			if (requiredClaims) {
				const uclaims = JSON.parse(user.Claims);
				for (const key of Object.keys(requiredClaims)) {
					for (const reqClaim of requiredClaims[key]) {
						if (!uclaims[key][reqClaim]) {
							return false;
						}
					}
				}
			}
			return true;
		}
		this.router.navigate(['/login']);
		return false;
	}
}
