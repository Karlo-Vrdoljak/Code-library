import { ELocalStorage } from './../_interfaces/types';
import { TranslateService } from '@ngx-translate/core';
import { GlobalVar } from 'src/app/globalVar';
import { Injectable } from '@angular/core'; //TRIBA OTKOMENTIRAT
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
  constructor(public globalVar: GlobalVar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = null;
    if (localStorage.getItem(ELocalStorage.JWT)) {
      token = localStorage.getItem(ELocalStorage.JWT);
    }
    if (token) {
      req = req.clone({ 
        setHeaders: { Authorization: `Bearer ${token}`, "curr_db":  this.globalVar.prodDatabase },
      });
    } else {
      req = req.clone({ 
        setHeaders: {"curr_db":  this.globalVar.prodDatabase, "language": localStorage.getItem('alumni_lang') || 'hr' },
      });
    }
    // req = req.clone({ params: req.params.set('appVersion', '0.9') });
    return next.handle(req);
  }
}
