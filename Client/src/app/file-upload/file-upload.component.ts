import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FileUpload } from 'primeng/fileupload';
import { ACCEPT_IMAGES, SIZE_5MB } from '../_interfaces/types';
import { ObavijestiService } from '../_services/obavijesti.service';

@Component({
	selector: 'app-file-upload',
	templateUrl: './file-upload.component.html',
	styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent implements OnInit {
	@Input() asDialog = false;
	@Input() visible = false;
	@Input() header: string = null;
	@Input() size: string = null;
	@Input() acceptTypes: string = null;
	@Input() multiple = true;
	@Input() icon = false;
	@Input() chooseIcon = 'pi pi-plus-circle';

	@Input() basic = false;
	@Output() uploadHandler = new EventEmitter<any>();
	uploadedFiles: any[] = [];
	@ViewChild('uploader') uploader: FileUpload;
	@ViewChild('basicUploader') basicUploader: FileUpload;
	@Input() class: string = null;

	constructor(public obavijestiService: ObavijestiService) {}

	ngOnInit(): void {
		if (!this.size) this.size = SIZE_5MB;
		if (!this.acceptTypes) this.acceptTypes = ACCEPT_IMAGES;
	}

	onUpload(event) {

		for (let file of event.files) {
			this.uploadedFiles.push(file);
		}
	}
	handleUpload(event) {
		this.uploadHandler.emit(event.files);
		this.uploadedFiles = [];
		if (this.basic == false) {
			this.uploader._files = [];
		} else {
			this.basicUploader._files = [];
		}
	}
}
