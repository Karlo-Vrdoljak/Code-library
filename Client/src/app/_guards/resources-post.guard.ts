import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SecurityService } from './../_services/security.service';

@Injectable({
    providedIn: 'root',
})

export class ResourcesPostGuard implements CanActivate {
    constructor(public router: Router, public security: SecurityService) { }
    canActivate(): Observable<boolean> | Promise<boolean> | boolean {

        const user = this.security.fetchUserDataInLocal();
        const userClaims = JSON.parse(user.Claims);

        if (userClaims.eBiblioteka.Datoteka || user.IsAdmin) return true;
		this.router.navigate(['/login']);
        return false;
    }
}
