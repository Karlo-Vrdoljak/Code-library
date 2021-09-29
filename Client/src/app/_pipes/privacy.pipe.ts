import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'privacy'})
export class PrivacyPipe implements PipeTransform {
  transform(x: string, isPrivate = false): string {
    if (isPrivate) {
      const [first, last] = ['****', (x.slice(x.length - 4, x.length ))]
      return first + last;
    } else {
      return x;
    }
  }
}