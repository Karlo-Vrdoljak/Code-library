import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { EInteractionReducer, RequestCleanup } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { SecurityService } from 'src/app/_services/security.service';

@Component({
	selector: 'app-user-nav',
	templateUrl: './user-nav.component.html',
	styleUrls: ['./user-nav.component.scss'],
})
export class UserNavComponent implements OnInit, OnDestroy {
	private destroy = new Subject<void>();
	user: any;
	avatar: string;
	@ViewChild('menu') menu: Menu;
	useCleanup: RequestCleanup;
	constructor(public appService: AppService, public translate: TranslateService, public securityService: SecurityService) {
		this.useCleanup = this.appService.useRequestCleanup();
	}
	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.unsubscribe();
	}
	items: MenuItem[] = [];
	ngOnInit() {
		this.appService.currentInteraction.pipe(takeUntil(this.destroy)).subscribe((data) => {
			if (data?.id == EInteractionReducer.scroll && this.user?.PkUsera) {
				this.menu.hide();
			}
			if (data?.id == EInteractionReducer.avatarChanged) {
				this.user = this.securityService.fetchUserDataInLocal();
				this.setupAvatar();
			}
			if (data?.id == EInteractionReducer.loggedIn) {
				this.user = this.securityService.fetchUserDataInLocal();
				this.user && this.setupAvatar();
				this.user && this.setupMenu();
			}
			if (data?.id == EInteractionReducer.logoff) {
				this.user = null;
				this.avatar = null;
			}
			if (data?.id == EInteractionReducer.personalInfoChanged) {
				this.securityService
					.refreshJWT()
					.pipe(first())
					.subscribe(({ token }) => {
						this.securityService.handleJWT({ token }, this.useCleanup, false);
					});
			}
		});

		this.user = this.securityService.fetchUserDataInLocal();
		this.setupAvatar();

		this.setupMenu();
	}
	get initials() {
		return this.user ? this.user.ImeUsera[0].toUpperCase() + this.user.PrezimeUsera[0].toUpperCase() : null;
	}

	setupMenu() {
		this.translate.get(['MOJ_PROFIL', 'MOJE_OBAVIJESTI', 'LOGOFF']).subscribe((t) => {
			this.items = this.user ? [{ label: t.LOGOFF, icon: 'pi pi-fw pi-sign-out', command: () => this.securityService.logoff() }] : [];
		});
	}


	setupAvatar() {
		if (this.user?.LoginName) {
			this.securityService.findUserByUsername({ LoginName: this.user?.LoginName, onlyAvatar: true }).subscribe((user) => {
				let path = null;
				if (user?.AvatarPath) {
					path = this.appService.PublicUrl + user.AvatarPath;
				} else {
					path = null;
				}
				this.avatar = path;
			});
		} else {
			this.avatar = null;
		}
	}
}
