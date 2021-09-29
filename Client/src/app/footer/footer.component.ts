import { TranslateService } from '@ngx-translate/core';
import { ThemingService } from './../_services/theming.service';
import { navItems } from 'src/app/_interfaces/types';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppService } from '../_services/app.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  navigation: { one: { label: string; icon: string; link: string }[]; two: { label: string; icon: string; link: string }[]; three: { label: string; icon: string; link: string }[] };
  hasPreviousNavigation: boolean;

  constructor(public router: Router, public appService: AppService, public themingService: ThemingService, public translate: TranslateService) {
    this.hasPreviousNavigation = Boolean(this.router.getCurrentNavigation()?.previousNavigation);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.hasPreviousNavigation = Boolean(this.router.getCurrentNavigation()?.previousNavigation);
      }
      // NavigationEnd
      // NavigationCancel
      // NavigationError
      // RoutesRecognized
    });
  }

  ngOnInit(): void {
    const nav = navItems.slice().reverse();
    this.navigation = {
      one: nav.slice(5),
      two: nav.slice(3, 5),
      three: nav.slice(0, 3),
    };
  }


  checkActive(rla, active: boolean) {
    if (this.hasPreviousNavigation) {
      return active;
    }
    return this.router.config.map((routes) => routes.path).find((p) => window.location.href.includes(p) && rla.linkWithHref.commands.join('').includes(p)) ? true : false;
  }
}
