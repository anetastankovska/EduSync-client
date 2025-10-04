import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

type ContactBlock = {
  title: string;
  orgName?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  hours?: string;
};

@Component({
  selector: 'app-institution-contacts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {
  // --- Contact blocks (institution) ---
  readonly instituteName = signal('EduSync Institute');
  readonly websiteUrl = signal('https://www.edusync.com');
  readonly logoUrl = signal('/assets/edusync-logo.svg');

  readonly contacts = signal<ContactBlock[]>([
    {
      title: 'Head Office',
      orgName: 'EduSync Institute',
      address: {
        line1: '123 Innovation Drive',
        line2: 'Technopolis',
        city: 'Technopolis',
        zip: '56789',
        country: 'Country',
      },
      phone: '+1 234 567 890',
      email: 'office@edusync-institute.org',
      hours: 'Mon–Fri · 09:00–17:00',
    },
    {
      title: 'Admissions',
      phone: '+1 234 567 891',
      email: 'admissions@edusync-institute.org',
    },
    {
      title: 'Student Services',
      phone: '+1 234 567 892',
      email: 'students@edusync-institute.org',
    },
    {
      title: 'Technical Support',
      phone: '+1 234 567 893',
      email: 'support@edusync-institute.org',
      hours: 'Mon–Sun · 08:00–20:00',
    },
  ]);

  // --- Simple form ---
  sent = false;

  contactForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
  });

  constructor(private fb: FormBuilder) {}

  onSubmit() {
    if (this.contactForm.invalid) return;
    // TODO: send payload via your service
    // const payload = this.contactForm.getRawValue();
    this.sent = true;
  }

  resetForm() {
    this.contactForm.reset();
    this.sent = false;
  }

  // Build a tel: href by stripping non-dialable chars
  telHref(phone?: string): string | null {
    if (!phone) return null;
    const cleaned = phone.replace(/[^+\d]/g, '');
    return `tel:${cleaned}`;
  }

  // JSON-LD (SEO)
  readonly structuredData = computed(() => {
    const contactPoint = this.contacts().map((c) => ({
      '@type': 'ContactPoint',
      contactType: c.title.toLowerCase(),
      telephone: c.phone,
      email: c.email,
    }));
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollegeOrUniversity',
      name: this.instituteName(),
      url: this.websiteUrl(),
      logo: this.logoUrl(),
      address: {
        '@type': 'PostalAddress',
        streetAddress:
          this.contacts()[0]?.address?.line1 ?? '123 Innovation Drive',
        addressLocality: this.contacts()[0]?.address?.city ?? 'Technopolis',
        postalCode: this.contacts()[0]?.address?.zip ?? '56789',
        addressCountry: this.contacts()[0]?.address?.country ?? 'Country',
      },
      contactPoint,
    });
  });
}
