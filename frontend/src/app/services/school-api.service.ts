import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentPayload {
  _id?: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  className: string;
  section: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  admissionDate: string;
}

export interface TeacherPayload {
  _id?: string;
  firstName: string;
  lastName: string;
  gender: string;
  subject: string;
  qualification: string;
  experience: string;
  mobile: string;
  email: string;
  joiningDate: string;
  salary: string;
}

export interface AdmitCardPayload {
  _id?: string;
  studentName: string;
  rollNumber: string;
  className: string;
  section: string;
  fatherName: string;
  examName: string;
  examCenter: string;
  examDate: string;
  subjects: string;
  photo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private readonly http: HttpClient) {}

  getDashboardSummary(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/dashboard/summary`);
  }

  getStudents(): Observable<StudentPayload[]> {
    return this.http.get<StudentPayload[]>(`${this.baseUrl}/students`);
  }

  createStudent(payload: StudentPayload): Observable<StudentPayload> {
    return this.http.post<StudentPayload>(`${this.baseUrl}/students`, payload);
  }

  updateStudent(id: string, payload: StudentPayload): Observable<StudentPayload> {
    return this.http.put<StudentPayload>(`${this.baseUrl}/students/${id}`, payload);
  }

  deleteStudent(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/students/${id}`);
  }

  getTeachers(): Observable<TeacherPayload[]> {
    return this.http.get<TeacherPayload[]>(`${this.baseUrl}/teachers`);
  }

  createTeacher(payload: TeacherPayload): Observable<TeacherPayload> {
    return this.http.post<TeacherPayload>(`${this.baseUrl}/teachers`, payload);
  }

  updateTeacher(id: string, payload: TeacherPayload): Observable<TeacherPayload> {
    return this.http.put<TeacherPayload>(`${this.baseUrl}/teachers/${id}`, payload);
  }

  deleteTeacher(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/teachers/${id}`);
  }

  getAttendance(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/attendance`);
  }

  getFees(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/fees`);
  }

  getExams(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/exams`);
  }

  getResults(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/results`);
  }

  getAdmitCards(): Observable<AdmitCardPayload[]> {
    return this.http.get<AdmitCardPayload[]>(`${this.baseUrl}/admitcards`);
  }

  createAdmitCard(payload: AdmitCardPayload): Observable<AdmitCardPayload> {
    return this.http.post<AdmitCardPayload>(`${this.baseUrl}/admitcards`, payload);
  }

  updateAdmitCard(id: string, payload: AdmitCardPayload): Observable<AdmitCardPayload> {
    return this.http.put<AdmitCardPayload>(`${this.baseUrl}/admitcards/${id}`, payload);
  }

  deleteAdmitCard(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/admitcards/${id}`);
  }
}