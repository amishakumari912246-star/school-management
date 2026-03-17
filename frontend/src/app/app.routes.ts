import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { Attendance } from './pages/attendance/attendance';
import { Classes } from './pages/classes/classes';
import { Dashboard } from './pages/dashboard/dashboard';
import { Exams } from './pages/exams/exams';
import { Fees } from './pages/fees/fees';
import { Library } from './pages/library/library';
import { Login } from './pages/login/login';
import { Notices } from './pages/notices/notices';
import { Results } from './pages/results/results';
import { Students } from './pages/students/students';
import { Teachers } from './pages/teachers/teachers';
import { Transport } from './pages/transport/transport';
import { AdmitCard } from './pages/admit-card/admit-card';

export const routes: Routes = [
	{ path: 'login', component: Login },
	{ path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
	{
		path: 'students',
		component: Students,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['Admin', 'Teacher'] }
	},
	{
		path: 'teachers',
		component: Teachers,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['Admin'] }
	},
	{ path: 'classes', component: Classes, canActivate: [authGuard] },
	{
		path: 'attendance',
		component: Attendance,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['Admin', 'Teacher'] }
	},
	{
		path: 'fees',
		component: Fees,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['Admin', 'Accountant'] }
	},
	{
		path: 'exams',
		component: Exams,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['Admin', 'Teacher'] }
	},
	{
		path: 'results',
		component: Results,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['Admin', 'Teacher'] }
	},
	{ path: 'library', component: Library, canActivate: [authGuard] },
	{ path: 'transport', component: Transport, canActivate: [authGuard] },
	{ path: 'notices', component: Notices, canActivate: [authGuard] },
	{
		path: 'admit-card',
		component: AdmitCard,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['Admin', 'Teacher'] }
	},
	{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
	{ path: '**', redirectTo: 'dashboard' }
];
