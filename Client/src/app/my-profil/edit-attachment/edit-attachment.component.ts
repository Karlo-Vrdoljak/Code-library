import { BreakpointObserver } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RequestCleanup, CRUD, SIZE_50MB } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ProfileService } from 'src/app/_services/profile.service';
import { SecurityService } from 'src/app/_services/security.service';

@Component({
	selector: 'app-edit-attachment',
	templateUrl: './edit-attachment.component.html',
	styleUrls: ['./edit-attachment.component.scss'],
})
export class EditAttachmentComponent implements OnInit, OnDestroy {
	user: { PkOsobniPodaciPkUsera: number };

	form: FormGroup;
	private destroy = new Subject<void>();
	useCleanup: RequestCleanup;
	breakPointQuery = '(max-width: 1024px)';
	smallScreen: boolean;
	mode: CRUD;
	@Output() onSave = new EventEmitter<any>();
	imageSrc: string;
	hasPreviousNavigation: boolean;
	@Input() asDialog: boolean = false;
	datoteka: any;
	@Input() emitValue: boolean = false;
	constructor(private cd: ChangeDetectorRef, public router: Router, public securityService: SecurityService, public confirmationService: ConfirmationService, public location: Location, public translate: TranslateService, public breakpoint: BreakpointObserver, public appService: AppService, public profileService: ProfileService, public fb: FormBuilder) {
		this.initForm();
		this.useCleanup = this.appService.useRequestCleanup();
		if (this.router.getCurrentNavigation().extras?.state?.data) {
			const { user, mode, datoteka } = this.router.getCurrentNavigation().extras.state?.data;
			if (user?.PkOsobniPodaciPkUsera && mode) {
				this.setComponentWorkMode({ user, mode, datoteka });
			}
		}
	}

	ngOnInit(): void {
		this.observeMediaQuery();
	}

	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.unsubscribe();
	}
	setComponentWorkMode(config: { user: { PkOsobniPodaciPkUsera: number }; datoteka: any; mode: CRUD }) {
		const { user, mode, datoteka } = config;
		this.user = user;
		this.mode = mode;
		this.datoteka = datoteka;
		this.initForm();
		this.setForm();
	}
	observeMediaQuery() {
		this.breakpoint
			.observe(this.breakPointQuery)
			.pipe(takeUntil(this.destroy))
			.subscribe((state) => this.applyMediaQueryChanges(state));
	}
	applyMediaQueryChanges({ matches }) {
		this.smallScreen = matches;

		if (!this.user?.PkOsobniPodaciPkUsera && this.smallScreen && this.asDialog == false) {
			this.location.back();
		}
	}
	initForm() {
		this.form = this.fb.group({
			Opis: this.fb.control(null, [Validators.required]),
			Naziv: this.fb.control(null, [Validators.required]),
		});
	}
	setForm() {
		this.form.reset({
			Opis: this.datoteka?.Opis,
			Naziv: this.datoteka?.Naziv,
		});
	}

	get fileSize() {
		return SIZE_50MB;
	}

	canSubmit() {
		return !this.form.valid;
	}
	reset() {
		this.mode = 'edit';
		this.user = null;
		this.imageSrc = null;
		this.initForm();
	}

	submit() {
		if (!this.form.valid) return;
		this.useCleanup.isLoading = true;
		this.useCleanup.start().then(() => {
			this.useCleanup.isLoading = false;
		});
		const { Opis, Naziv } = this.form.value;
		const params = {
			Opis,
			Naziv,
			PkDatoteka: this.datoteka.PkDatoteka,
		};
		if (this.emitValue) {
			this.onSave.emit(params);
		} else {
			this.profileService.editPrilog(params).subscribe(
				(result) => {
					this.form.reset();
					this.useCleanup.doneToast('CHANGES_SAVED');
					this.useCleanup.done();
					if (this.smallScreen) {
						this.location.back();
					} else {
						this.onSave.emit({ ...result, ...params, mode: 'insert' }); //set in default insert mode
					}
					this.useCleanup.isLoading = false;
				},
				(err) => {
					this.useCleanup.err(err);
				}
			);
		}
	}
}
