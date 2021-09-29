import { Injectable } from '@angular/core';
import { BreadCrumb } from '../_interfaces/types';
import { BreadcrumbBuilder } from 'src/app/_services/breadcrumb.builder';

@Injectable({
    providedIn: 'root',
})

//Koristim osesiju za pohranu breadcrumb formulara kak obih sadrzali state prilikom refresha aplikacije
export class ForumBreadcrumbService {
    forumBc: BreadCrumb[] = [];

    constructor() { }

    public setupFormularBreadCrumb(bcLabel: string, bcRoute: string, bcQuery: string[], fromPost: boolean = false): BreadCrumb[] {
        if (fromPost) {
            //Post ne pohranjujemo u sesiju kao item breadcrumba, jer je on uvijek zadnji u nizu i kada radim orefresh na tom ekranu
            //Bitno nam je dohvatiti samo sve rute do njega, a njega spremamo u memory object
            //Kada bih i njega dodavali u sesiju trebali bi uvjetovati da li on vec postoji, jer na refresh bih se samo dodavali novi
            this.forumBc = new BreadcrumbBuilder(JSON.parse(this.getBreadCrumbFromSession()))
                .addNew({ label: bcLabel, link: bcRoute, query: bcQuery })
                .build();
        } else {
            //Provjeravamo da li je breadcrumb pohranjen u sesiji
            if (this.checkIsBreadcrumbSetInSession()) {
                //Ukoliko je breadcrumb u sesiji filtriramo ga. Sluzi nam za handlanje kada korisnik navigira preko breadcrumba ili kroz strelice browsera
                let filteredResult = this.filterBreadCrumb(JSON.parse(this.getBreadCrumbFromSession()), bcQuery[0]);

                if (filteredResult.filtered) {
                    this.forumBc = filteredResult.breadcrumb;
                } else {
                    //Ukoliko se nista nije izfiltriralo znaci da korisnik samo ulazi u novu kategoriju pa je dodajemo u breadcrumb
                    this.forumBc = new BreadcrumbBuilder(filteredResult.breadcrumb)
                        .addNew({ label: bcLabel, link: bcRoute, query: bcQuery })
                        .build();
                }

                this.setBreadcrumbListToSession(this.forumBc);

            } else {
                //Ukoliko breadcrumb nije pohranjen u sesiju dodajemo dvije fiksne rute, kao i rutu kategorije u koju ulazi
                this.forumBc = new BreadcrumbBuilder()
                    .addNew({ label: "POCETNA", link: '/home' })
                    .addNew({ label: "FORUM", link: '/forum' })
                    .addNew({ label: bcLabel, link: '/forum/category/', query: bcQuery })
                    .build();

                this.setBreadcrumbListToSession(this.forumBc);
            }
        }

        return this.forumBc;

    }

    public replaceUpdatedItemLabel(bc: BreadCrumb[], newName: string) {
        const bcLength = bc.length;
        bc[bcLength - 1].label = newName;
        return bc;
    }

    public removeBreadcrumbFromSession(): void {
        if (this.checkIsBreadcrumbSetInSession()) {
            window.sessionStorage.removeItem('breadcrumbList');
        }
    }

    //Funkcija sluzi ukoliko korisnik navigira priko breadcrumb-a da se pobrisu sve putanje desno od one na koju navigira
    private filterBreadCrumb(bc: BreadCrumb[], filterQuery: string): { filtered: boolean, breadcrumb: BreadCrumb[] } {
        const elementIndex: number = bc.findIndex((el) => el.query && (el.query[0] as string).toUpperCase() === filterQuery.toUpperCase());
        if (elementIndex !== -1) {
            bc.splice(elementIndex + 1)
            return { filtered: true, breadcrumb: bc };
        } else {
            return { filtered: false, breadcrumb: bc };
        }
    }

    //Provjerava da li je postavljen u sesiju
    private checkIsBreadcrumbSetInSession(): boolean {
        const bc = this.getBreadCrumbFromSession();
        return bc ? true : false;
    }

    //Postavlja breadcrumb u sesiju
    private setBreadcrumbListToSession(bc: BreadCrumb[]) {
        window.sessionStorage.setItem
            ('breadcrumbList', JSON.stringify(bc));
    }

    //Dohvacanje breadcrumba iz sesije
    private getBreadCrumbFromSession() {
        return window.sessionStorage.getItem('breadcrumbList');
    }


}
