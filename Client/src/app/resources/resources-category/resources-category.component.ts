import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import * as rfdc from 'rfdc';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { GlobalVar } from 'src/app/globalVar';
import { ResursKategorija, ResursObjava } from 'src/app/_interfaces/resursi';
import { BreadCrumb, RequestCleanup, TYPING_DEBOUNCE } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ResourcesBreadcrumbService } from 'src/app/_services/resources-breadcrumb.service';
import { ResursiService } from 'src/app/_services/resursi.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-resources-category',
  templateUrl: './resources-category.component.html',
  styleUrls: ['./resources-category.component.scss'],
	animations: [fadeInOnEnterAnimation({ duration: 200 }), fadeOutOnLeaveAnimation({ duration: 200 })],
})
export class ResourcesCategoryComponent implements OnInit {
  category: ResursKategorija = {} as ResursKategorija;
	resourcesBc: BreadCrumb[] = [];
	useCleanup: RequestCleanup;
	private destroy = new Subject<void>();
	renderView: boolean = false;
	posts: ResursObjava[] = [];
	ROW_NUMBER = environment.PAGINATION_FORUM_ROW_NUMBER;
	PkCategory: number;
	constructor(private router: Router, public globalVar: GlobalVar, private route: ActivatedRoute, private resourcesBreadcrumbService: ResourcesBreadcrumbService, private resursiService: ResursiService, private appService: AppService) {
		this.router.routeReuseStrategy.shouldReuseRoute = function () {
			return false;
		};
		this.useCleanup = this.appService.useRequestCleanup();
	}
	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.unsubscribe();
	}
	paginator = {
		first: 0,
		totalRecords: 0,
		rows: this.ROW_NUMBER,
	};

	globalSearchForm = new FormGroup({
		search: new FormControl(null, []),
	});
	query: string = null;

	ngOnInit(): void {
		const PkCategory: number = parseInt(this.route.snapshot.params.PkCategory);
		this.PkCategory = PkCategory;
		//Asinkrono zovemo dva apija, jedan za podatke o kategoriji u koju smo usli, drugi za dohvat njenih potkategorija
		this.observeSearch();
		this.fetchData();
	}

	fetchData(query?: string) {
		const apiCalls = [this.resursiService.getResursiKategorije(this.PkCategory), this.resursiService.getResursiPotKategorije({ PkResursKategorija: this.PkCategory, query }), this.resursiService.getResursiObjave({ PkResursKategorije: this.PkCategory, skip: this.paginator.first, take: this.paginator.rows, query })];
		forkJoin(apiCalls).subscribe(
			(data: [ResursKategorija[], ResursKategorija[], ResursObjava[]]) => {
				data[0][0].subCat = data[1];
				this.category = rfdc({ proto: true })(data[0][0]);
				this.posts = rfdc({ proto: true })(data[2]);

				//Postavljanje breadcrumb-a
				this.resourcesBc = this.resourcesBreadcrumbService.setupFormularBreadCrumb(this.category.Naziv, '/resources/category/', [this.category.PkResursKategorija.toString()]);
				this.renderView = true;
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	//Prilikom update-a kategorije moez se promjeniti ime, stoga je potrebno updateati label zadnjeg itema breadcrumbu
	updateResourcesBcLabelOnCategoryUpdate(newName: string): void {
		this.resourcesBc = this.resourcesBreadcrumbService.replaceUpdatedItemLabel(this.resourcesBc, newName);
	}

	observeSearch() {
		this.globalSearchForm.controls.search.valueChanges.pipe(takeUntil(this.destroy), debounceTime(TYPING_DEBOUNCE)).subscribe((query) => {
			this.query = query;
			this.fetchData(query);
		});
	}

	resetSearch(form: FormGroup) {
		form.controls?.search.reset();
	}
	openAdvancedSearchForm() {
		alert('advanced search todo');
	}
}
