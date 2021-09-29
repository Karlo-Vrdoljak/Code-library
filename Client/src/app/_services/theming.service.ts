import { ELocalStorage } from 'src/app/_interfaces/types';
import { Injectable } from '@angular/core';
import * as dark from '../../assets/css/vars/theme.dark.json';
import * as light from '../../assets/css/vars/theme.light.json';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ThemingService {
  currentTheme: string = null;
  subject = new BehaviorSubject(null);
  onThemeChange = this.subject.asObservable();

  constructor() { }

  private onThemeChanged() {
    this.subject.next(this.currentTheme);
  }
  
  fetchTheme() {
    let theme = localStorage.getItem(ELocalStorage.THEME);
    if (theme == null) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      } else {
        theme = 'light';
      }
    }
    return theme;
  }

  setDefaultTheme() {
    let theme = this.fetchTheme();
    this.setTheme(theme);
  }

  toggleTheme(): void {
    let theme = this.fetchTheme();

    if (theme == 'light') {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    this.setTheme(theme);
    this.onThemeChanged();
  }

  setTheme(theme:string) {
    let themeConfig = null;
    let themeLocation = null;
    const themeEl = document.getElementById('theme') as any;
    if (theme == 'dark') {
      if (themeEl && themeEl.classList.contains('dark')) {
        themeEl.classList.remove('light');
      }
      themeConfig = dark;
      themeLocation = environment.DARK_THEME_LOCATION;
    } else {
      if (themeEl && themeEl.classList.contains('light')) {
        themeEl.classList.remove('dark');
      }
      themeConfig = light;
      themeLocation = environment.LIGHT_THEME_LOCATION;
    }
    if (themeEl) {
      themeEl.classList.add(theme);
    }
    const themeSheet = document.getElementById('themeSheet') as any;
    if (themeSheet) {
      themeSheet.href = themeLocation;
    }
    localStorage.setItem(ELocalStorage.THEME, theme);
    this.currentTheme = theme;
    Object.entries(themeConfig).map(([k, v]: any[]) => {
      if (k.startsWith('--')) {
        document.documentElement.style.setProperty(k, v);
      }
    });
  }
}
