import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterState } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GlobalVar } from '../globalVar';
import { Interaction, MAX_LOADER_SHOW, RequestCleanup } from './../_interfaces/types';
import { ThemingService } from './theming.service';

@Injectable({
	providedIn: 'root',
})
export class AppService {
	constructor(public themingService: ThemingService, public http: HttpClient, private primengConfig: PrimeNGConfig, public loader: NgxUiLoaderService, private messageService: MessageService, private translate: TranslateService, public router: Router, public globalVar: GlobalVar) {}
	private interaction = new BehaviorSubject<Interaction>(null);
	currentInteraction = this.interaction.asObservable();

	nextInteraction(data: Interaction) {
		this.interaction.next(data);
	}

	handleError<T>(operacija: string) {
		return (error: HttpErrorResponse): Observable<T> => {
			let errorMessage: {} | string = '';
			
			//Ukoliko je 401 samo ispisujemo korisniku da je pristup neautoriziran
			// if (error.status == 401) {
			// 	this.router.navigate(['login']);
			// }
			if (error.error instanceof ErrorEvent) {
				// client-side error
				console.error('3 Komponenta/funkcija greške:', operacija);
				console.error('4 Klijentska/mrežna greška ', error.error.message);
			} else {
				// server-side error
				console.error('5 Komponenta/funkcija greške:', operacija);
				console.error('6 Serverska greška ', error.error.message);
			}
			//Ukoliko je status 600 (s tim statusom su definirane sve NASE greske), tada ispisujemo nasu gresku koja je definirana u translate json fileovima
			//U suprotnom ispisujemo sistemsku gresku
			console.error(error);

			if (error.status === 600) {
				errorMessage = { errorCode: error.error.message, message: this.translate.instant(error.error.message) };
			} else {
				if (error.error?.message?.startsWith('STD:')) {
					errorMessage = { errorKey: error.error.message, message: this.translate.instant(error.error.message) };
				} else {
					errorMessage = { message: error.error.message };
				}
			}
			return throwError(errorMessage);
		};
	}
	get ApiUrl() {
		return environment.API_URL;
	}
	get PublicUrl() {
		return environment.PUBLIC_URL;
	}
	get defaultImage() {
		return this.themingService.currentTheme == 'dark' ? environment.DEFAULT_IMAGE_DARK : environment.DEFAULT_IMAGE;
	}
	public handleRouterState(state: RouterState) {
		this.translate.get(['TRY_AGAIN', 'ERROR']).subscribe((tran) => {
			this.messageService.add({ key: 'globalToast', severity: 'warn', detail: this.translate.instant(tran.TRY_AGAIN), summary: this.translate.instant(tran.ERROR) });
		});

	}

	// Funkcija grupira podatke po zadanom kljucu, kljuc treba biti naziv property-a po kojem zelimo grupirati
	public groupDataByKey(valuesToGroup: any[], groupKey: string): Promise<{}> {
		return new Promise((resolve, reject) => {
			try {
				if (valuesToGroup.length > 0) {
					resolve(
						valuesToGroup.reduce((r, a) => {
							if (a[groupKey] !== null) {
								r[a[groupKey]] = r[a[groupKey]] || [];
								r[a[groupKey]].push(a);
								return r;
							}
							return r;
						}, Object.create(null))
					);
				} else {
					resolve({});
				}
			} catch (error) {
				reject(error);
			}
		});
	}
	
	public groupDataByKeySync(valuesToGroup: any[], key: string) {
		return valuesToGroup.reduce((hash, obj) => {
			if (obj[key] === undefined) return hash;
			return Object.assign(hash, { [obj[key]]: (hash[obj[key]] || []).concat(obj) });
		}, {});
	}

	// Dodano za formatiranje datuma prilikom slanja u bazu podataka ili filtriranje u ag gridu
	//NAPOMENA: FUNKCIJA PREFORMULIRANA DA KONSTRUIRA I DANASNJI DATUM U ISTOM FORMATU UKOLIKO PARAMETAR UnFormatedDate NIJE POSLAN
	public formatirajDatumOut(UnFormatedDate?: any) {
		let date: Date = UnFormatedDate ? new Date(UnFormatedDate) : new Date();

		let formattedDate: string = date.getFullYear() + '-' + ('00' + (date.getMonth() + 1)).slice(-2) + '-' + ('00' + date.getDate()).slice(-2);
		return formattedDate;
	}
	public formatirajDatumIn(FormatedDate: any) {
		let dateFormat;
		if (FormatedDate !== null) {
			dateFormat = new Date(FormatedDate);
			dateFormat = ('00' + dateFormat.getDate()).slice(-2) + '.' + ('00' + (dateFormat.getMonth() + 1)).slice(-2) + '.' + dateFormat.getFullYear();
			return dateFormat;
		}
		return null;
	}

	public prikaziToast(severity: string, summary: string, detail: any, life: number, key: string, err?: any) {
		this.messageService.clear(key);
		if (!err) {
			err = {};
		}

		if (err.status === 0) {
			this.messageService.add({ key: key, severity: severity, summary: summary, detail: this.translate.instant('SERVERNEDOSTUPAN'), life: life });
		} else {
			let textDetail;
			if (detail && detail.message) {
				textDetail = detail.message;
			} else {
				textDetail = detail;
			}

			this.messageService.add({ key: key, severity: severity, summary: summary, detail: textDetail, life: life });
		}
	}

