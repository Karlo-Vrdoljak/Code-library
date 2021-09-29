import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { fadeInExpandOnEnterAnimation, fadeOutCollapseOnLeaveAnimation } from 'angular-animations';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GlobalVar } from 'src/app/globalVar';
import { EInteractionReducer, navItems } from 'src/app/_interfaces/types';
import { SecurityService } from 'src/app/_services/security.service';
import { ONE_SECOND } from './../../_interfaces/types';
import { AppService } from './../../_services/app.service';
import { Breakpoint } from './../../_services/breakpoint';
import { ThemingService } from './../../_services/theming.service';

@Component({
	selector: 'app-nav',
	templateUrl: './nav.component.html',
	styleUrls: ['./nav.component.scss'],
	animations: [fadeInExpandOnEnterAnimation(), fadeOutCollapseOnLeaveAnimation()],
})
export class NavComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
	mainNavItems = [];
	hamburgerItems = [];
	language;
	showUpute = false;

	checked = false;
	useBreakpoints: Breakpoint;
	hasPreviousNavigation: boolean;
	private destroy = new Subject<void>();
	@ViewChild('op') panelRef: OverlayPanel;

	showNav = true;
	constructor(
		public securityService: SecurityService,
		private cdref: ChangeDetectorRef,
		public router: Router,
		public appService: AppService,
		public themingService: ThemingService,
		public translate: TranslateService,
		public globalVar: GlobalVar) {
		this.hasPreviousNavigation = Boolean(this.router.getCurrentNavigation()?.previousNavigation);

		this.router.events.pipe(takeUntil(this.destroy)).subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.hasPreviousNavigation = Boolean(this.router.getCurrentNavigation()?.previousNavigation);
				// this.cdref.detectChanges();
				const isOnRestrictedUrl = ['login', 'register', 'forgot-password', 'mail-verify', 'acc-confirm', 'change-password', 'password-reset'].some((url) => event.url.includes(url));
				this.showNav = isOnRestrictedUrl ? false : true;
			}
			// NavigationEnd
			// NavigationCancel
			// NavigationError
			// RoutesRecognized
		});
		this.appService.currentInteraction.pipe(takeUntil(this.destroy)).subscribe((data) => {
			if (data?.id == EInteractionReducer.scroll) {
				this.panelRef.hide();
			} else if (data?.id == EInteractionReducer.loggedIn || data?.id == EInteractionReducer.logoff) {
				this.setNavigation(window.innerWidth);
			}
		});
	}

	get currentUser() {
		return this.securityService.fetchUserDataInLocal();
	}

	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.unsubscribe();
	}
	ngAfterViewInit(): void { }

	ngAfterViewChecked() {
		this.cdref.detectChanges();
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.setNavigation(event.target.innerWidth);
	}
	setNavigation(width: number) {
		[this.mainNavItems, this.hamburgerItems] = this.makeNavItems(this.useBreakpoints.findBreakpoint(width));
		// this.hamburgerItems = this.hamburgerItems.map((hi) => {
		//   hi.label = this.translate.instant(hi.label);
		//   hi.routerLink = hi.link;
		//   return hi;
		// });
	}

	ngOnInit(): void {
		this.themingService.setDefaultTheme();
		this.useBreakpoints = new Breakpoint();
		this.setNavigation(window.innerWidth);

		this.language = localStorage.getItem('alumni_lang');
	}

	setLanguage() {
		this.language = localStorage.getItem('alumni_lang');
	}

	makeNavItems(breakpoint: string) {
		if (this.currentUser) {
			this.showUpute = true;
			//Ukoliko nije admin izbacujemo link za administraciju iz navigacije
			if (this.currentUser.IsAdmin) {
				return this.appService.splitArray(navItems, this.useBreakpoints.responsiveAmount(breakpoint));
			} else {
				return this.appService.splitArray(this.RemoveAdministrationFromNavItems(), this.useBreakpoints.responsiveAmount(breakpoint));
			}
		} else {
			this.showUpute = false;
			return this.appService.splitArray(this.FilterNavForAnonymous(), this.useBreakpoints.responsiveAmount(breakpoint));
		}

	}

	checkActive(rla, active: boolean) {
		// if (this.hasPreviousNavigation) {
		//   return active;
		// }

		return this.router.config.map((routes) => routes.path.split('/:')[0]).find((p) => window.location.href.includes(p) && rla.linkWithHref.href.includes(p)) ? true : false;
	}

	hidePanel(op: OverlayPanel) {
		setTimeout(() => {
			op.hide();
		}, ONE_SECOND / 5);
	}

	uputeDownload() {
		Object.assign(document.createElement('a'), { target: '_blank', href: 'assets/pdf/Upute.pdf' }).click();
	}

	private RemoveAdministrationFromNavItems() {
		return navItems.filter(item => item.id.toUpperCase() !== 'administracija'.toUpperCase());
	}
	get loggedin () {
		return this.securityService.fetchUserDataInLocal();
	}

	private FilterNavForAnonymous() {
		const anonymousNavItemsIds = ['POCETNA', 'RESURSI', 'FORUM', 'ANKETE'];
		return navItems.filter(item => anonymousNavItemsIds.includes(item.id.toUpperCase()));
	}
}
