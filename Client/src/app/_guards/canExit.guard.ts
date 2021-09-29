import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { CanExit } from './../_interfaces/CanExit';
@Injectable({
	providedIn: 'root',
})
export default class CanExitGuard implements CanDeactivate<CanExit> {
	canDeactivate(component: CanExit) {
		if (component.canDeactivate) {
			return component.canDeactivate();
		}
		return true;
	}
}
