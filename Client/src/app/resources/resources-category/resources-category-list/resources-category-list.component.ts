import { BreakpointObserver } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { ConfirmationService } from 'primeng/api';
import * as rfdc from 'rfdc';
import { forkJoin, Observable, Subject } from 'rxjs';
import { debounceTime, mergeMap, takeUntil } from 'rxjs/operators';
import { GlobalVar } from 'src/app/globalVar';
import { Kategorija } from 'src/app/_interfaces/forum';
import { ResursKategorija } from 'src/app/_interfaces/resursi';
import { BreadCrumb, Pretplata, RequestCleanup, TYPING_DEBOUNCE } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { BreadcrumbBuilder } from 'src/app/_services/breadcrumb.builder';
import { PretplateService } from 'src/app/_services/pretplate.service';
import { ResursiService } from 'src/app/_services/resursi.service';
import { SecurityService } from 'src/app/_services/security.service';
import { ThemingService } from 'src/app/_services/theming.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-resources-category-list',
	templateUrl: './resources-category-list.component.html',
	styleUrls: ['./resources-category-list.component.scss'],
	animations: [fadeInOnEnterAnimation({ duration: 200 }), fadeOutOnLeaveAnimation({ duration: 200 })],
})
export class ResourcesCategoryListComponent implements OnInit {
	globalSearchForm = new FormGroup({
		search: new FormControl(null, []),
	});

	paginatorTotalRecords: number = 0;
	paginatorRowsPerView: number = 2;
	paginatorSubCat: any[] = [];
	displayAddCategoryDialog: boolean = false;
	displayEditCategoryDialog: boolean = false;
	selectedCategory: ResursKategorija = null;
	nullLevelCategoriesWithSubCat: ResursKategorija[] = [];
	resourcesBc: BreadCrumb[] = [];
	useCleanup: RequestCleanup;
	@Input() categoryView: boolean = false;

	_currCategory: ResursKategorija = null;
	get currCategory() {
		return this._currCategory;
	}
	@Input() set currCategory(value) {
		this._currCategory = value;
		this.selectedCategory = this._currCategory;
		this.setPaginatorData();
	}
	@Output() replaceResourcesBcLabelAfterUpdate: EventEmitter<string> = new EventEmitter();
	breakPointQuery = '(max-width: 768px)';
	paginatorMap = {} as {
		[key: number]: {
			first: number;
			rows: number;
			TotalRecords: number;
		};
	};
	ROW_NUMBER: number = environment.PAGINATION_FORUM_ROW_NUMBER;
	private destroy = new Subject<void>();
	smallScreen: boolean;
	query: string = null;

	readonly claimData = {
		modulName: environment.UserClaims.eBiblioteka.modulName,
		claimName: environment.UserClaims.eBiblioteka.Kategorija
	}
	hasCategoryRights: boolean = false;
	userData: any = null;

	pretplataData: Pretplata[] = null;
	renderView: boolean = false;
	readonly pretplataConfig = {
		modul: 'E-BIBLIOTEKA',
		segment: 'KATEGORIJA'
	}

