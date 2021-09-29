import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdministracijaComponent } from './administracija/administracija.component';
import { LoginComponent } from './login/login.component';
import { MojePretplateComponent } from './moje-pretplate/moje-pretplate.component';
import { ResourcesCategoryListComponent } from './resources/resources-category/resources-category-list/resources-category-list.component';
import { ResourcesCategoryComponent } from './resources/resources-category/resources-category.component';
import { ResourcesEditCategoryComponent } from './resources/resources-category/resources-edit-category/resources-edit-category.component';
import { ResourcesInsertCategoryComponent } from './resources/resources-category/resources-insert-category/resources-insert-category.component';
import { ResourcesEditPostComponent } from './resources/resources-post/resources-edit-post/resources-edit-post.component';
import { ResourcesInsertPostComponent } from './resources/resources-post/resources-insert-post/resources-insert-post.component';
import { ResourcesPostComponent } from './resources/resources-post/resources-post.component';
import { AdministrationGuard } from './_guards/administration.guard';
import { AuthGuard } from './_guards/auth.guard';
import { ResourcesCategoryGuard } from './_guards/resources-category.guard';
import { ResourcesPostGuard } from './_guards/resources-post.guard';
import { HomeResolver } from './_resolvers/home.resolver';

const routes: Routes = [
	{ path: 'login', component: LoginComponent, data: { state: 'login' } },
	{ path: 'resources', canActivate: [AuthGuard], component: ResourcesCategoryListComponent, data: { state: 'resources' } },
	{ path: 'resources/category/add-new', canActivate: [AuthGuard, ResourcesCategoryGuard], component: ResourcesInsertCategoryComponent, data: { state: 'add-new-category-resources' } },
	{ path: 'resources/category/edit', canActivate: [AuthGuard, ResourcesCategoryGuard], component: ResourcesEditCategoryComponent, data: { state: 'edit-category-resources' } },
	{ path: 'resources/category/:PkCategory', canActivate: [AuthGuard], component: ResourcesCategoryComponent, data: { state: 'category-resources' } },
	{ path: 'resources/post/add-new', canActivate: [AuthGuard, ResourcesPostGuard], component: ResourcesInsertPostComponent, data: { state: 'add-new-post-resources' } },
	{ path: 'resources/post/edit', canActivate: [AuthGuard, ResourcesPostGuard], component: ResourcesEditPostComponent, data: { state: 'edit-post-resources' } },
	{ path: 'resources/post/:PkPost', canActivate: [AuthGuard], component: ResourcesPostComponent, data: { state: 'post-resources' } },
	{ path: 'subscriptions', canActivate: [AuthGuard], component: MojePretplateComponent, data: { state: 'subscriptions' } },
	{ path: 'administration', canActivate: [AuthGuard, AdministrationGuard], component: AdministracijaComponent, data: { state: 'administracija' } },
	{ path: '', canActivate: [AuthGuard], component: ResourcesCategoryListComponent, data: { state: 'home' } },
	{ path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
	exports: [RouterModule],
})
export class AppRoutingModule {}
