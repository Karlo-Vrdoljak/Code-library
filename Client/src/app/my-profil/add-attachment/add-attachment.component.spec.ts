import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAttachmentComponent } from './add-attachment.component';

describe('AddAttachmentComponent', () => {
  let component: AddAttachmentComponent;
  let fixture: ComponentFixture<AddAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAttachmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
