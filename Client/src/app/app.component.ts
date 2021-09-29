import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as AOS from 'aos';
import { PrimeNGConfig, FilterService } from 'primeng/api';
import { EInteractionReducer, ELocalStorage } from './_interfaces/types';
import { AppService } from './_services/app.service';
import { ThemingService } from './_services/theming.service';
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	animations: [
		trigger('routerTransition', [
			transition('* <=> *', [
				query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
				// group([query(':enter', [style({ transform: 'translateY(100%)' }), animate('0.5s ease-in-out', style({ transform: 'translateY(0%)' }))], { optional: true }), query(':leave', [style({ transform: 'translateY(0%)' }), animate('0.5s ease-in-out', style({ transform: 'translateY(-100%)' }))], { optional: true })]),
				group([query(':enter', [style({ transform: 'translateX(100%)' }), animate('0.5s ease-in-out', style({ transform: 'translateX(0%)' }))], { optional: true }), query(':leave', [style({ transform: 'translateX(0%)' }), animate('0.5s ease-in-out', style({ transform: 'translateX(-100%)' }))], { optional: true })]),
			]),
		]),
	],
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
	checked: any = true;
	@ViewChild('scrollContent') scrollContent: ElementRef;
	hasPreviousNavigation: boolean;
	scroll = null;
	constructor(public filter: FilterService, public themingService: ThemingService, public appService: AppService, public router: Router, public translate: TranslateService, private primengConfig: PrimeNGConfig) {
		this.hasPreviousNavigation = Boolean(this.router.getCurrentNavigation()?.previousNavigation);

		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.hasPreviousNavigation = Boolean(this.router.getCurrentNavigation()?.previousNavigation);
			}
			// NavigationEnd
			// NavigationCancel
			// NavigationError
			// RoutesRecognized
		});
	}
	ngOnDestroy(): void {}
	ngOnInit(): void {
		this.primengConfig.ripple = true;
		let lang = localStorage.getItem(ELocalStorage.LANG);
		if (lang) {
			this.translate.use(lang).subscribe(() => this.translate.get('primeng').subscribe((res) => this.primengConfig.setTranslation(res)));
		} else {
			this.translate.use('hr').subscribe(() => this.translate.get('primeng').subscribe((res) => this.primengConfig.setTranslation(res)));
			localStorage.setItem(ELocalStorage.LANG, 'hr');
		}
		AOS.init();
	}

	ngAfterViewInit(): void {
		window.addEventListener(
			'storage',
			(event) => {
				const { key, newValue, isTrusted } = event;
				switch (key) {
					case ELocalStorage.JWT:
						if (isTrusted) {
							window.location.reload();
						}
						break;
					case ELocalStorage.THEME:
						if (isTrusted) {
							this.themingService.setTheme(newValue);
						}
						break;
					case ELocalStorage.LANG:
						if (isTrusted) {
							this.translate.use(newValue);
						}
						break;
					default:
						break;
				}
			},
			false
		);
	}

	title = 'Alumni';
	getState(outlet) {
		// Changing the activatedRouteData.state triggers the animation
		if (this.hasPreviousNavigation) return outlet.activatedRouteData.state;
	}

	@HostListener('window:scroll', ['$event']) scrollEvent($event: Event): void {
		this.appService.nextInteraction({ id: EInteractionReducer.scroll, args: {} });
	}
	log(x) {
	}
}