	useRequestCleanup(): RequestCleanup {
		return {
			warn: (msg: string, header?: string) => {
				this.prikaziToast('warn', this.translate.instant(header ?? 'WARNING'), this.translate.instant(msg), this.globalVar.trajanjeErrAlert, 'globalToast', null);
			},
			err: (err) => {

				this.prikaziToast('error', this.translate.instant('DOSLO_JE_DO_POGRESKE'), err, this.globalVar.trajanjeErrAlert, 'globalToast', err);
				this.loader.stop();
				this.loader.stopBackground();
			},
			done: () => {
				this.loader.stop();
			},
			doneBg: () => {
				this.loader.stopBackground();
			},
			doneToast: (msg: string, header?: string) => {
				this.prikaziToast('success', this.translate.instant(header ?? 'SUCCESS'), this.translate.instant(msg), this.globalVar.trajanjeErrAlert, 'globalToast', null);
			},
			start: () => {
				return new Promise((resolve) => {
					this.loader.start();
					setTimeout(() => {
						resolve(true);
					}, MAX_LOADER_SHOW);
				});
			},
			startBg: () => {
				return new Promise((resolve) => {
					this.loader.startBackground();
					setTimeout(() => {
						resolve(true);
					}, MAX_LOADER_SHOW);
				});
			},
			isLoading: false,
		};
	}

	chunkify(list: any[], chunkSize: number) {
		return [...Array(Math.ceil(list.length / chunkSize))].map((_) => list.splice(0, chunkSize));
	}
	splitArray(list: any[], chunkSize: number) {
		return [list.slice(0, chunkSize), list.slice(chunkSize)];
	}

	toggleLang() {
		let currLang = this.translate.currentLang;
		let nextLang = null;
		if (currLang == 'hr') {
			nextLang = 'en';
		} else {
			nextLang = 'hr';
		}
		this.translate.use(nextLang).subscribe(() => this.translate.get('primeng').subscribe((res) => this.primengConfig.setTranslation(res)));
		localStorage.setItem('alumni_lang', nextLang);
	}

	localeDate(date: Date | string, useTime = false) {
		if (!date) return null;
		date = new Date(date);
		let time = '';
		if (useTime) {
			time = ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
		}
		switch (this.translate.currentLang) {
			case 'en': {
				return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` + time;
			}
			case 'hr': {
				return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` + time;
			}
			default: {
				return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` + time;
			}
		}
	}
	formHasErrors(control: AbstractControl) {
		return control?.status == 'INVALID' && !control?.pristine;
	}
	formAddCustomError(control: AbstractControl, error: any) {
		control.setErrors({ ...control.errors, ...error });
	}
	formRemoveCustomError(control: AbstractControl, name: string) {
		if (control.errors && control.errors != null && control.errors[name]) delete control.errors[name];
		if (control.errors && control.errors != null && Object.keys(control.errors).length === 0) {
			control.setErrors(null);
		}
	}
	formErrorExists(errors: any) {
		return errors && errors != null && Object.keys(errors).length != 0;
	}
	/**
	 *
	 * @param condition conditional statement, what would of been in "if"
	 * @param control the control that you wish to add if the statement is truthy
	 * @returns
	 */
	formAddControlByCondition(condition: boolean, control: any) {
		if (condition) {
			return control;
		}
		return {};
	}

	navigateToUserProfile(pkUsera: number) {
		this.router.navigate(['/my-profile', pkUsera]);
	}
	toFormData<T>(formValue: T) {
		const formData = new FormData();

		for (const key of Object.keys(formValue)) {
			const value = formValue[key];
			formData.append(key, value);
		}
		return formData;
	}
	parseFile(file: any) {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		return new Observable((observer) => {
			reader.onloadend = () => {
				observer.next(reader.result);
				observer.complete();
			};
		});
	}
	getFile(url: string, file: any): Observable<{ url: string; blob: Blob }> {
		return this.http.get(url, { params: { file }, responseType: 'blob' }).pipe(
			map((x) => {
				const urlToBlob = window.URL.createObjectURL(x); // get a URL for the blob
				return { url: urlToBlob, blob: x }; // tell Anuglar to trust this value
			})
		);
	}
	downloadFile({ originalname, url }) {
		Object.assign(document.createElement('a'), {
			target: '_blank',
			href: url,
			download: originalname,
		}).click();
	}
	openFileNewTab(url: string) {
		Object.assign(document.createElement('a'), {
			target: '_blank',
			href: url,
		}).click();
	}
	scrollTo(id: string) {
		setTimeout(() => {
			document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); // let angular do its rerender magic 1st
		});
	}
	swap(arr: any[], index1: number, index2: number): any[] {
		arr = [...arr];
		const temp = arr[index1];
		arr[index1] = arr[index2];
		arr[index2] = temp;
		return arr;
	}
	dateFormatPCal() {
		return this.translate.currentLang == 'en' ? 'dd/mm/yy' : 'dd. mm. yy.';
	}
}
