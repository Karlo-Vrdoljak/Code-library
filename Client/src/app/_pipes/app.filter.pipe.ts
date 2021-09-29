import { Pipe, PipeTransform } from '@angular/core';
import { AppFilterService, EAppFilters } from '../_services/app.filter.service';

@Pipe({ name: 'appFilter' })
export class AppFilterPipe implements PipeTransform {
	constructor(public filter: AppFilterService) {}
	transform(value: any[], key: EAppFilters, filter: any): any {
		return this.filter.filters(key)(value, filter);
	}
}
