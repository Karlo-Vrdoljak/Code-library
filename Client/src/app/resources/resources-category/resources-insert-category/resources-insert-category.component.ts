import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ResursKategorija } from 'src/app/_interfaces/resursi';
import { RequestCleanup } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ResursiService } from 'src/app/_services/resursi.service';

@Component({
  selector: 'app-resources-insert-category',
  templateUrl: './resources-insert-category.component.html',
  styleUrls: ['./resources-insert-category.component.scss']
})
export class ResourcesInsertCategoryComponent implements OnInit {
  //Za mobile view se ide na novu rutu i salje se parent kategorija preko router parametara
  insertToCategory: ResursKategorija = null;
  //Za desktop view se otvara dialog koji injecta ovu komponentu kojoj se prosljeduje PkParentKategorije
  @Input() PkParentKategorije: number = null;
  @Output() insertSuccess: EventEmitter<boolean> = new EventEmitter();
  useCleanup: RequestCleanup;
  addCategoryModel: ResursKategorija = {} as ResursKategorija;
  insertForm = new FormGroup({
    Naziv: new FormControl(null, [Validators.required]),
		Opis: new FormControl(),
	});

  constructor(
    private router: Router,
    private resursiService: ResursiService,
    public translate: TranslateService,
    private appService: AppService
    ) {
    this.insertToCategory = this.router.getCurrentNavigation() && this.router.getCurrentNavigation().extras.state?.category;
    this.useCleanup = this.appService.useRequestCleanup();
  }

  ngOnInit(): void {
    this.PkParentKategorije ? this.setPkParenta(this.PkParentKategorije) : this.setPkParenta(this.insertToCategory?.PkResursKategorija);
  }

  private setPkParenta(PkParent: number) {
    this.addCategoryModel.ParentPk = PkParent;
  }

  public insertCategory() {
    this.addCategoryModel.Naziv = this.insertForm.value.Naziv;
    this.addCategoryModel.Opis = this.insertForm.value.Opis;

    this.useCleanup.isLoading = true;
    this.useCleanup.start().then(() => {
      this.useCleanup.isLoading = false;
    });
    this.resursiService.postResursiKategorija(this.addCategoryModel)
      .subscribe(() => {
        //Desktop view jer se iz desktop viewa salje PkParentKategorije parametar
        //Kod desktopa se emita da li se insert uspjesno zavrsia
        //Kod mobitela se rerouta nazad odakle je dosa
        this.useCleanup.doneToast('CHANGES_SAVED');
        this.useCleanup.done();
        this.useCleanup.isLoading = false;

        if (this.PkParentKategorije) {
          this.insertSuccess.emit(true);
        } else {
          if (this.insertToCategory.ParentPk) { //Ako postoji ParentPk, to znaci da je vec u jednoj od kategorija prve+ razine s toga ga vracamo na kategoriju u koju dodaje
            this.router.navigate(['/resources/category', this.insertToCategory.PkResursKategorija]);

          } else { //Ako je NULL vracamo ga na forum jer se radi o insertu u predefinaru kategoriju nulte razine
            this.router.navigate(['/resources']);
          }
        }
      }, (err) => {
        this.useCleanup.err(err);
        this.useCleanup.isLoading = false;
        if (this.PkParentKategorije) {
          this.insertSuccess.emit(false);
        }
      }, () => { });
  }

  checkValidForm(form: FormGroup) {
		return !form.valid;
	}

}
