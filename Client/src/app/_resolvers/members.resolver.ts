import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { environment } from 'src/environments/environment';
import { ProfileService } from '../_services/profile.service';
import { ObavijestiService } from './../_services/obavijesti.service';

@Injectable({
	providedIn: 'root',
})
export class MembersResolver implements Resolve<any> {
	constructor(public profileService: ProfileService,private breakpoint: BreakpointObserver, private translate: TranslateService, private router: Router, private appService: AppService) {}
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		return forkJoin([this.profileService.getVrstaClanstva({})]).pipe(
			catchError((err, caught) => {
				this.appService.prikaziToast('warn', this.translate.instant('WARNING'), this.translate.instant(err.errorKey), environment.trajanjeErrAlert, 'globalToast', null);
				if (environment.resolverContinueThroughError) {
					return of([true]);
				} else {
					return caught;
				}
			})
		);
	}
}
