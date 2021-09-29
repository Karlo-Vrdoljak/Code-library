import { Directive, HostBinding, Input, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ThemingService } from '../_services/theming.service';
@Directive({
	selector: 'img[default]',
	host: {
		'(error)': 'updateUrl()',
		'(load)': 'load()',
		'[src]': 'src',
	},
})
export class ImagePreloadDirective implements OnDestroy {
	@Input() src: string;
	@Input() default: boolean;
	@HostBinding('class') className;
	hasError: boolean = false;
	private destroy = new Subject<void>();
	constructor(private themingService: ThemingService) {
		this.themingService.onThemeChange.subscribe((theme) => {
			if (this.hasError) {
				this.src = this.themingService.currentTheme == 'dark' ? environment.DEFAULT_IMAGE_DARK : environment.DEFAULT_IMAGE;
			}
		});
	}

	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.unsubscribe();
	}

	updateUrl() {
		this.hasError = true;
		this.src = this.default ? (this.themingService.currentTheme == 'dark' ? environment.DEFAULT_IMAGE_DARK : environment.DEFAULT_IMAGE) : this.src;
	}
	load() {
		this.className = 'image-loaded';
	}
}
