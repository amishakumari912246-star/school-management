import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(protected readonly authService: AuthService) {}

  protected readonly menu = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Students', path: '/students' },
    { label: 'Teachers', path: '/teachers' },
    { label: 'Classes', path: '/classes' },
    { label: 'Attendance', path: '/attendance' },
    { label: 'Fees', path: '/fees' },
    { label: 'Exams', path: '/exams' },
    { label: 'Results', path: '/results' },
    { label: 'Library', path: '/library' },
    { label: 'Transport', path: '/transport' },
    { label: 'Notices', path: '/notices' },
    { label: 'Admit Card', path: '/admit-card' }
  ];

  protected logout(): void {
    this.authService.logout();
  }
}
