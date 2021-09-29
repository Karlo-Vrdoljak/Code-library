import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SecurityService } from './../_services/security.service';

@Injectable({
    providedIn: 'root',
})
export class AdministrationGuard implements CanActivate {
    constructor(public router: Router, public security: SecurityService) { }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

        const user = this.security.fetchUserDataInLocal();

        if (user.IsAdmin) return true;
		this.router.navigate(['/home']);
        return false;
    }
}
