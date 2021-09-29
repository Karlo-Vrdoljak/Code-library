import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { forkJoin, Subject } from 'rxjs';
import { ResursKategorija, ResursKomentar, ResursObjava } from 'src/app/_interfaces/resursi';
import { AppPrilog, BreadCrumb, EPrimengKeys, Prilog, RequestCleanup, UploadedFile } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ResourcesBreadcrumbService } from 'src/app/_services/resources-breadcrumb.service';
import { ResursiService } from 'src/app/_services/resursi.service';
import { SecurityService } from 'src/app/_services/security.service';
import { Location } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { AddAttachmentComponent } from 'src/app/my-profil/add-attachment/add-attachment.component';
import { EditAttachmentComponent } from 'src/app/my-profil/edit-attachment/edit-attachment.component';
import { ProfileService } from 'src/app/_services/profile.service';
import { environment } from 'src/environments/environment';
import { BreakpointObserver } from '@angular/cdk/layout';
import { GlobalVar } from 'src/app/globalVar';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Komentar } from 'src/app/_interfaces/forum';

@Component({
	selector: 'app-resources-post',
	templateUrl: './resources-post.component.html',
	styleUrls: ['./resources-post.component.scss']
})
export class ResourcesPostComponent implements OnInit {
	resourcesBc: BreadCrumb[] = [];
	postData: ResursObjava = null;
	comments: ResursKomentar[] = [];
	user: any = null;
	readonly PkPost: number = null;
	private destroy = new Subject<void>();
	displayEditPostDialog: boolean = false;
	useCleanup: RequestCleanup;
	prilozi = [] as AppPrilog[];
	displayAddAttachmentDialog = false;
	showPrilozi = false;
	@ViewChild('prilogRef') prilogRef: AddAttachmentComponent;
	@ViewChild('commentPrilogRef') commentPrilogRef: AddAttachmentComponent;
	@ViewChild('replyCommentPrilogRef') replyCommentPrilogRef: AddAttachmentComponent;

	@ViewChild('prilogEditRef') prilogEditRef: EditAttachmentComponent;
	breakPointQuery = '(min-width: 768px)';
	ROW_NUMBER = 6;
	displayEditAttachmentDialog: boolean = false;
	displayAddCommentAttachmentDialog: boolean = false;
	displayAddReplyCommentAttachmentDialog: boolean = false;

	paginatedPrilozi = [] as AppPrilog[];
	paginator = {
		first: 0,
		totalRecords: 0,
	};
	smallScreen: boolean;
	newCommentModel: ResursKomentar = null;
	newReplyCommentModel: ResursKomentar = null;

	displayCommentPriloziPreviewDialog: boolean = false;
	displayReplyCommentPriloziPreviewDialog: boolean = false;
	displayViewCommentAttachmentsDialog: boolean = false;

	//Var sluzi za generiranje dummyPk kako bih omogucili delete iz niza priloga dok korisnik jos nije insertirao komentar
	attachmentDummyPk: number = 0;
	currOpenReplyContainer: number = null;
	currOpenEditCommentContainer: number = null;

	rootCommentForm = new FormGroup({
		Sadrzaj: new FormControl(null, [Validators.required]),
	});

	replyCommentForm = new FormGroup({
		Sadrzaj: new FormControl(null, [Validators.required]),
	});

	editCommentForm = new FormGroup({
		Sadrzaj: new FormControl(null, [Validators.required]),
	});
	currSelectedPreviewPrilozi: { PkComment: number; prilozi: AppPrilog[] } = [] as any;
	editCommentModel: ResursKomentar = null;

	readonly PostClaimData = {
		modulName: environment.UserClaims.eBiblioteka.modulName,
		claimName: environment.UserClaims.eBiblioteka.Datoteka
	} 
	readonly CommentClaimData = {
		modulName: environment.UserClaims.eBiblioteka.modulName,
		claimName: environment.UserClaims.eBiblioteka.Komentar
	} 
	hasPostRights: boolean = false;
	hasCommentRights: boolean = false;

