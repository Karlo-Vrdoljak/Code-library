import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesCategoryListComponent } from './resources-category-list.component';

describe('ResourcesCategoryListComponent', () => {
  let component: ResourcesCategoryListComponent;
  let fixture: ComponentFixture<ResourcesCategoryListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesCategoryListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesCategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
