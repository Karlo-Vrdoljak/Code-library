import { Component, Input, OnInit } from '@angular/core';
import { BreadCrumb } from '../_interfaces/types';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {

  @Input() image: string;
  @Input() text: string;
  @Input() breadcrumbs:BreadCrumb[] = [];
  constructor() { }

  ngOnInit(): void {
  }

  makeLink(crumb: BreadCrumb) {
    if (crumb.query?.length) {
      return [crumb.link,...crumb.query]
    } else {
      return [crumb.link];
    }
  }
}
