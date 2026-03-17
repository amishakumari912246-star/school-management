import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SchoolApiService, StudentPayload } from '../../services/school-api.service';

@Component({
  selector: 'app-students',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class Students implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SchoolApiService);

  protected editingId: string | null = null;
  protected students: StudentPayload[] = [];
  protected errorMessage = '';

  protected readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: ['', Validators.required],
    dob: ['', Validators.required],
    className: ['', Validators.required],
    section: ['', Validators.required],
    fatherName: ['', Validators.required],
    motherName: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    email: ['', [Validators.required, Validators.email]],
    city: ['', Validators.required],
    state: ['', Validators.required],
    admissionDate: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadStudents();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as StudentPayload;
    const request = this.editingId
      ? this.api.updateStudent(this.editingId, payload)
      : this.api.createStudent(payload);

    request.subscribe({
      next: () => {
        this.errorMessage = '';
        this.reset();
        this.loadStudents();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to save student';
      }
    });
  }

  protected edit(student: StudentPayload): void {
    this.editingId = student._id ?? null;
    this.form.patchValue({
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      dob: student.dob,
      className: student.className,
      section: student.section,
      fatherName: student.fatherName,
      motherName: student.motherName,
      mobile: student.mobile,
      email: student.email,
      city: student.city,
      state: student.state,
      admissionDate: student.admissionDate
    });
  }

  protected remove(id: string): void {
    this.api.deleteStudent(id).subscribe({
      next: () => {
        this.errorMessage = '';
        this.loadStudents();
        if (this.editingId === id) {
          this.reset();
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to delete student';
      }
    });
  }

  protected reset(): void {
    this.editingId = null;
    this.form.reset();
  }

  private loadStudents(): void {
    this.api.getStudents().subscribe({
      next: (rows) => {
        this.errorMessage = '';
        this.students = rows;
      },
      error: (error) => {
        this.students = [];
        this.errorMessage = error?.error?.message ?? 'Unable to load students';
      }
    });
  }
}
