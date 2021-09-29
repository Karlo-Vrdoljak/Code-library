import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResursKategorija } from 'src/app/_interfaces/resursi';
import { RequestCleanup } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ResursiService } from 'src/app/_services/resursi.service';

@Component({
  selector: 'app-resources-edit-category',
  templateUrl: './resources-edit-category.component.html',
  styleUrls: ['./resources-edit-category.component.scss']
})
export class ResourcesEditCategoryComponent implements OnInit {
  @Input() categoryData: ResursKategorija = null;
  @Input() fromDialog: boolean = false;
  @Output() updateSuccess: EventEmitter<boolean> = new EventEmitter();
  editForm = new FormGroup({
    Naziv: new FormControl(null, [Validators.required]),
    Opis: new FormControl(null, [Validators.required]),
  });
  categoryModel: ResursKategorija = null;
  useCleanup: RequestCleanup;

  constructor(
    private router: Router,
    private appService: AppService,
    private resursiService: ResursiService,
    private builder: FormBuilder) {
    this.categoryData = this.router.getCurrentNavigation() && Object.assign({}, this.router.getCurrentNavigation().extras.state?.category);
    this.useCleanup = this.appService.useRequestCleanup();
  }

  ngOnInit(): void {
    if (this.categoryData) {
      this.editForm = this.builder.group({
        Naziv: this.categoryData.Naziv,
        Opis: this.categoryData.Opis
      });

      this.categoryModel = Object.assign({}, this.categoryData);
    }
  }

  updateCategory() {
    this.categoryModel.Naziv = this.editForm.value.Naziv;
    this.categoryModel.Opis = this.editForm.value.Opis;

    this.useCleanup.isLoading = true;
    this.useCleanup.start().then(() => {
      this.useCleanup.isLoading = false;
    });

    this.resursiService.updateResursiKategorija(this.categoryModel)
      .subscribe(() => {
        this.useCleanup.doneToast('CHANGES_SAVED');
        this.useCleanup.done();
        this.useCleanup.isLoading = false;

        if (this.fromDialog) {
          this.updateSuccess.emit(true);
        } else {
          this.router.navigate(['/resources/category', this.categoryData.PkResursKategorija]);
        }
      }, (err) => {
        this.useCleanup.err(err);
        this.useCleanup.isLoading = false;
        if (this.fromDialog) {
          this.updateSuccess.emit(false);
        }
      }, () => { });
  }

  checkValidForm(form: FormGroup) {
		return !form.valid;
	}

}
