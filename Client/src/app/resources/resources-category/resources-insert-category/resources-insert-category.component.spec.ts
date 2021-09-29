import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesInsertCategoryComponent } from './resources-insert-category.component';

describe('ResourcesInsertCategoryComponent', () => {
  let component: ResourcesInsertCategoryComponent;
  let fixture: ComponentFixture<ResourcesInsertCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesInsertCategoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesInsertCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
