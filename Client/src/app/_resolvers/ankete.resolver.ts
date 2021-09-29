import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterState, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { environment } from 'src/environments/environment';
import { AnketeService } from '../_services/ankete.service';
import { ObavijestiService } from './../_services/obavijesti.service';
import { ProfileService } from './../_services/profile.service';
@Injectable({
	providedIn: 'root',
})
export class AnketeResolver implements Resolve<any> {
	constructor(private profileService: ProfileService, private translate: TranslateService, private router: Router, private anketeService: AnketeService, private appService: AppService) {}
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const { IsPublic } = route.data;

		const { PkUsera, tab } = route.params;
		return forkJoin([this.anketeService.getPredlosci({ PkUsera }), this.anketeService.getAnkete({ PkUsera, IsPublic }), this.profileService.getVrstaClanstva({})]).pipe(
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

/*******************************
 * (error) => of((err) => {
        console.error({error});
        console.error({err})
      })
 */
