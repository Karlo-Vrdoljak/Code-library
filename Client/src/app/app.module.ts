import { LayoutModule } from '@angular/cdk/layout';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateLoader, TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { RecaptchaModule } from 'ng-recaptcha';
import { NgxAbbreviateNumberModule } from 'ngx-abbreviate-number';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxMaskModule } from 'ngx-mask';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxUiLoaderConfig, NgxUiLoaderModule, NgxUiLoaderRouterModule, PB_DIRECTION, POSITION, SPINNER } from 'ngx-ui-loader';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService, FilterService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipsModule } from 'primeng/chips';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DeferModule } from 'primeng/defer';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ListboxModule } from 'primeng/listbox';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PaginatorModule } from 'primeng/paginator';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { ScrollTopModule } from 'primeng/scrolltop';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { GlobalVar } from 'src/app/globalVar';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { FooterComponent } from './footer/footer.component';
import { FormErrorComponent } from './forms/form-error/form-error.component';
import { LoginComponent } from './login/login.component';
import { MojePretplateComponent } from './moje-pretplate/moje-pretplate.component';
import { NavComponent } from './nav/nav/nav.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { RequiredLabelComponent } from './required-label/required-label.component';
import { ResourcesCategoryListComponent } from './resources/resources-category/resources-category-list/resources-category-list.component';
import { ResourcesCategoryComponent } from './resources/resources-category/resources-category.component';
import { ResourcesEditCategoryComponent } from './resources/resources-category/resources-edit-category/resources-edit-category.component';
import { ResourcesInsertCategoryComponent } from './resources/resources-category/resources-insert-category/resources-insert-category.component';
import { ResourcesEditPostComponent } from './resources/resources-post/resources-edit-post/resources-edit-post.component';
import { ResourcesInsertPostComponent } from './resources/resources-post/resources-insert-post/resources-insert-post.component';
import { ResourcesPostListComponent } from './resources/resources-post/resources-post-list/resources-post-list.component';
import { ResourcesPostComponent } from './resources/resources-post/resources-post.component';
import { ResourcesPrilogComponent } from './resources/resources-post/resources-prilog/resources-prilog.component';
import { UserNavComponent } from './user/user-nav/user-nav.component';
import { BackButtonDirective } from './_directives/back.directive';
import { ImagePreloadDirective } from './_directives/default.image';
import { AppHttpInterceptor } from './_interceptor/app.interceptor';
import { MAX_LOADER_SHOW } from './_interfaces/types';
import { AppFilterPipe } from './_pipes/app.filter.pipe';
import { PaginationPipe } from './_pipes/paginate.pipe';
import { PrivacyPipe } from './_pipes/privacy.pipe';
import { SanitizerUrlPipe } from './_pipes/sanitize.pipe';
import { ArraySortPipe } from './_pipes/sort.pipe';
import { TruncatePipe } from './_pipes/truncate.pipe';
import { AnketeTemplatingResolver } from './_resolvers/ankete.templating.resolver';
import { HomeResolver } from './_resolvers/home.resolver';
import { MembersResolver } from './_resolvers/members.resolver';
import { ObavijestInsertResolver } from './_resolvers/obavijest-insert.resolver';
import { ObavijestReadResolver } from './_resolvers/obavijest-read.resolver';
import { ObavijestiResolver } from './_resolvers/obavijesti.resolver';
import { AnketeService } from './_services/ankete.service';
import { AppService } from './_services/app.service';
import { ForumBreadcrumbService } from './_services/forum-breadcrumb.service';
import { ForumService } from './_services/forum.service';
import { OauthService } from './_services/oauth.service';
import { ObavijestiService } from './_services/obavijesti.service';
import { ProfileService } from './_services/profile.service';
import { ThemingService } from './_services/theming.service';
import { AddAttachmentComponent } from './my-profil/add-attachment/add-attachment.component';
import { EditAttachmentComponent } from 'src/app/my-profil/edit-attachment/edit-attachment.component';

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
	bgsColor: '#2196F3',
	fgsColor: '#2196F3',
	overlayColor: '#00000000',
	bgsPosition: POSITION.bottomLeft,
	bgsSize: 50,
	bgsType: SPINNER.chasingDots, // background spinner type
	fgsType: SPINNER.cubeGrid, // foreground spinner type
	pbDirection: PB_DIRECTION.leftToRight, // progress bar direction
	pbColor: '#2196F3',
	pbThickness: 2, // progress bar thickness
	maxTime: MAX_LOADER_SHOW,
};

