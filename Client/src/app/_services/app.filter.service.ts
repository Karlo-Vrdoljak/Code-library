import { Injectable } from '@angular/core';
import { FilterService } from 'primeng/api';

export enum EAppFilters {
	keyValueFilter,
}

/**
 * IMPORTANT: delcare in enum fn name of the filter
 */
@Injectable({
	providedIn: 'root',
})
export class AppFilterService {
	constructor(public filter: FilterService) {
		for (const item in EAppFilters) {
			if (typeof EAppFilters[item] !== 'string') {
				continue;
			}
			const name = EAppFilters[+item].toString();
			filter.register(item, this[name]);
		}
	}

	keyValueFilter(value, filter) {
		const [key] = Object.keys(filter);
		return Array.isArray(value) ? value.filter((v) => v[key] === filter[key]) : value;
	}
	
	filters(key: EAppFilters): (value: any[], filter: any) => any[] {
		return this.filter.filters[key];
	}
}
