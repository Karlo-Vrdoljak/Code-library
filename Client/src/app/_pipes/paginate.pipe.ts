import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'paginate' })
export class PaginationPipe implements PipeTransform {
	transform(value: any[], first: number, rows: number): any {
		return [...value.slice(first, first + rows)];
	}
}
