import { BreadCrumb } from '../_interfaces/types';


export class BreadcrumbBuilder {
	private breadcrumbs = [] as BreadCrumb[];
	
	constructor(breadcrumbs = []) {
		this.breadcrumbs = breadcrumbs ?? [];
		return this;
	}

	addNew(breadcrumb: BreadCrumb) {
		if(breadcrumb.link != null) {
			this.breadcrumbs = [...this.breadcrumbs, breadcrumb];
		}
		return this;
	}
	build() {
		return this.breadcrumbs;
	}
	pop () {
		this.breadcrumbs.pop();
		return this;
	}
}
