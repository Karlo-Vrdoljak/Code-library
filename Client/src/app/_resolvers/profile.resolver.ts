import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterState, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { environment } from 'src/environments/environment';
import { ProfileService } from '../_services/profile.service';
import { SecurityService } from '../_services/security.service';
@Injectable({
	providedIn: 'root',
})
export class ProfileResolver implements Resolve<any> {
	constructor(private securityService: SecurityService, private translate: TranslateService, private router: Router, private profileService: ProfileService, private appService: AppService) {}
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const { PkUser } = route.params;
		const user = this.securityService.fetchUserDataInLocal();

		return forkJoin([this.profileService.getProfileDataAll({ PkUsera: PkUser }), this.profileService.getOsobniPodaciVrste({}), this.profileService.getVrstaClanstva({}), this.profileService.getProfilePrilozi({ PkOsobniPodaciPkUsera: PkUser })]).pipe(
			catchError((err, caught) => {
				this.appService.prikaziToast('warn', this.translate.instant('WARNING'), err.errorKey && this.translate.instant(err.errorKey), environment.trajanjeErrAlert, 'globalToast', null);
				this.router.navigate(['not-found'], { replaceUrl: true });
				// if(environment.resolverContinueThroughError) {
				return of([{}, {}, {}, []]);
				// } else {
				// return caught;
				// }
			})
		);
	}
}
