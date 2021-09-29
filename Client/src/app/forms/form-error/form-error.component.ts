import { RegexValidators } from './../../_interfaces/types';
import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AppService } from 'src/app/_services/app.service';

@Component({
  selector: 'app-form-error',
  templateUrl: './form-error.component.html',
  styleUrls: ['./form-error.component.scss'],
})
export class FormErrorComponent implements OnInit, AfterViewChecked {
  errorList = [];
  private _error: any;
  get error() {
    return this._error;
  }
  @Input() set error(error) {
    this._error = error;
    this.errorList = this.handleErrors();

  }
  constructor(public appService: AppService, public cdRef: ChangeDetectorRef) {}
  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }
  errorHandler = {
    required: () => ({
      label: 'REQUIRED',
    }),
    passNoMatch: () => ({
      label: 'PASS_NO_MATCH',
    }),
    minlength: () => ({
      label: 'MIN_LENGTH',
    }),
    email: () => ({
      label: 'VALIDATOR_EMAIL',
    }),
    usernameUsed: () => ({
      label: 'USERNAME_USED',
    }),
    numeric: () => ({
      label: 'NUMERIC_VALUE_TYPE',
    }),
    pattern: (key) => {

      switch (this.error[key]?.requiredPattern) {
        case RegexValidators.MOBILE_PHONE:
          return { label: 'MOBILE_PHONE_VALIDATOR' };
        default:
          return { label: 'MOBILE_PHONE_VALIDATOR' };
      }
    },
    emailChangeWarning: () => ({
      label: 'EMAIL_CHANGE_WARNING',
    }),
  };

  handleErrors() {
    if (this.error) {
      return Object.keys(this.error).map((k) => {
        return { ...this.error, ...this.errorHandler[k](k), ...{ key: k } };
      });
    } else {
      return [];
    }
  }

  ngOnInit(): void {}
}
