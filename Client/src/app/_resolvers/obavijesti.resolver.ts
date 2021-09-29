import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterState, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { environment } from 'src/environments/environment';
import { ELocalStorage, exists, purgeFalsyValueFromKeyValueObject } from '../_interfaces/types';
import { ObavijestiService } from './../_services/obavijesti.service';
@Injectable({
	providedIn: 'root',
})
export class ObavijestiResolver implements Resolve<any> {
	constructor(private breakpoint: BreakpointObserver, private translate: TranslateService, private router: Router, private obavijestiService: ObavijestiService, private appService: AppService) {}
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const PkObavijestKategorija = route.queryParams?.PkObavijestKategorija || 1;
		const PkUsera = route.queryParams?.PkUsera || null;
		
		const tag = route.queryParams?.tag || null;
		const isMatched = this.breakpoint.isMatched('(min-width: 1280px)');
		const dataFetcher = (tag): any[] => {
			const categoriesFromLocal = localStorage.getItem(ELocalStorage.SELECTED_KATEGORIJE);
			let primaryKeys = [];
			if (exists(categoriesFromLocal)) {
				primaryKeys = JSON.parse(categoriesFromLocal).map((k) => k.PkObavijestKategorija);
			} else {
				primaryKeys = [PkObavijestKategorija];
			}
			if (tag) {
				if (primaryKeys.length) {
					return primaryKeys.map(pk => {
						return this.obavijestiService.findObavijestForCategoryFTS({ skip: 0, take: isMatched ? 4 : 1, search: tag, ...purgeFalsyValueFromKeyValueObject({ PkObavijestKategorija: pk }), ...purgeFalsyValueFromKeyValueObject({ PkUsera }) })
					});
				} else {
					return [this.obavijestiService.findObavijestForCategoryFTS({ skip: 0, take: isMatched ? 4 : 1, search: tag, ...purgeFalsyValueFromKeyValueObject({ PkObavijestKategorija }), ...purgeFalsyValueFromKeyValueObject({ PkUsera }) })]
				}
			} else {
				if (primaryKeys?.length) {
					
					return primaryKeys.map((pk) => {
						return this.obavijestiService.getObavijestForCategory({ skip: 0, take: isMatched ? 4 : 1, ...purgeFalsyValueFromKeyValueObject({ PkObavijestKategorija: pk }), ...purgeFalsyValueFromKeyValueObject({ PkUsera }) });
					});
				} else {
					return [this.obavijestiService.getObavijestForCategory({ skip: 0, take: isMatched ? 4 : 1, ...purgeFalsyValueFromKeyValueObject({ PkObavijestKategorija }), ...purgeFalsyValueFromKeyValueObject({ PkUsera }) })];
				}
			}
		};

		return forkJoin([this.obavijestiService.getObavijestiKategorijaAll({}), ...dataFetcher(tag)]).pipe(
			catchError((err, caught) => {
				this.appService.prikaziToast('warn', this.translate.instant('WARNING'), err?.errorKey ? this.translate.instant(err.errorKey) : null, environment.trajanjeErrAlert, 'globalToast', null);

				if (environment.resolverContinueThroughError) {
					return of([true]);
				} else {
					return caught;
				}
			})
		);
	}
}
