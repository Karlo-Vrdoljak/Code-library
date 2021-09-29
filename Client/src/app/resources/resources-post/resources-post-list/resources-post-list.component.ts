import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Subject } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { GlobalVar } from 'src/app/globalVar';
import { AddAttachmentComponent } from 'src/app/my-profil/add-attachment/add-attachment.component';
import { ResursKategorija, ResursObjava } from 'src/app/_interfaces/resursi';
import { Pretplata, RequestCleanup } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { PretplateService } from 'src/app/_services/pretplate.service';
import { ResursiService } from 'src/app/_services/resursi.service';
import { RouteEventsService } from 'src/app/_services/route-events.service';
import { SecurityService } from 'src/app/_services/security.service';
import { ThemingService } from 'src/app/_services/theming.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-resources-post-list',
	templateUrl: './resources-post-list.component.html',
	styleUrls: ['./resources-post-list.component.scss']
})
export class ResourcesPostListComponent implements OnInit {
	readonly pretplataConfig = {
		modul: 'E-BIBLIOTEKA',
		segment: 'KATEGORIJA'
	};

	displayAddPostDialog: boolean = false;
	useCleanup: RequestCleanup;
	@Input() currCategory: ResursKategorija = null;

	private _posts: ResursObjava[] = null;

	get posts(): ResursObjava[] {
		return this._posts;
	}
	@Input() set posts(value: ResursObjava[]) {
		this._posts = value;
		const [first] = value;
		if (first) {
			var { TotalRecords } = first;
		} else {
			var TotalRecords = 0;
		}

		this.setPaginator({ first: 0, totalRecords: TotalRecords });
	}
	ROW_NUMBER: number = environment.PAGINATION_FORUM_ROW_NUMBER;
	@Input() paginator: {
		first: number;
		totalRecords: number;
		rows: number;
	} = {
			first: 0,
			totalRecords: 0,
			rows: this.ROW_NUMBER,
		};
	@Input() query: string = null;

	private destroy = new Subject<void>();
	pretplataData: Pretplata = null;
	lsPretplateData: any = null;

	readonly claimData = {
		modulName: environment.UserClaims.eBiblioteka.modulName,
		claimName: environment.UserClaims.eBiblioteka.Datoteka
	}
	hasPostRights: boolean = false;
	userData: any = null;

