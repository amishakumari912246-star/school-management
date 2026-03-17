import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SchoolApiService, TeacherPayload } from '../../services/school-api.service';

@Component({
  selector: 'app-teachers',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class Teachers implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SchoolApiService);

  protected editingId: string | null = null;
  protected teachers: TeacherPayload[] = [];
  protected errorMessage = '';

  protected readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: ['', Validators.required],
    subject: ['', Validators.required],
    qualification: ['', Validators.required],
    experience: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    email: ['', [Validators.required, Validators.email]],
    joiningDate: ['', Validators.required],
    salary: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadTeachers();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as TeacherPayload;
    const request = this.editingId
      ? this.api.updateTeacher(this.editingId, payload)
      : this.api.createTeacher(payload);

    request.subscribe({
      next: () => {
        this.errorMessage = '';
        this.reset();
        this.loadTeachers();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to save teacher';
      }
    });
  }

  protected edit(teacher: TeacherPayload): void {
    this.editingId = teacher._id ?? null;
    this.form.patchValue({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      gender: teacher.gender,
      subject: teacher.subject,
      qualification: teacher.qualification,
      experience: teacher.experience,
      mobile: teacher.mobile,
      email: teacher.email,
      joiningDate: teacher.joiningDate,
      salary: teacher.salary
    });
  }

  protected remove(id: string): void {
    this.api.deleteTeacher(id).subscribe({
      next: () => {
        this.errorMessage = '';
        this.loadTeachers();
        if (this.editingId === id) {
          this.reset();
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to delete teacher';
      }
    });
  }

  protected reset(): void {
    this.editingId = null;
    this.form.reset();
  }

  private loadTeachers(): void {
    this.api.getTeachers().subscribe({
      next: (rows) => {
        this.errorMessage = '';
        this.teachers = rows;
      },
      error: (error) => {
        this.teachers = [];
        this.errorMessage = error?.error?.message ?? 'Unable to load teachers';
      }
    });
  }
}
