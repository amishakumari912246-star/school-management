import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdmitCardPayload, SchoolApiService } from '../../services/school-api.service';

@Component({
  selector: 'app-admit-card',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admit-card.html',
  styleUrl: './admit-card.scss'
})
export class AdmitCard implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SchoolApiService);

  protected editingId: string | null = null;
  protected admitCards: AdmitCardPayload[] = [];
  protected errorMessage = '';
  protected printCard: AdmitCardPayload | null = null;

  protected readonly form = this.fb.group({
    studentName:  ['', Validators.required],
    rollNumber:   ['', Validators.required],
    className:    ['', Validators.required],
    section:      ['', Validators.required],
    fatherName:   ['', Validators.required],
    examName:     ['', Validators.required],
    examCenter:   ['', Validators.required],
    examDate:     ['', Validators.required],
    subjects:     ['', Validators.required],
    photo:        ['']
  });

  ngOnInit(): void {
    this.load();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue() as AdmitCardPayload;
    const req = this.editingId
      ? this.api.updateAdmitCard(this.editingId, payload)
      : this.api.createAdmitCard(payload);

    req.subscribe({
      next: () => { this.errorMessage = ''; this.reset(); this.load(); },
      error: (e) => { this.errorMessage = e?.error?.message ?? 'Unable to save'; }
    });
  }

  protected edit(card: AdmitCardPayload): void {
    this.editingId = card._id ?? null;
    this.form.patchValue(card);
  }

  protected remove(id: string): void {
    this.api.deleteAdmitCard(id).subscribe({
      next: () => { this.errorMessage = ''; this.load(); if (this.editingId === id) this.reset(); },
      error: (e) => { this.errorMessage = e?.error?.message ?? 'Unable to delete'; }
    });
  }

  protected reset(): void {
    this.editingId = null;
    this.form.reset();
  }

  protected showPrint(card: AdmitCardPayload): void {
    this.printCard = card;
    setTimeout(() => window.print(), 200);
  }

  protected closePrint(): void {
    this.printCard = null;
  }

  private load(): void {
    this.api.getAdmitCards().subscribe({
      next: (rows) => { this.admitCards = rows; this.errorMessage = ''; },
      error: (e) => { this.admitCards = []; this.errorMessage = e?.error?.message ?? 'Unable to load'; }
    });
  }
}
