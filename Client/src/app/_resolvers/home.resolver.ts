import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterState, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { environment } from 'src/environments/environment';
import { ObavijestiService } from './../_services/obavijesti.service';
@Injectable({
  providedIn: 'root',
})
export class HomeResolver implements Resolve<any> {
  constructor(private translate: TranslateService,private router: Router, private obavijestiService: ObavijestiService, private appService: AppService) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return forkJoin([
      this.obavijestiService.getObavijestCategoryGroup({skip:0, take:4})
    ]).pipe(
      catchError((err,caught) => {
        
        this.appService.prikaziToast('warn', this.translate.instant('WARNING'), this.translate.instant(err.errorKey), environment.trajanjeErrAlert, 'globalToast', null);
        if(environment.resolverContinueThroughError) {
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