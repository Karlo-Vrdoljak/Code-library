import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesPrilogComponent } from './resources-prilog.component';

describe('ResourcesPrilogComponent', () => {
  let component: ResourcesPrilogComponent;
  let fixture: ComponentFixture<ResourcesPrilogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesPrilogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesPrilogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
