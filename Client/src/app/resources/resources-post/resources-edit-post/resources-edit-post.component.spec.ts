import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesEditPostComponent } from './resources-edit-post.component';

describe('ResourcesEditPostComponent', () => {
  let component: ResourcesEditPostComponent;
  let fixture: ComponentFixture<ResourcesEditPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesEditPostComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesEditPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
