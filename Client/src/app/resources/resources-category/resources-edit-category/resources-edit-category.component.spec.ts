import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesEditCategoryComponent } from './resources-edit-category.component';

describe('ResourcesEditCategoryComponent', () => {
  let component: ResourcesEditCategoryComponent;
  let fixture: ComponentFixture<ResourcesEditCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesEditCategoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesEditCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
