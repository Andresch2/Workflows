import { Routes } from '@angular/router';
import { authGuard } from './app/core/guards/auth.guard';
import { hasRoleGuard } from './app/core/guards/has-role-guard';
import { RoleEnum } from './app/core/models/role.enum';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'projects', pathMatch: 'full' },
            {
                path: 'dashboard',
                component: Dashboard,
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN, RoleEnum.USER] }
            },
            {
                path: 'uikit',
                loadChildren: () => import('./app/pages/uikit/uikit.routes'),
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN] }
            },
            {
                path: 'documentation',
                component: Documentation,
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN] }
            },
            {
                path: 'pages',
                loadChildren: () => import('./app/pages/pages.routes'),
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN] }
            },
            {
                path: 'projects',
                loadComponent: () => import('./app/pages/projects/project-list/project-list.component').then(m => m.ProjectListComponent),
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN, RoleEnum.USER] }
            },
            {
                path: 'projects/:id',
                loadComponent: () => import('./app/pages/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN, RoleEnum.USER] }
            },
            {
                path: 'workflows',
                loadComponent: () => import('./app/pages/workflows/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent),
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN, RoleEnum.USER] }
            },
            {
                path: 'workflows/:id/editor',
                loadComponent: () => import('./app/pages/workflows/workflow-editor/workflow-editor.component').then(m => m.WorkflowEditorComponent),
                canActivate: [hasRoleGuard],
                data: { roles: [RoleEnum.ADMIN, RoleEnum.USER] }
            }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'form/:nodeId', loadComponent: () => import('./app/pages/workflows/public-form/public-form.component').then(m => m.PublicFormComponent) },
    { path: '**', redirectTo: '/notfound' }
];