	constructor(
		public breakpoint: BreakpointObserver,
		public confirmationService: ConfirmationService,
		public profileService: ProfileService,
		private resourcesBreadcrumbService: ResourcesBreadcrumbService,
		private route: ActivatedRoute,
		private resursiService: ResursiService,
		public appService: AppService,
		private securityService: SecurityService,
		private router: Router,
		public confrim: ConfirmationService,
		public translate: TranslateService,
		private location: Location,
		public globalVar: GlobalVar,
		private builder: FormBuilder) {
		this.PkPost = parseInt(this.route.snapshot.params.PkPost);
		this.useCleanup = this.appService.useRequestCleanup();
	}

	ngOnDestroy(): void {
		this.destroy.next();
		this.destroy.unsubscribe();
	}

	ngOnInit(): void {
		this.resourcesBc = this.resourcesBreadcrumbService.setupFormularBreadCrumb(this.translate.instant('DATOTEKA'), '/resources/post', [this.PkPost.toString()], true);
		this.hasPostRights = this.securityService.hasRights(this.PostClaimData.modulName, this.PostClaimData.claimName);
		this.hasCommentRights = this.securityService.hasRights(this.CommentClaimData.modulName, this.CommentClaimData.claimName);
		this.fetchData();
	}

	fetchData() {
		this.user = this.securityService.fetchUserDataInLocal();
		const apiCalls = [this.resursiService.getResursiObjave({ PkResursObjave: this.PkPost }), this.resursiService.getResursiKomentari(this.PkPost)];
		this.observeMediaQuery();

		forkJoin(apiCalls).subscribe(
			(data: [ResursObjava[], Promise<ResursKomentar[]>]) => {
				this.postData = data[0][0];
				this.setNewCommentModelDefault();
				this.setNewReplyCommentModelDefault();
				this.getPrilozi();

				data[1].then((c) => {
					this.comments = c;
					this.useCleanup.done();
				});
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	fetchComment(PkResursKomentar: number, PkResursObjava: number) {
		this.resursiService.getResursiKomentar(PkResursKomentar, PkResursObjava).subscribe(
			(data: Promise<ResursKomentar[]>) => {
				data.then((comment: ResursKomentar[]) => {
					const comm = comment[0];
					if (comm.ParentPk) {
						this.comments = this.setInsertedCommentInPlace(this.comments, comm);
					} else {
						this.comments.push(comm);
					}
					this.useCleanup.done();
				});
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	setInsertedCommentInPlace(comments: ResursKomentar[], comment: ResursKomentar) {
		return comments.map((item) => {
			if (item.children.length > 0) {
				item.children = this.setInsertedCommentInPlace(item.children, comment);
			}

			if (item.PkResursKomentar == comment.ParentPk) {
				item.children.push(comment);
			}

			return item;
		});
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

	public setCurrOpenReplyContainer(PkComment: string) {
		this.currOpenReplyContainer = parseInt(PkComment);
	}

	public resetCurrOpenReplyContainer(): void {
		this.currOpenReplyContainer = null;
	}

	public scrollToComment(PkComment: string): void {
		const commentPrefix: string = 'comment-';
		const idSelector: string = commentPrefix + PkComment;
		const el = document.getElementById(idSelector);
		el.scrollIntoView({ behavior: 'smooth' });
	}

	toogleEditDialog() {
		this.displayEditPostDialog = !this.displayEditPostDialog;
	}

	openDeleteDialogConfirmation() {
		this.confrim.confirm({
			header: this.translate.instant('IZBRISITE_OBJAVU') + ' • ' + this.postData.Naslov,
			message: this.translate.instant('BRISANJE_OBJAVE_MESSAGE'),
			icon: 'pi pi-info-circle',
			key: 'deletePost',
			accept: () => {
				this.deletePost(this.postData);
			},
		});
	}

	navigateEditPost() {
		this.router.navigate(['resources/post/edit'], { state: { post: this.postData } });
	}

	onPostUpdateComplete(isSuccessful: boolean) {
		if (isSuccessful) {
			this.getPost();
			this.toogleEditDialog();
		} else {
		}
	}

	getPrilozi() {
		this.resursiService.getResursiObjavaPrilozi({ PkResursObjava: this.postData.PkResursObjava }).subscribe(
			async (prilozi) => {
				for (const prilog of prilozi) {
					if (prilog.coverImage?.PkDatoteka) {
						try {
							prilog.coverImage.src = await this.profileService.getFileDomSafe(prilog.coverImage.path).toPromise();
						} catch (error) {
							prilog.coverImage.src = null;
						}
					}
				}
				this.prilozi = [...prilozi];
				this.initClientSidePaginator(this.prilozi);
				this.paginatedPrilozi = this.setInitialPaginatorPage(this.prilozi);
				this.useCleanup.done();
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	initClientSidePaginator(data: any[]) {
		this.paginator = {
			...this.paginator,
			first: 0,
			totalRecords: data.length,
		};
	}

	setInitialPaginatorPage(data) {
		return data.slice(0, this.ROW_NUMBER);
	}

	paginate({ first, rows }) {
		this.paginatedPrilozi = this.prilozi.slice(first, first + rows);
	}

	getPost() {
		this.resursiService.getResursiObjave({ PkResursObjave: this.PkPost }).subscribe(
			(data: ResursObjava[]) => {
				this.postData = data[0];
				this.getPrilozi();
			},
			(err) => {
				this.useCleanup.err(err);
			}
		);
	}

	toggleAddAttachmentDialog() {
		this.displayAddAttachmentDialog = !this.displayAddAttachmentDialog;
	}

	toggleAddCommentAttachmentDialog() {
		this.displayAddCommentAttachmentDialog = !this.displayAddCommentAttachmentDialog;
	}

	toggleAddReplyCommentAttachmentDialog() {
		this.displayAddReplyCommentAttachmentDialog = !this.displayAddReplyCommentAttachmentDialog;
	}

	handleClosePrilog() {
		this.prilogRef.reset();
	}

	handleCloseCommentPrilog() {
		this.commentPrilogRef.reset();
	}

	handleCloseReplyCommentPrilog() {
		this.replyCommentPrilogRef.reset();
	}

	handleCloseEditPrilog() {
		this.prilogEditRef.reset();
	}

	onSaveAttachment(event) {
		const { CoverImage, file, Naziv, Opis } = event;
		const params = {
			Naziv,
			Opis,
			PkObjava: this.postData.PkResursObjava,
			PkOsobniPodaciPkUsera: this.user.PkUsera,
			// ...(PkForumObjavaKomentar && {PkForumObjavaKomentar}),
			CoverImage,
			file,
		};
		this.resursiService
			.postResursiAttachment(params)
			.pipe(takeUntil(this.destroy))
			.subscribe(
				(result) => {
					this.useCleanup.done();
					this.displayAddAttachmentDialog = false;
					this.getPost();
				},
				(err) => {
					this.useCleanup.err(err);
				}
			);
	}

	checkValidForm(form: FormGroup) {
		return !form.valid;
	}

	onSaveCommentAttachment(event) {
		const { CoverImage, file } = event;
		const datoteka: AppPrilog & UploadedFile = {
			PkOsobniPodaciPkUsera: event.PkOsobniPodaciPkUsera,
			coverImage: { ...event.CoverImage, PkDatoteka: this.attachmentDummyPk },
			prilogDummyPk: this.attachmentDummyPk,
			imageSrc: event.imageSrc,
			datoteka: {
				Naziv: event.Naziv,
				Opis: event.Opis,
				PkDatoteka: event.PkDatoteka,
			} as Prilog,
			CoverImage,
			file,
			PkObjava: null,
			PkResursObjava: this.PkPost
		};
		this.commentPrilogRef.useCleanup.isLoading = false;
		this.newCommentModel.prilozi.push(datoteka);

		this.attachmentDummyPk++;
		this.useCleanup.done();
		this.toggleAddCommentAttachmentDialog();
	}

	onSaveReplyCommentAttachment(event) {
		const { CoverImage, file } = event;

		const datoteka: AppPrilog & UploadedFile = {
			PkOsobniPodaciPkUsera: event.PkOsobniPodaciPkUsera,
			coverImage: { ...event.CoverImage, PkDatoteka: this.attachmentDummyPk },
			prilogDummyPk: this.attachmentDummyPk,
			imageSrc: event.imageSrc,
			datoteka: {
				Naziv: event.Naziv,
				Opis: event.Opis,
				PkDatoteka: event.PkDatoteka,
			} as Prilog,
			CoverImage,
			file,
			PkObjava: null,
			PkResursObjava: this.PkPost
		};
		this.commentPrilogRef.useCleanup.isLoading = false;

		this.newReplyCommentModel.prilozi.push(datoteka);

		this.attachmentDummyPk++;
		this.useCleanup.done();
		this.toggleAddReplyCommentAttachmentDialog();
	}

	saveComment(replyComment: boolean = false) {
		if (replyComment) {
			if (this.useCleanup.isLoading || !this.replyCommentForm.valid) return;
		} else {
			if (this.useCleanup.isLoading || !this.rootCommentForm.valid) return;
		}

		this.useCleanup.isLoading = true;
		this.useCleanup.start();

		const { PkResursObjava, UserUnos, prilozi, ParentPk, Dubina } = replyComment ? this.newReplyCommentModel : this.newCommentModel;

		const { Sadrzaj } = replyComment ? this.replyCommentForm.value : this.rootCommentForm.value;
		const params = {
			PkResursObjava,
			Sadrzaj,
			UserUnos,
			ParentPk,
			Dubina,
			...prilozi.reduce((curr: AppPrilog & UploadedFile, next: AppPrilog & UploadedFile, i) => {
				const { PkOsobniPodaciPkUsera, CoverImage, file, PkResursObjava, coverImage, datoteka, prilogDummyPk } = next;
				const { Naziv: NazivCoverImageMeta, Opis: OpisCoverImageMeta } = coverImage;
				const { Naziv: NazivDatotekaMeta, Opis: OpisDatotekaMeta } = datoteka;
				return {
					...curr,
					...(PkOsobniPodaciPkUsera && { [`PkOsobniPodaciPkUsera.${prilogDummyPk}`]: PkOsobniPodaciPkUsera }),
					...(PkResursObjava && { [`PkResursObjava.${prilogDummyPk}`]: PkResursObjava }),
					...(CoverImage && { [`CoverImage.${prilogDummyPk}`]: CoverImage }),
					...(file && { [`file.${prilogDummyPk}`]: file }),
					...(NazivCoverImageMeta && { [`NazivCoverImageMeta.${prilogDummyPk}`]: NazivCoverImageMeta }),
					...(OpisCoverImageMeta && { [`OpisCoverImageMeta.${prilogDummyPk}`]: OpisCoverImageMeta }),
					...(NazivDatotekaMeta && { [`NazivDatotekaMeta.${prilogDummyPk}`]: NazivDatotekaMeta }),
					...(OpisDatotekaMeta && { [`OpisDatotekaMeta.${prilogDummyPk}`]: OpisDatotekaMeta }),
					[`prilogDummyPk.${prilogDummyPk}`]: prilogDummyPk,
				};
			}, {} as AppPrilog & UploadedFile),
		};
		this.resursiService.postResursiComment(params).subscribe(
			(result) => {
				this.useCleanup.isLoading = false;
				this.fetchComment(result.PkResursKomentar, this.postData.PkResursObjava);
				// this.fetchData();
				this.rootCommentForm.reset();
				this.replyCommentForm.reset();
				replyComment ? this.setNewReplyCommentModelDefault() : this.setNewCommentModelDefault();
				this.attachmentDummyPk = 0;
				if (replyComment) this.currOpenReplyContainer = null;
			},
			(err) => {
				this.useCleanup.isLoading = false;
				this.useCleanup.err(err);
			}
		);
	}

	handleOnEditReq({ datoteka }) {
		this.prilogEditRef.setComponentWorkMode({ user: { PkOsobniPodaciPkUsera: this.user.PkUsera }, datoteka, mode: 'edit' });
		this.displayEditAttachmentDialog = true;
	}

	handleOnDeleteReq({ datoteka }) {
		this.onDeleteClickAttachment({ datoteka });
	}

	onSaveEditAttachment(event) {
		const { Opis, Naziv, PkDatoteka } = event;
		this.displayEditAttachmentDialog = false;
		this.useCleanup.start();
		// ukoliko je displayViewCommentAttachmentsDialog znamo da smo u previewu priloga od komentara
		if (this.displayViewCommentAttachmentsDialog) {
			this.handleEditCommentAttachment(event);
			this.useCleanup.done();
		} else {
			this.getPost();
		}
	}

	//Prilikom edita attachmenta komentara pronalazimo editani att. i postavljamo ga na novu (editanu) vrijednost
	//kako ne bih trebali dohvacati sve komentare i priloge na update jednog od priloga
	private handleEditCommentAttachment(editedAttachment: { Naziv: string; Opis: string; PkDatoteka: number; mode: string }) {
		this.comments = this.recursivePriloziEdit(this.comments, this.currSelectedPreviewPrilozi.PkComment, editedAttachment);
	}

	//Prilikom brisanja attachmenta komentara pronalazimo izbrisani att. i micemo ga iz niza
	//kako ne bih trebali dohvacati sve komentare i priloge na delete jednog od priloga
	private handleDeleteCommentAttachment(pkDatoteka: number) {
		//Brisanje iz niza koji saljemo preview komponenti
		this.currSelectedPreviewPrilozi.prilozi = this.currSelectedPreviewPrilozi.prilozi.filter((pr) => pr.datoteka.PkDatoteka !== pkDatoteka);

		//Brisanje iz tree komentara koji su dosli sa servera
		this.comments = this.recursivePriloziRemove(this.comments, this.currSelectedPreviewPrilozi.PkComment, pkDatoteka);
	}

	private recursivePriloziRemove(comments: ResursKomentar[], pkKomentar: number, pkDatoteka: number) {
		return comments.map((item) => {
			if (item.children.length > 0) {
				item.children = this.recursivePriloziRemove(item.children, pkKomentar, pkDatoteka);
			}

			if (item.prilozi) {
				item.prilozi = item.prilozi.filter((pr) => pr.datoteka.PkDatoteka !== pkDatoteka);
			}
			return item;
		});
	}

	private recursivePriloziEdit(comments: ResursKomentar[], pkKomentar: number, editedAttachment: { Naziv: string; Opis: string; PkDatoteka: number; mode: string }) {
		return comments.map((item) => {
			if (item.children.length > 0) {
				item.children = this.recursivePriloziEdit(item.children, pkKomentar, editedAttachment);
			}

			if (item.prilozi) {
				item.prilozi = item.prilozi.map((pr) => {
					if (pr.datoteka.PkDatoteka === editedAttachment.PkDatoteka) {
						pr.datoteka.Naziv = editedAttachment.Naziv;
						pr.datoteka.Opis = editedAttachment.Opis;
					}
					return pr;
				});
			}
			return item;
		});
	}

	onDeleteClickAttachment({ datoteka }) {
		const { Naziv, PkDatoteka } = datoteka;
		this.translate.get(['DELETE_HEADER', 'DELETE_DESC', 'ACCEPT', 'NO_TY']).subscribe((t) => {
			this.confirmationService.confirm({
				key: EPrimengKeys.globalConfirm,
				header: `${t.DELETE_HEADER}, ${Naziv}`,
				message: t.DELETE_DESC,
				acceptLabel: t.ACCEPT,
				rejectLabel: t.NO_TY,
				icon: 'pi pi-exclamation-circle',
				accept: () => {
					this.useCleanup.start();
					this.profileService
						.deletePrilog({ PkDatoteka })
						.pipe(takeUntil(this.destroy))
						.subscribe(
							(result) => {
								//Delete priloga iz komentara, raspoznajemo da se radi o deletu priloga komentara
								//jer mu je displayViewCommentAttachmentsDialog = true za preview u kojem je omogucen delete
								if (this.displayViewCommentAttachmentsDialog) {
									this.handleDeleteCommentAttachment(PkDatoteka);
								} else {
									this.getPost();
								}
								this.useCleanup.done();
							},
							(err) => {
								this.useCleanup.err(err);
							}
						);
				},
				reject: () => { },
			});
		});
	}

	private setNewCommentModelDefault(): void {
		this.newCommentModel = {
			Sadrzaj: null,
			PkUseraUnos: this.user?.PkUsera,
			UserUnos: this.user?.ImePrezimeUsera,
			PkResursObjava: this.postData.PkResursObjava,
			ParentPk: null,
			Dubina: null,
			prilozi: [],
		} as ResursKomentar;
	}

	setNewReplyCommentModelDefault(dubina: number = null, parentPk: number = null) {
		this.newReplyCommentModel = {
			Sadrzaj: null,
			PkUseraUnos: this.user?.PkUsera,
			UserUnos: this.user?.ImePrezimeUsera,
			PkResursObjava: this.postData.PkResursObjava,
			ParentPk: parentPk,
			Dubina: dubina ? ++dubina : 1,
			prilozi: [],
		} as ResursKomentar;
	}

	public openCommentPriloziPreviewDialog(replyComment: boolean = false): void {
		if (replyComment) {
			if (this.newReplyCommentModel.prilozi.length > 0) {
				this.displayReplyCommentPriloziPreviewDialog = true;
			} else {
				this.useCleanup.warn(this.translate.instant('NEMA_PRILOGA_ZA_POKAZATI'));
			}
		} else {
			if (this.newCommentModel.prilozi.length > 0) {
				this.displayCommentPriloziPreviewDialog = true;
			} else {
				this.useCleanup.warn(this.translate.instant('NEMA_PRILOGA_ZA_POKAZATI'));
			}
		}
	}

	public handleCloseCommentPrilogPreview(): void {
		this.displayCommentPriloziPreviewDialog = false;
	}

	public handleCloseReplyCommentPrilogPreview(): void {
		this.displayReplyCommentPriloziPreviewDialog = false;
	}

	//Handlanje klijent side delet-a prije nego je korisnik uopce objavia komentar s prilozima
	handleOnDeleteCommentPrilog(event) {
		this.newCommentModel.prilozi = this.newCommentModel.prilozi.filter((p) => p.prilogDummyPk !== event.prilogDummyPk);
	}

	//Handlanje kljent side delet-a za reply komentare prije nego je korisnik objavio komentar
	handleOnDeleteReplyCommentPrilog(event) {
		this.newReplyCommentModel.prilozi = this.newReplyCommentModel.prilozi.filter((p) => p.prilogDummyPk !== event.prilogDummyPk);
	}

	public toogleDisplayViewCommentAttachmentsDialog(): void {
		this.displayViewCommentAttachmentsDialog = !this.displayViewCommentAttachmentsDialog;
	}

	public handleCloseViewCommentAttachmentsDialog(): void {
		this.displayViewCommentAttachmentsDialog = false;
	}

	public currSelectedPreviewPriloziRead(pkKomentar: number, pr: AppPrilog[]): void {
		this.currSelectedPreviewPrilozi.PkComment = pkKomentar;
		this.currSelectedPreviewPrilozi.prilozi = pr;
	}

	public setEditCommentModel(comment: ResursKomentar): void {
		this.editCommentModel = comment;

		this.editCommentForm = this.builder.group({
			Sadrzaj: this.editCommentModel.Sadrzaj,
		});
	}

	public setCurrOpenEditCommentContainer(PkComment: string) {
		this.currOpenEditCommentContainer = parseInt(PkComment);
	}

	openDeleteCommentDialogConfirmation(comment: ResursKomentar) {
		this.confrim.confirm({
			message: this.translate.instant('BRISANJE_KOMENTAR_MESSAGE'),
			icon: 'pi pi-info-circle',
			key: 'deleteComment',
			accept: () => {
				this.deleteComment(comment);
			},
		});
	}

	private deleteComment(comment: ResursKomentar): void {
		this.useCleanup.isLoading = true;
		this.useCleanup.start();

		this.resursiService.deleteComment(comment.PkResursKomentar).subscribe(() => {
			this.deletePrilogeForComment(comment);
			this.comments = this.setDeletedCommentInPlace(this.comments, comment.PkResursKomentar);
		}, err => {
			this.useCleanup.isLoading = false;
			this.useCleanup.err(err);
			this.useCleanup.done();
		});
	}

	private deletePrilogeForComment(comment: ResursKomentar): void {
		if (comment.prilozi && comment.prilozi.length > 0) {
			const PkDatotekaArr: number[] = comment.prilozi.map(pr => {
				return pr.datoteka.PkDatoteka;
			});

			const apiCalls = [];

			PkDatotekaArr.forEach(PkDatoteka => apiCalls.push(this.profileService.deletePrilog({ PkDatoteka })));

			forkJoin(apiCalls)
				.pipe(takeUntil(this.destroy))
				.subscribe(() => {
					comment.prilozi = [];
					this.useCleanup.isLoading = false;
					this.useCleanup.done();
				}, (err) => {
					this.useCleanup.isLoading = false;
					this.useCleanup.err(err);
					this.useCleanup.done();
				});
		} else {
			this.useCleanup.isLoading = false;
			this.useCleanup.done();
		}
	}

	setEditedCommentInPlace(comments: ResursKomentar[], comment: ResursKomentar) {
		return comments.map((item) => {
			if (item.children.length > 0) {
				item.children = this.setEditedCommentInPlace(item.children, comment);
			}

			if (item.PkResursKomentar == comment.PkResursKomentar) {
				item.Sadrzaj = comment.Sadrzaj;
				item.DatumZadnjePromjene = comment.DatumZadnjePromjene;
			}

			return item;
		});
	}

	setDeletedCommentInPlace(comments: ResursKomentar[], PkComment: number) {
		return comments.map((item) => {
			if (item.children.length > 0) {
				item.children = this.setDeletedCommentInPlace(item.children, PkComment);
			}

			if (item.PkResursKomentar == PkComment) {
				item.IzbrisanDaNe = 1;
			}

			return item;
		});
	}

	public resetCurrOpenEditCommentContainer(): void {
		this.currOpenEditCommentContainer = null;
	}

	public editComment(): void {
		this.editCommentModel.Sadrzaj = this.editCommentForm.value.Sadrzaj;

		this.useCleanup.isLoading = true;
		this.useCleanup.start();

		this.resursiService.updateComment(this.editCommentModel).subscribe(() => {
			this.currOpenEditCommentContainer = null;
			this.editCommentForm.reset();
			this.useCleanup.isLoading = false;
			this.fetchCommentBezPrilog(this.editCommentModel.PkResursKomentar, this.postData.PkResursObjava);
		}, err => {
			this.useCleanup.isLoading = false;
			this.useCleanup.err(err);
			this.useCleanup.done();
		});
	}

	fetchCommentBezPrilog(PkKomentar: number, PkObjava: number): void {
		this.resursiService.getKomentarBezPriloga(PkKomentar, PkObjava).subscribe(
			(data: ResursKomentar[]) => {
				this.comments = this.setEditedCommentInPlace(this.comments, data[0]);
				this.useCleanup.done();
			},
			(err) => {
				this.useCleanup.err(err);
				this.useCleanup.done();
			}
		);
	}

	private deletePost(post: ResursObjava): void {
		this.useCleanup.isLoading = true;
		this.useCleanup.start();

		this.resursiService.deleteResursiPost(post.PkResursObjava).subscribe(() => {
			this.deletePrilogeForPost();
		}, err => {
			this.useCleanup.isLoading = false;
			this.useCleanup.err(err);
			this.useCleanup.done();
		});
	}

	private deletePrilogeForPost(): void {
		if (this.prilozi && this.prilozi.length > 0) {
			const PkDatotekaArr: number[] = this.prilozi.map(pr => {
				return pr.datoteka.PkDatoteka;
			});

			const apiCalls = [];

			PkDatotekaArr.forEach(PkDatoteka => apiCalls.push(this.profileService.deletePrilog({ PkDatoteka })));

			forkJoin(apiCalls)
				.pipe(takeUntil(this.destroy))
				.subscribe(() => {
					this.location.back();
					this.useCleanup.isLoading = false;
					this.useCleanup.done();
				}, (err) => {
					this.useCleanup.isLoading = false;
					this.useCleanup.err(err);
					this.useCleanup.done();
				});
		} else {
			this.location.back();
			this.useCleanup.isLoading = false;
			this.useCleanup.done();
		}
	}
}
