import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Subject } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AdministracijaUser, LogAdministracijaUser, BreadCrumb, RequestCleanup, UserClaims, VrstaClanstva } from '../_interfaces/types';
import { AdministracijaService } from '../_services/administracija.service';
import { AppService } from '../_services/app.service';
import { BreadcrumbBuilder } from '../_services/breadcrumb.builder';
import { ExcelService } from '../_services/excel.service';
import { ProfileService } from '../_services/profile.service';

@Component({
  selector: 'app-administracija',
  templateUrl: './administracija.component.html',
  styleUrls: ['./administracija.component.scss']
})
export class AdministracijaComponent implements OnInit {
  administracijaBc: BreadCrumb[] = [];

  renderView: boolean = false;
  useCleanup: RequestCleanup;

  vrsteClanstva: VrstaClanstva[] = [];
  users: AdministracijaUser[] = [];
  logData: LogAdministracijaUser[] = [];

  constructor(
    private profileService: ProfileService,
    private appService: AppService,
    private administracijaService: AdministracijaService,
    private translate: TranslateService,
    private excelService: ExcelService
  ) {
    this.useCleanup = this.appService.useRequestCleanup();
  }

  async ngOnInit() {
    try {
      this.setAdministracijaBreadCrumb();
      const initData = await this.getInitData();
      this.vrsteClanstva = this.removeAnonimniFromVrsteClanstva(initData[0]);
      this.users = initData[1];
      this.setRenderView(true);
      this.getLogOsobniPodaci();
    } catch (err) {
      this.useCleanup.doneBg();
      this.useCleanup.err(err);
    }

  }

  private setAdministracijaBreadCrumb(): void {
    this.administracijaBc = new BreadcrumbBuilder()
      .addNew({ label: 'POCETNA', link: '/home' })
      .addNew({ label: 'ADMINISTRACIJA', link: '/administration' })
      .build();
  }

  private getInitData() {
    const apiCalls = [this.profileService.getVrstaClanstvaAll(), this.administracijaService.getUsers()];

    return new Promise((resolve, reject) => {
      this.useCleanup.startBg();

      forkJoin(apiCalls).subscribe((data) => {
        this.useCleanup.doneBg();
        resolve(data);
      }, (err) => {
        reject(err);
      });
    });
  }

  private getLogOsobniPodaci() {
    const params = {
      PkUsera: null
    };
    this.administracijaService.getLogOsobniPodaci(params).subscribe((data: any) => {
      this.logData = data;
    }, err => {
      console.log(err)
      this.useCleanup.err(err);
    });
  }

  private setRenderView(value: boolean): void {
    this.renderView = value;
  }

  private removeAnonimniFromVrsteClanstva(vc: VrstaClanstva[]): VrstaClanstva[] {
    return vc.filter(v => v.PkVrstaClanstva !== environment.vrsteClanstvaPk.ANONIMNI);
  }

  public updateUserClaims(user: AdministracijaUser): void {
    //Ukoliko je korisnik administrator automatski su mu svi claimovi postavljeni na true i ne smiju se mijenjati
    if (user.AdministratorDaNe) return;
    
    const params = {
      PkUsera: user.PkUsera,
      Claims: user.Claims,
      RowVersion: user.RowVersion
    };

    this.administracijaService.updateUserClaims(params).subscribe((data: { RowVersion: string, Claims: UserClaims }) => {
      user.Claims = data.Claims;
      user.RowVersion = data.RowVersion;

      this.useCleanup.doneToast('CHANGES_SAVED');
    }, err => {
      console.log(err)
      this.useCleanup.err(err);
    });

  }

  public updateUserStatus(user: AdministracijaUser): void {
    const statusKorisnika = user.Blokiran ? environment.StatusKorisnikaDef.Blokiran : environment.StatusKorisnikaDef.Aktivan;

    const params = {
      PkUsera: user.PkUsera,
      StatusKorisnika: statusKorisnika,
      RowVersion: user.RowVersion
    }

    this.administracijaService.updateUserStatus(params).subscribe((data: { RowVersion: string }) => {
      user.RowVersion = data.RowVersion;
      user.StatusKorisnika = statusKorisnika;
      this.useCleanup.doneToast('CHANGES_SAVED');
    }, err => {
      user.Blokiran = !user.Blokiran;
      console.log(err)
      this.useCleanup.err(err);
    });
  }

