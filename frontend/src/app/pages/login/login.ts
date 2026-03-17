import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected submitted = false;
  protected errorMessage = '';

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required]
  });

  protected login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as {
      email: string;
      password: string;
      role: 'Admin' | 'Teacher' | 'Student' | 'Accountant';
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.errorMessage = '';
        this.submitted = true;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.submitted = false;
        this.errorMessage = error?.error?.message ?? 'Login failed';
      }
    });
  }
}