// registerLocaleData(localeHr);
export function HttpLoaderFactory(httpClient: HttpClient) {
	return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
	declarations: [
		AppComponent,
		NavComponent,
		LoginComponent,
		FormErrorComponent,
		FooterComponent,
		PageHeaderComponent,
		FileUploadComponent,
		UserNavComponent,
		BackButtonDirective,
		SanitizerUrlPipe,
		ResourcesPostComponent,
		ResourcesCategoryComponent,
		ResourcesCategoryListComponent,
		ResourcesEditCategoryComponent,
		ResourcesInsertCategoryComponent,
		ResourcesPostListComponent,
		ResourcesInsertPostComponent,
		PrivacyPipe,
		ImagePreloadDirective,
		TruncatePipe,
		PaginationPipe,
		ResourcesPrilogComponent,
		ResourcesEditPostComponent,
		ArraySortPipe,
		RequiredLabelComponent,
		AppFilterPipe,
		MojePretplateComponent,
		AddAttachmentComponent,
		EditAttachmentComponent,
	],

	imports: [
		TranslateModule.forRoot({
			useDefaultLang: true,
			defaultLanguage: 'hr',
			isolate: true,
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient],
			},
		}),
		NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
		NgxUiLoaderRouterModule.forRoot({ showForeground: false }),
		NgxMaskModule.forRoot(),
		BrowserModule,
		AppRoutingModule,
		ButtonModule,
		BrowserAnimationsModule,
		InputTextModule,
		InputSwitchModule,
		MenubarModule,
		ToolbarModule,
		ToggleButtonModule,
		RippleModule,
		HttpClientModule,
		ToastModule,
		FormsModule,
		ReactiveFormsModule,
		DialogModule,
		DynamicDialogModule,
		ProgressBarModule,
		RecaptchaModule,
		MenuModule,
		OverlayPanelModule,
		EditorModule,
		InfiniteScrollModule,
		ConfirmDialogModule,
		ListboxModule,
		AccordionModule,
		PaginatorModule,
		LayoutModule,
		NgxPaginationModule,
		PaginatorModule,
		DropdownModule,
		MultiSelectModule,
		ChipsModule,
		CalendarModule,
		FileUploadModule,
		AvatarModule,
		RadioButtonModule,
		RxReactiveFormsModule,
		InputMaskModule,
		StepsModule,
		NgxAbbreviateNumberModule,
		TooltipModule,
		TabViewModule,
		ScrollTopModule,
		InputTextareaModule,
		CheckboxModule,
		ContextMenuModule,
		ProgressBarModule,
		NgxChartsModule,
		DeferModule,
		PanelModule,
		BadgeModule,
		TableModule,
		ServiceWorkerModule.register('ngsw-worker.js', {
			enabled: environment.production,
			// Register the ServiceWorker as soon as the app is stable
			// or after 30 seconds (whichever comes first).
			registrationStrategy: 'registerWhenStable:30000',
		}),
	],

	bootstrap: [AppComponent],
	providers: [
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AppHttpInterceptor,
			multi: true,
		},
		AppService,
		ThemingService,
		TranslateService,
		MessageService,
		GlobalVar,
		HttpClient,
		ObavijestiService,
		HomeResolver,
		OauthService,
		ForumService,
		ForumBreadcrumbService,
		ConfirmationService,
		ObavijestiResolver,
		ObavijestReadResolver,
		ObavijestInsertResolver,
		MembersResolver,
		ProfileService,
		AnketeService,
		AnketeTemplatingResolver,
		FilterService,
	],
	exports: [TranslateModule, TranslatePipe],
	entryComponents: [],

	schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
