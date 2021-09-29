import { BreakpointObserver } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CRUD, RequestCleanup, SIZE_50MB } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ProfileService } from 'src/app/_services/profile.service';
import { SecurityService } from 'src/app/_services/security.service';

@Component({
	selector: 'app-add-attachment',
	templateUrl: './add-attachment.component.html',
	styleUrls: ['./add-attachment.component.scss'],
})
export class AddAttachmentComponent implements OnInit, OnDestroy {
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
	@Input() emitValue: boolean = false;
	@Input() ignoreRedirectBack: boolean = false;
	constructor(private cd: ChangeDetectorRef, public router: Router, public securityService: SecurityService, public confirmationService: ConfirmationService, public location: Location, public translate: TranslateService, public breakpoint: BreakpointObserver, public appService: AppService, public profileService: ProfileService, public fb: FormBuilder) {
		this.initForm();
		this.useCleanup = this.appService.useRequestCleanup();
		if (this.router.getCurrentNavigation()?.extras?.state?.data) {
			const { user, mode } = this.router.getCurrentNavigation().extras.state?.data;
			if (user?.PkOsobniPodaciPkUsera && mode) {
				this.setComponentWorkMode({ user, mode });
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
	setComponentWorkMode(config: { user: { PkOsobniPodaciPkUsera: number }; mode: CRUD }) {
		const { user, mode } = config;
		this.user = user;
		this.mode = mode;
		this.initForm();
	}
	observeMediaQuery() {
		this.breakpoint
			.observe(this.breakPointQuery)
			.pipe(takeUntil(this.destroy))
			.subscribe((state) => this.applyMediaQueryChanges(state));
	}
	applyMediaQueryChanges({ matches }) {
		this.smallScreen = matches;
		if (!this.ignoreRedirectBack) {
			if (!this.user?.PkOsobniPodaciPkUsera && this.smallScreen && this.asDialog == false) {
				this.location.back();
			}
		}
	}
	initForm() {
		this.form = this.fb.group({
			Opis: this.fb.control(null, [Validators.required]),
			CoverImage: this.fb.control(null, []),
			Naziv: this.fb.control(null, [Validators.required]),
			File: this.fb.control(null, [Validators.required]),
		});
	}

	get fileSize() {
		return SIZE_50MB;
	}

	canSubmit() {
		return !this.form.valid;
	}

	reset() {
		this.mode = 'insert';
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
		const { Opis, CoverImage, File, Naziv } = this.form.value;
		const { file } = File;
		const params = {
			Naziv,
			Opis,
			PkOsobniPodaciPkUsera: this.user?.PkOsobniPodaciPkUsera,
			PkDatoteka: null,
			CoverImage,
			file,
			imageSrc: this.imageSrc
		};

		if (this.emitValue) {
			this.onSave.emit(params);
		} else {
			this.profileService.postAttachment(params).subscribe(
				(result) => {
					this.form.reset();
					this.useCleanup.doneToast('CHANGES_SAVED');
					this.useCleanup.done();
					if (this.smallScreen) {
						this.location.back();
					} else {
						this.onSave.emit({ ...result, mode: 'insert' }); //set in default insert mode
					}
					this.useCleanup.isLoading = false;
				},
				(err) => {
					this.useCleanup.err(err);
				}
			);
		}
	}
	handleUploadImage(files: any) {
		const [file] = files;
		this.imageSrc = URL.createObjectURL(file);
		this.form.controls.CoverImage.reset(file);
	}

	handleUploadFile(files: any) {
		const [file] = files;
		this.form.controls.File.reset({ file });
	}
}