  public updateUserApplicationGroup(user: AdministracijaUser): void {
    //Postoje samo dvije grupe s toga na osnovu checkboxa da li je admin postavljamo pk grupe
    const PkAppGroup = user.AdministratorDaNe ? environment.userApplicationGroupsPk.Admin : environment.userApplicationGroupsPk.OsnovnaPrava;

    const params = {
      PkUsera: user.PkUsera,
      PkGrupa: PkAppGroup,
    }

    //Ukolik osmo postavili korisniak za admina, automatski mi dodjeljujemo u updateamo sva prava
    this.administracijaService.updateUserApplicationGroup(params)
      .pipe(
        mergeMap(res => {
          user.PkApplicationUserGroup = PkAppGroup;

          const us = user.AdministratorDaNe ? this.setAllClaimsToTrue(user) : user;

          const params = {
            PkUsera: us.PkUsera,
            Claims: us.Claims,
            RowVersion: us.RowVersion
          };

          return this.administracijaService.updateUserClaims(params);
        })
      )
      .subscribe((data) => {
        user.Claims = data.Claims;
        user.RowVersion = data.RowVersion;

        this.useCleanup.doneToast('CHANGES_SAVED');
      }, err => {
        user.AdministratorDaNe = !user.AdministratorDaNe;
        console.log(err)
        this.useCleanup.err(err);
      });
  }

  public updateUserVrstaClanstva(user: AdministracijaUser): void {
    const params = {
      PkUsera: user.PkUsera,
      PkVrstaClanstva: user.PkVrstaClanstva,
    }

    this.administracijaService.updateUserVrstaClanstva(params).subscribe((data) => {
      this.useCleanup.doneToast('CHANGES_SAVED');
    }, err => {
      console.log(err)
      this.useCleanup.err(err);
    });
  }

  private setAllClaimsToTrue(us: AdministracijaUser): AdministracijaUser {
    Object.keys(us.Claims).forEach(modul => {
      Object.keys(us.Claims[modul]).forEach(claim => {
        us.Claims[modul][claim] = true;
      });
    });

    return us;
  }

  public exportUsersToExcel() {
    try {
      this.useCleanup.start();

      const title: string = this.translate.instant('ADMINISTRACIJA');
      const worksheetName: string = this.translate.instant('ADMINISTRACIJA');
      const headerModulLabels: string[] = this.excelService.getHeaderModulLabelsForAdministracijaExport();
      const headerLabels: string[] = this.excelService.getHeaderLabelsForAdministracijaExport();
			const dataToExport: any[][] = this.excelService.getDataForAdministracijaExport(this.users);
			
			const wb = this.excelService.generateAdministracijaExcel(title, worksheetName, headerModulLabels, headerLabels, dataToExport);
			this.excelService.exportExcelFile(wb, this.translate.instant('ADMINISTRACIJA') + '_' + this.excelService.getTodaysDateForFileName() + '.xlsx');
			
			this.useCleanup.done();

		} catch (err) {
			this.useCleanup.err(err);
			this.useCleanup.done();
		}
	}

  public exportLogsToExcel() {
		// try {
		// 	this.useCleanup.start();
			
		// 	const title: string = this.translate.instant('LOGPRISTUPAOSOBNIMPODACIMA');
		// 	const worksheetName: string = this.translate.instant('LOGPRISTUPAOSOBNIMPODACIMA');
		// 	const headerModulLabels: string[] = this.excelService.getHeaderModulLabelsForAdministracijaExport();
    //   const headerLabels: string[] = this.excelService.getHeaderLabelsForAdministracijaExport();
		// 	const dataToExport: any[][] = this.excelService.getDataForAdministracijaExport(this.logData);
			
		// 	const wb = this.excelService.generateAdministracijaExcel(title, worksheetName, headerModulLabels, headerLabels, dataToExport);
		// 	this.excelService.exportExcelFile(wb, this.translate.instant('ADMINISTRACIJA') + '_' + this.excelService.getTodaysDateForFileName() + '.xlsx');
			
		// 	this.useCleanup.done();

		// } catch (err) {
		// 	this.useCleanup.err(err);
		// 	this.useCleanup.done();
		// }
	}
}