	constructor(
		public breakpoint: BreakpointObserver,
		public appService: AppService,
		private router: Router,
		public themingService: ThemingService,
		private resursiService: ResursiService,
		private pretplateService: PretplateService,
		private translate: TranslateService,
		private globalVar: GlobalVar,
		private routeEventsService: RouteEventsService,
		private securityService: SecurityService
	) {
		this.useCleanup = this.appService.useRequestCleanup();
	}
	breakPointQuery = '(min-width: 768px)';
	smallScreen: boolean;

	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.complete();
	}
	ngOnInit(): void {
		const [objava] = this.posts;
		const { TotalRecords } = objava ?? { TotalRecords: 0 };
		this.observeMediaQuery();
		this.setPaginator({ first: 0, totalRecords: TotalRecords });
		this.userData = this.securityService.fetchUserDataInLocal();

		if (this.userData) this.setPretplataData();

		this.hasPostRights = this.securityService.hasRights(this.claimData.modulName, this.claimData.claimName);

	}

	navigateToPost(pkPost: number) {
		this.appendToVisitedPosts(pkPost);
		this.router.navigate(['resources/post', pkPost]);
	}

	toogleInsertDialog() {
		this.displayAddPostDialog = !this.displayAddPostDialog;
	}

	navigateAddPost() {
		this.router.navigate(['/resources/post/add-new'], { state: { category: this.currCategory } });
	}

	onPostInsertComplete(isSuccessful: boolean) {
		if (isSuccessful) {
			this.getPosts(this.paginator);
			this.toogleInsertDialog();
		}
	}

	getPosts({ first = 0, rows = this.ROW_NUMBER }): void {
		this.useCleanup.startBg();
		this.resursiService.getResursiObjave({ PkResursKategorije: this.currCategory.PkResursKategorija, skip: first, take: rows }).subscribe(
			(data) => {
				this.posts = data;
				const [objava] = data;
				const { TotalRecords } = objava;
				this.setPaginator({ first, totalRecords: TotalRecords });
				this.useCleanup.doneBg();
				this.appService.scrollTo('paginator-begin-anchor');
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	setPaginator({ first, totalRecords }) {
		this.paginator = {
			...this.paginator,
			first,
			totalRecords,
		};
	}

	observeMediaQuery() {
		// this.applyMediaQueryChanges({ matches: this.breakpoint.isMatched(this.breakPointQuery) });
		this.breakpoint
			.observe(this.breakPointQuery)
			.pipe(takeUntil(this.destroy))
			.subscribe((state) => this.applyMediaQueryChanges(state));
	}

	applyMediaQueryChanges(state) {
		this.smallScreen = !state.matches;
	}

	paginate(ev) {
		const { first, rows } = ev;
		this.getPosts({ first, rows });
	}


	pretplatiKorisnikaNaForumKategoriju() {
		const params = this.setPretplataParams();
		this.useCleanup.startBg();

		this.pretplateService.userPretplataInsert(params).subscribe((data: Pretplata[]) => {
			this.pretplataData = data[0];
			this.useCleanup.doneBg();
			this.appService.prikaziToast('success', this.translate.instant("USPJEH_PRETPLATA_HEADER"), `${this.translate.instant("USPJEH_PRETPLATA_MSG")} ${this.currCategory.Naziv}`, this.globalVar.trajanjeErrAlert, 'globalToast', null);
		}, (err) => {
			this.useCleanup.err(err);
		})
	}

	otkaziPretplatuKorisnikaNaForumKategoriju() {
		this.pretplateService.userPretplataDelete({ PkPretplate: this.pretplataData.PkPretplate }).subscribe((data) => {
			this.pretplataData = null;
			this.useCleanup.doneBg();
			this.useCleanup.doneToast('USPJEH_PRETPLATA_OTKAZANA');
		}, (err) => {
			this.useCleanup.err(err);
		})
	}

	//Funkcija dohvaca pretplatu za korisnika i ukoliko je ima updatea datumZadnjeProvjere
	setPretplataData(): void {
		const params = this.setPretplataParams();
		this.useCleanup.startBg();

		this.pretplateService.checkUserPretplata(params)
			.pipe(
				mergeMap((data: Pretplata[]) => {
					if (data && data.length > 0) {
						this.pretplataData = data[0];
						this.manageLastVisitedPretplata();
						this.setLocalStoragePretplataData();
						return this.pretplateService.updateDatumZadnjeProvjere({ PkPretplate: this.pretplataData.PkPretplate });
					} else {
						return EMPTY;
					}
				}),
				takeUntil(this.destroy))
			.subscribe(
				(data) => {
					this.useCleanup.doneBg();
				},
				(err) => {
					this.useCleanup.err(err);
				});
	}

	setPretplataParams(): { modul: string, segment: string, pk: number } {
		return {
			modul: this.pretplataConfig.modul,
			segment: this.pretplataConfig.segment,
			pk: this.currCategory.PkResursKategorija
		}
	}

	//Funkcija postavlja u local storage lastVisitedPretplata ukoliko je korisnik dosa s bilo koje rute osin 'forum/post/'
	private manageLastVisitedPretplata(): void {
		const searchRoute: string = 'resources/post';

		if (!(this.routeEventsService.getPreviousRoutePath()).toLocaleUpperCase().includes(searchRoute.toUpperCase())) {
			//U local storage postavljamo pretplateData i prazni niz pogledanih postova koji ce se punit s PkObjave
			localStorage.setItem('lastVisitedPretplata', JSON.stringify({ ...this.pretplataData, visitedPosts: [] }));
		}
	}

	private setLocalStoragePretplataData(): void {
		this.lsPretplateData = JSON.parse(localStorage.getItem('lastVisitedPretplata'));
	}

	private appendToVisitedPosts(PkPost: number): void {
		let lsPretplataData = JSON.parse(localStorage.getItem('lastVisitedPretplata'));
		if (lsPretplataData === null) {
			lsPretplataData = { visitedPosts: [] };
		}
		lsPretplataData.visitedPosts.push(PkPost);
		localStorage.setItem('lastVisitedPretplata', JSON.stringify(lsPretplataData));
	}

	//Funkcija provjerava da li se radi o novom postu i vraca true ukoliko je, false ukoliko nije
	public checkIsPostNew(post: ResursObjava): boolean {
		if (this.lsPretplateData) {
			return (post.DatumUnosa > this.lsPretplateData.DatumZadnjeProvjere && !this.lsPretplateData.visitedPosts.includes(post.PkResursObjava));
		} else {
			return false;
		}
	}
}
