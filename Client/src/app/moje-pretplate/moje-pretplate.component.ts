import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { BreadCrumb, EPrimengKeys, Pretplata, RequestCleanup } from '../_interfaces/types';
import { AppService } from '../_services/app.service';
import { PretplateService } from '../_services/pretplate.service';
import { BreadcrumbBuilder } from 'src/app/_services/breadcrumb.builder';
import { Router } from '@angular/router';
import { ForumBreadcrumbService } from '../_services/forum-breadcrumb.service';
import { ResourcesBreadcrumbService } from '../_services/resources-breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-moje-pretplate',
  templateUrl: './moje-pretplate.component.html',
  styleUrls: ['./moje-pretplate.component.scss']
})
export class MojePretplateComponent implements OnInit {
  useCleanup: RequestCleanup;
  pretplate: Pretplata[] = [];
  preplateGroupedByModul: {} = null;
  pretplateBc: BreadCrumb[] = [];
  readonly pretplateModuli = {
    forum: 'FORUM',
    eBiblioteka: 'E-BIBLIOTEKA'
  }

  constructor(
    private pretplateService: PretplateService,
    private appService: AppService,
    private router: Router,
    private forumBcService: ForumBreadcrumbService,
    private resourcesBcService: ResourcesBreadcrumbService,
    private translate: TranslateService,
    private confirmationService: ConfirmationService
  ) {
    this.useCleanup = this.appService.useRequestCleanup();
  }

  ngOnInit(): void {
    this.getMojePretplate();

    this.pretplateBc = new BreadcrumbBuilder().addNew({ label: 'POCETNA', link: '/home' }).addNew({ label: 'MOJE_PRETPLATE', link: '/subscriptions' }).build();
  }
  //Funkcija dohvaca podatke o pretplatama i postavlja ih u pretplate niz, 
  //zatim ih grupira po modulu i postavlja ih u preplateGroupedByModul
  private getMojePretplate(): void {
    this.useCleanup.startBg();
    let pretplate: Pretplata[] = [];
    //Prvo dohvacamo sve pretplate za logiranog korisnika
    this.pretplateService
      .getUserPretplate()
      .pipe(
        mergeMap((userPretplate) => {
          pretplate = userPretplate;
          //Za svaku pretplatu konstuiramo api poziv za dohvacanje podataka o kategorijama na koju je postavljena pretplata
          const apiCalls: Observable<any[]>[] = [];
          pretplate.forEach((sub) => apiCalls.push(this.pretplateService.getPretplateData({ Pk: sub.Pk, DatumZadnjeProvjere: sub.DatumZadnjeProvjere as string, Modul: sub.Modul, Segment: sub.Segment })));
          return forkJoin(apiCalls);
        })
      )
      .subscribe(
        async (data) => {
          //Kada dohvatimo sve podatke o pretplati sirimo objekt pretplate s podatcima
          pretplate.forEach((sub, i) => {
            sub.data = data[i];
          });

          this.sortPretplateByNewPostsCount(pretplate);

          this.preplateGroupedByModul = await this.appService.groupDataByKey(this.pretplate, 'Modul');

          this.useCleanup.doneBg();
        },
        (err) => {
          this.useCleanup.err(err);
        }
      );
  }

  public navigateToCategory(pretplata: Pretplata): void {
    switch ((pretplata.Modul + '_' + pretplata.Segment).toUpperCase()) {
      case 'FORUM_KATEGORIJA':
        this.forumBcService.removeBreadcrumbFromSession();
        this.router.navigate(['/forum/category', pretplata.Pk]);
        break;
      case 'E-BIBLIOTEKA_KATEGORIJA':
        this.resourcesBcService.removeBreadcrumbFromSession();
        this.router.navigate(['/resources/category', pretplata.Pk]);
        break;
    }
  }

  private sortPretplateByNewPostsCount(pretplate: Pretplata[]): void {
    this.pretplate = pretplate.sort((a, b) => {
      if (a.data.NewPostsCount < b.data.NewPostsCount) {
        return 1;
      } else if (a.data.NewPostsCount > b.data.NewPostsCount) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  public displayCancelSubscriptionDialog(e: Event, subscription: Pretplata): void {
    //Potrebno kak ose nebi triggerala onClick funkcija parent diva
    e.stopPropagation();

    this.translate.get(['UNSUBSCRIBE_CONFIRM_HEADER', 'UNSUBSCRIBE_CONFIRM_DESC', 'ACCEPT', 'NO_TY']).subscribe((t) => {
      this.confirmationService.confirm({
        key: EPrimengKeys.globalConfirm,
        header: t.UNSUBSCRIBE_CONFIRM_HEADER,
        message: `${t.UNSUBSCRIBE_CONFIRM_DESC} <i>${subscription.data.Naziv}</i>?`,
        acceptLabel: t.ACCEPT,
        rejectLabel: t.NO_TY,
        icon: 'pi pi-exclamation-circle',
        accept: () => {
          this.cancelSubscription(subscription);
        },
        reject: () => { },
      });
    });
  }

  private cancelSubscription(subscription: Pretplata) {
    this.useCleanup.start();

    this.pretplateService.userPretplataDelete({ PkPretplate: subscription.PkPretplate }).subscribe((data) => {
      this.removeSubscription(subscription.PkPretplate);
      this.useCleanup.done();
      this.useCleanup.doneToast('USPJEH_PRETPLATA_OTKAZANA');
    }, (err) => {
      this.useCleanup.done();
      this.useCleanup.err(err);
    })
  }

  private async removeSubscription(PkPretplata: number) {
    this.pretplate = this.pretplate.filter(sub => sub.PkPretplate !== PkPretplata);
    this.preplateGroupedByModul = this.pretplate.length > 0 ?  await this.appService.groupDataByKey(this.pretplate, 'Modul') : null;

  }

}
