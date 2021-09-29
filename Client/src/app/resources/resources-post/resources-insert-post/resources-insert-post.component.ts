import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { GlobalVar } from 'src/app/globalVar';
import { AddAttachmentComponent } from 'src/app/my-profil/add-attachment/add-attachment.component';
import { ResursKategorija, ResursObjava } from 'src/app/_interfaces/resursi';
import { AppPrilog, Prilog, RequestCleanup, UploadedFile } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ResursiService } from 'src/app/_services/resursi.service';
import { SecurityService } from 'src/app/_services/security.service';

@Component({
  selector: 'app-resources-insert-post',
  templateUrl: './resources-insert-post.component.html',
  styleUrls: ['./resources-insert-post.component.scss']
})
export class ResourcesInsertPostComponent implements OnInit {
  //Za mobile view se ide na novu rutu i salje se parent kategorija preko router parametara
  insertToCategory: ResursKategorija = null;
  addPostModel: ResursObjava = null;
  useCleanup: RequestCleanup;
  user: any = null;
  displayPriloziPreviewDialog: boolean = false;
  //Var sluzi za generiranje dummyPk kako bih omogucili delete iz niza priloga dok korisnik jos nije insertirao komentar
  attachmentDummyPk: number = 0;
  //Za desktop view se otvara dialog koji injecta ovu komponentu kojoj se prosljeduje PkKategorije
  @Input() PkKategorije: number = null;
  @Output() insertSuccess: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('prilogRef') prilogRef: AddAttachmentComponent;
	
  insertForm = new FormGroup({
    Naslov: new FormControl(null, [Validators.required]),
		Sadrzaj: new FormControl(null, [Validators.required]),
	});

  constructor(
    private router: Router,
    public appService: AppService,
    private resursiService: ResursiService,
    private securityService: SecurityService,
    public translate: TranslateService,
    public globalVar: GlobalVar) {
    this.insertToCategory = this.router.getCurrentNavigation() && this.router.getCurrentNavigation().extras.state?.category;
    this.useCleanup = this.appService.useRequestCleanup();
  }

  ngOnInit(): void {
    this.user = this.securityService.fetchUserDataInLocal();
    this.setPostModelDefault();
  }

  public insertPost() {
    this.addPostModel.Sadrzaj = this.insertForm.value.Sadrzaj;
    this.addPostModel.Naslov = this.insertForm.value.Naslov;

    this.useCleanup.isLoading = true;
    this.useCleanup.start();

    const { PkResursKategorija, prilozi, Naslov, Sadrzaj, PkUseraUnos } = this.addPostModel;

    const params = {
      PkResursKategorija,
      Sadrzaj,
      Naslov,
      PkUseraUnos,
      ...prilozi.reduce((curr: AppPrilog & UploadedFile, next: AppPrilog & UploadedFile, i) => {
        const { PkOsobniPodaciPkUsera, CoverImage, file, PkObjava, coverImage, datoteka, prilogDummyPk } = next;
        const { Naziv: NazivCoverImageMeta, Opis: OpisCoverImageMeta } = coverImage;
        const { Naziv: NazivDatotekaMeta, Opis: OpisDatotekaMeta } = datoteka;
        return {
          ...curr,
          ...(PkOsobniPodaciPkUsera && { [`PkOsobniPodaciPkUsera.${prilogDummyPk}`]: PkOsobniPodaciPkUsera }),
          ...(PkObjava && { [`PkObjava.${prilogDummyPk}`]: PkObjava }),
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

    this.resursiService.postResursiObjava(params).subscribe(
      (result) => {
        this.setPostModelDefault();
        this.useCleanup.doneToast('CHANGES_SAVED');
        this.useCleanup.isLoading = false;
        this.useCleanup.done();
        this.attachmentDummyPk = 0;
        //Ukoliko postoji PkKategorije znaci da dolazi iz desktopa (modalni dialog), u suprotnom dolazi s mobitela(nova ruta), pa ga treba vratiti
        if (this.PkKategorije) {
          this.insertSuccess.emit(true);
        } else {
          this.router.navigate(['/resources/category', this.insertToCategory.PkResursKategorija]);
        }
      },
      (err) => {
        this.useCleanup.isLoading = false;
        this.useCleanup.done();
        this.useCleanup.err(err);
        if (this.PkKategorije) {
          this.insertSuccess.emit(false);
        }
      }
    );
  }

  onSaveAttachment(event) {
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
      PkResursObjava: null,
    };

    this.prilogRef.useCleanup.isLoading = false;
    this.prilogRef.reset();
    this.addPostModel.prilozi.push(datoteka);

    this.attachmentDummyPk++;
    this.useCleanup.done();
  }

  setPostModelDefault(): void {
    this.addPostModel = {
      PkResursObjava: null,
      Naslov: null,
      Sadrzaj: null,
      PkUseraUnos: this.user.PkUsera,
      UserUnos: this.user.ImePrezimeUsera,
      PkResursKategorija: this.insertToCategory ? this.insertToCategory.PkResursKategorija : this.PkKategorije,
      prilozi: [],
    } as ResursObjava;
  }

  public openPriloziPreviewDialog(): void {
    if (this.addPostModel.prilozi.length > 0) {
      this.displayPriloziPreviewDialog = true;
    } else {
      this.useCleanup.warn(this.translate.instant('NEMA_PRILOGA_ZA_POKAZATI'));
    }
  }

  public handleCloseCommentPrilogPreview(): void {
    this.displayPriloziPreviewDialog = false;
  }

  //Handlanje kljent side delet-a za reply komentare prije nego je korisnik objavio komentar
  public handleOnDeletePrilog(event): void {
    this.addPostModel.prilozi = this.addPostModel.prilozi.filter((p) => p.prilogDummyPk !== event.prilogDummyPk);
  }

  checkValidForm(form: FormGroup) {
		return !form.valid;
	}

}
