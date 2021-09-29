import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { environment } from 'src/environments/environment';
import { AnketeService } from '../_services/ankete.service';
@Injectable({
	providedIn: 'root',
})
export class AnketaSolveResolver implements Resolve<any> {
	constructor(private translate: TranslateService, private router: Router, private anketeService: AnketeService, private appService: AppService) {}
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const { PkAnketa } = route.params;

		return forkJoin([
			this.anketeService.getAnkete({ PkAnketa }).pipe(
				mergeMap((ankete) => {
					const [anketaMeta] = ankete;
					return forkJoin([of(anketaMeta), this.anketeService.getPredlozakTemplating({ PkPredlozak: anketaMeta.anketa.PkPredlozak })]);
				})
			),
		]).pipe(
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