	constructor(private globalVar: GlobalVar, private pretplateService: PretplateService, private securityService: SecurityService, public breakpoint: BreakpointObserver, private router: Router, public themingService: ThemingService, public confrim: ConfirmationService, public translate: TranslateService, private resursiService: ResursiService, private route: ActivatedRoute, private appService: AppService, private location: Location) {
		this.useCleanup = this.appService.useRequestCleanup();
		this.observeMediaQuery();
		this.observeSearch();
	}
	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.unsubscribe();
	}

	observeMediaQuery() {
		this.breakpoint
			.observe(this.breakPointQuery)
			.pipe(takeUntil(this.destroy))
			.subscribe((state) => this.applyMediaQueryChanges(state));
	}
	applyMediaQueryChanges(state) {
		this.smallScreen = !state.matches;
	}
	async ngOnInit() {
		if (this.categoryView) {
			this.currCategory && this.setSelectedCategory(this.currCategory);
			this.setPaginatorData();
		} else {
			window.sessionStorage.removeItem('breadcrumbList');
			this.setNullLevelKategorijeWithSubCat({ query: this.query });
		}

		this.resourcesBc = new BreadcrumbBuilder().addNew({ label: 'POCETNA', link: '/home' }).addNew({ label: 'DIGITALNABIBLIOTEKA', link: '/resources' }).build();
		this.hasCategoryRights = this.securityService.hasRights(this.claimData.modulName, this.claimData.claimName);
		this.userData = this.securityService.fetchUserDataInLocal();
		if (this.userData) this.pretplataData = await this.getUserPretplateData();
		this.renderView = true;
	}

	public navigateToCategory(PkCategory: number) {
		this.router.navigate(['/resources/category', PkCategory]);
	}

	paginate(event: any, PkResursKategorija: number, isClientSide = false) {
		const { first, rows } = event;
		this.paginatorMap[PkResursKategorija] = {
			...this.paginatorMap[PkResursKategorija],
			first,
			rows,
		};
		if (isClientSide) {
			this.paginatorSubCat = this.currCategory.subCat.slice(first, first + rows);
		} else {
			this.resursiService.getResursiPotKategorije({ PkResursKategorija, skip: first, take: rows }).subscribe(
				(data) => {
					const cat = this.nullLevelCategoriesWithSubCat.find((cat) => cat.PkResursKategorija == PkResursKategorija);
					cat.subCat = data;
				},
				(err) => {
					this.useCleanup.err(err);
				}
			);
		}
	}

	toogleInsertDialog() {
		this.displayAddCategoryDialog = !this.displayAddCategoryDialog;
	}

	toogleEditDialog() {
		this.displayEditCategoryDialog = !this.displayEditCategoryDialog;
	}

	navigateAddCategory(cat) {
		this.router.navigate(['resources/category/add-new'], { state: { category: cat } });
	}

	navigateEditCategory(cat) {
		this.router.navigate(['resources/category/edit'], { state: { category: cat } });
	}

	setSelectedCategory(cat: ResursKategorija) {
		this.selectedCategory = cat;
	}

	openDeleteDialogConfirmation() {
		this.confrim.confirm({
			header: this.translate.instant('BRISANJE_KATEGORIJE_HEADER') + ' • ' + this.selectedCategory.Naziv,
			message: this.translate.instant('BRISANJE_KATEGORIJE_MESSAGE'),
			icon: 'pi pi-info-circle',
			key: 'deleteCategory',
			accept: () => {
				if (this.selectedCategory.subCat && this.selectedCategory.subCat.length > 0) {
					this.useCleanup.warn(this.translate.instant('BRISANJE_KATEGORIJE_WARN'));
				} else {
					this.useCleanup.isLoading = true;
					this.useCleanup.start().then(() => {
						this.useCleanup.isLoading = false;
					});
					this.resursiService.deleteResursiKategorija(this.selectedCategory.PkResursKategorija).subscribe(
						(data) => {
							this.useCleanup.doneToast('CHANGES_SAVED');
							this.useCleanup.done();
							this.useCleanup.isLoading = false;
							this.location.back();
						},
						(err) => {
							this.useCleanup.err(err);
							this.useCleanup.isLoading = false;
						}
					);
				}
			},
		});
	}

	setNullLevelKategorijeWithSubCat({ skip = 0, take = this.ROW_NUMBER, query = null }): void {
		this.useCleanup.startBg();
		let nullLevelCategories: ResursKategorija[] = [];
		//Prvo dohvacamo sve kategorije nulte razine (PkParent = null)
		this.resursiService
			.getResursiKategorije()
			.pipe(
				mergeMap((categories) => {
					nullLevelCategories = categories;
					//Za svaku kategoriju nulte razine pozivamo api za dohvat njenih potkategorija
					const apiCalls: Observable<ResursKategorija[]>[] = [];
					nullLevelCategories.forEach((cat) => apiCalls.push(this.resursiService.getResursiPotKategorije({ PkResursKategorija: cat.PkResursKategorija, skip, take, query })));
					return forkJoin(apiCalls);
				})
			)
			.subscribe(
				(data) => {
					//Kada dohvatimo sve potkategorije sirimo objekt kategorija s nizom potkategorija
					nullLevelCategories.forEach((cat, i) => {
						cat.subCat = data[i];
					});

					this.paginatorMap = nullLevelCategories
						.map((cat) => {
							const [subCat] = cat.subCat;
							const { TotalRecords } = subCat ?? { TotalRecords: 0 };
							return {
								[cat.PkResursKategorija]: {
									first: skip,
									rows: take,
									TotalRecords,
								},
							};
						})
						.reduce((c, r) => ({ ...c, ...r }));

					this.useCleanup.doneBg();

					this.nullLevelCategoriesWithSubCat = nullLevelCategories;
				},
				(err) => {
					this.useCleanup.err(err);
				}
			);
	}

	public onCategoryInsertComplete(isSuccessful: boolean) {
		if (isSuccessful) {
			//Ukoliko   se insert kategorije uspjesno izvrsio dohvacamo sve njegove potkategorije kak obig refreshali view s novodadonom
			if (this.categoryView) {
				this.getSubCategoriesAfterInsert();
			} else {
				this.setNullLevelKategorijeWithSubCat({ query: this.query });
			}
			this.toogleInsertDialog();
		}
	}

	onCategoryUpdateComplete(isSuccessful: boolean) {
		if (isSuccessful) {
			this.getCategoryAfterUpdate();
			this.toogleEditDialog();
		}
	}

	private getSubCategoriesAfterInsert(): void {
		const PkCategory: number = parseInt(this.route.snapshot.params.PkCategory);

		this.resursiService.getResursiPotKategorije({ PkResursKategorija: PkCategory }).subscribe(
			(data) => {
				this.currCategory.subCat = data;
				this.setSelectedCategory(this.currCategory);
				this.setPaginatorData();
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	private getCategoryAfterUpdate(): void {
		const PkCategory: number = parseInt(this.route.snapshot.params.PkCategory);

		this.resursiService.getResursiKategorije(PkCategory).subscribe(
			(data) => {
				this.currCategory = { ...this.currCategory, ...data[0] };
				this.replaceResourcesBcLabelAfterUpdate.emit(data[0].Naziv);
				this.setSelectedCategory(this.currCategory);
				this.setPaginatorData();
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	isNonNullLevelForPaginator() {
		return !this.nullLevelCategoriesWithSubCat?.length && this.currCategory;
	}

	private setPaginatorData(): void {
		const [cat] = this.currCategory?.subCat;
		const { TotalRecords } = cat ?? { TotalRecords: 0 };

		this.paginatorMap[this.currCategory.PkResursKategorija] = {
			first: 0,
			rows: this.isNonNullLevelForPaginator() ? 2 : this.ROW_NUMBER,
			TotalRecords: this.isNonNullLevelForPaginator() ? TotalRecords : this.currCategory?.subCat.length,
		};

		this.paginatorSubCat = this.currCategory && this.currCategory.subCat.slice(0, 2);
	}

	resetSearch(form: FormGroup) {
		form.controls?.search.reset();
	}
	openAdvancedSearchForm() {
		alert('advanced search todo');
	}
	observeSearch() {
		this.globalSearchForm.controls.search.valueChanges.pipe(takeUntil(this.destroy), debounceTime(TYPING_DEBOUNCE)).subscribe((query) => {
			this.query = query;
			this.setNullLevelKategorijeWithSubCat({ query });
		});
	}

	getUserPretplateData(): Promise<Pretplata[]> {
		return new Promise((resolve, reject) => {
			this.pretplateService.getUserPretplate().subscribe(data => {
				resolve(data);
			}, err => {
				reject(err);
			});
		})
	}

	isSubscribed(categoryInfo: ResursKategorija) {
		const pretplataExists = this.pretplataData.some(p => p.Modul === this.pretplataConfig.modul && p.Segment === this.pretplataConfig.segment && p.Pk === categoryInfo.PkResursKategorija)

		if (pretplataExists) {
			return true;
		} else {
			return false;
		}
	}

	handleSubscribeOnClick(e: any, categoryInfo: ResursKategorija) {
		if (this.isSubscribed(categoryInfo)) {
			this.otkaziPretplatuKorisnikaNaForumKategoriju(e, categoryInfo);
		} else {
			this.pretplatiKorisnikaNaForumKategoriju(e, categoryInfo);
		}
	}

	pretplatiKorisnikaNaForumKategoriju(e: any, categoryInfo: ResursKategorija) {
		e.stopPropagation();

		const params = this.setPretplataParams(categoryInfo.PkResursKategorija);
		this.useCleanup.startBg();

		this.pretplateService.userPretplataInsert(params).subscribe((data: Pretplata[]) => {
			this.pretplataData.push(data[0]);
			// this.activeSubsriptions.push(categoryInfo.PkKategorija); //isto sto i data[0].Pk

			this.useCleanup.doneBg();
			this.appService.prikaziToast('success', this.translate.instant("USPJEH_PRETPLATA_HEADER"), `${this.translate.instant("USPJEH_PRETPLATA_MSG")} ${categoryInfo.Naziv}`, this.globalVar.trajanjeErrAlert, 'globalToast', null);
		}, (err) => {
			this.useCleanup.err(err);
		})
	}

	otkaziPretplatuKorisnikaNaForumKategoriju(e: any, categoryInfo: ResursKategorija) {
		e.stopPropagation();

		const pretplata = this.pretplataData.find(p => p.Modul === this.pretplataConfig.modul && p.Segment === this.pretplataConfig.segment && p.Pk === categoryInfo.PkResursKategorija);

		this.pretplateService.userPretplataDelete({ PkPretplate: pretplata.PkPretplate }).subscribe((data) => {

			this.pretplataData = this.pretplataData.filter(p => p.PkPretplate !== pretplata.PkPretplate);
			// this.activeSubsriptions = this.activeSubsriptions.filter(as => as !== categoryInfo.PkKategorija);

			this.useCleanup.doneBg();
			this.useCleanup.doneToast('USPJEH_PRETPLATA_OTKAZANA');
		}, (err) => {
			this.useCleanup.doneBg();
			this.useCleanup.err(err);
		})
	}

	setPretplataParams(PkKategorija: number): { modul: string, segment: string, pk: number } {
		return {
			modul: this.pretplataConfig.modul,
			segment: this.pretplataConfig.segment,
			pk: PkKategorija
		}
	}
}
