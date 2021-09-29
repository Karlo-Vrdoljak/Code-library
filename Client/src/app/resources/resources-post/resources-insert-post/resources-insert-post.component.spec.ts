import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesInsertPostComponent } from './resources-insert-post.component';

describe('ResourcesInsertPostComponent', () => {
  let component: ResourcesInsertPostComponent;
  let fixture: ComponentFixture<ResourcesInsertPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesInsertPostComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesInsertPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
