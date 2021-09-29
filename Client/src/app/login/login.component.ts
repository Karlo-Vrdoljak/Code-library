import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInExpandOnEnterAnimation, fadeOutCollapseOnLeaveAnimation } from 'angular-animations';
import { AppService } from 'src/app/_services/app.service';
import { OauthService } from '../_services/oauth.service';
import { GlobalVar } from './../globalVar';
import { ELocalStorage, RequestCleanup } from './../_interfaces/types';
import { AaiAuthService } from './../_services/aai.auth.service';
import { SecurityService } from './../_services/security.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	animations: [fadeInExpandOnEnterAnimation(), fadeOutCollapseOnLeaveAnimation()],
})
export class LoginComponent implements OnInit {
	isProd = false;
	language;

	form = null;
	useCleanup: RequestCleanup;
	googleUrl: string;
	aaiUrl: string;

	constructor(private route: ActivatedRoute, private aaiAuthService: AaiAuthService, private fb: FormBuilder, public oauthService: OauthService, public appService: AppService, public securityService: SecurityService, public globalVar: GlobalVar, public router: Router) {}

	ngOnInit() {
		this.useCleanup = this.appService.useRequestCleanup();
		// this.isProd = environment.production;
		this.form = this.setupForm();
		this.language = localStorage.getItem('alumni_lang');
	}

	setupForm() {
		return this.fb.group({
			username: this.fb.control(null, [Validators.required]),
			password: this.fb.control(null, [Validators.required]),
			...this.appService.formAddControlByCondition(this.isProd, { captcha: this.fb.control(null, [Validators.required]) }),
		});
	}

	checkCanSubmit() {
		return !this.form.valid;
	}

	login() {
		if (this.useCleanup.isLoading || !this.form.valid) return;
		this.useCleanup.isLoading = true;
		this.useCleanup.start().then(() => {
			this.useCleanup.isLoading = false;
		});
		const params = {
			LoginName: this.form.value.username,
			Lozinka: this.form.value.password,
		};
		this.securityService.userLogin({ user: params }).subscribe(
			(jwt) => this.securityService.handleJWT(jwt, this.useCleanup),
			(err) => this.handleJWTError(err, params)
		);
	}

	handleJWTError(err, params) {
		if (err.errorKey == 'STD:INACTIVE_USER') {
			this.securityService.findUserByUsername({ LoginName: params.LoginName }).subscribe((user) => {
				localStorage.setItem(ELocalStorage.ACC_CONFIRM, JSON.stringify(user));
				this.useCleanup.err(err);
				this.useCleanup.isLoading = false;
			});
		} else {
			this.useCleanup.err(err);
			this.useCleanup.isLoading = false;
		}
	}
}
