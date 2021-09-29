import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResursObjava } from 'src/app/_interfaces/resursi';
import { RequestCleanup } from 'src/app/_interfaces/types';
import { AppService } from 'src/app/_services/app.service';
import { ResursiService } from 'src/app/_services/resursi.service';

@Component({
  selector: 'app-resources-edit-post',
  templateUrl: './resources-edit-post.component.html',
  styleUrls: ['./resources-edit-post.component.scss']
})
export class ResourcesEditPostComponent implements OnInit {
  @Input() postData: ResursObjava = null;
  @Input() fromDialog: boolean = false;
  @Output() updateSuccess: EventEmitter<boolean> = new EventEmitter();
  editForm = new FormGroup({
    Naslov: new FormControl(null, [Validators.required]),
    Sadrzaj: new FormControl(null, [Validators.required]),
  });
  postModel: ResursObjava = null;
  useCleanup: RequestCleanup;

  constructor(
    private router: Router,
    private appService: AppService,
    private resursiService: ResursiService,
    private builder: FormBuilder) {
    this.postData = this.router.getCurrentNavigation() && Object.assign({}, this.router.getCurrentNavigation().extras.state?.post);
    this.useCleanup = this.appService.useRequestCleanup();
  }

  ngOnInit(): void {
    if (this.postData) {
      this.editForm = this.builder.group({
        Naslov: this.postData.Naslov,
        Sadrzaj: this.postData.Sadrzaj
      });
      
      this.postModel = Object.assign({}, this.postData);
    }
  }

  updatePost() {
    this.postModel.Sadrzaj = this.editForm.value.Sadrzaj;
    this.postModel.Naslov = this.editForm.value.Naslov;

    this.useCleanup.isLoading = true;
    this.useCleanup.start().then(() => {
      this.useCleanup.isLoading = false;
    });

    this.resursiService.updateResursiPost(this.postModel)
      .subscribe(() => {
        this.useCleanup.doneToast('CHANGES_SAVED');
        this.useCleanup.done();
        this.useCleanup.isLoading = false;

        if (this.fromDialog) {
          this.updateSuccess.emit(true);
        } else {
          this.router.navigate(['/resources/post', this.postData.PkResursObjava]);
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
