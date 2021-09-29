import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesPostListComponent } from './resources-post-list.component';

describe('ResourcesPostListComponent', () => {
  let component: ResourcesPostListComponent;
  let fixture: ComponentFixture<ResourcesPostListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesPostListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesPostListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
