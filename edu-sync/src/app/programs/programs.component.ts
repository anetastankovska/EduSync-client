import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

type Program = {
  id: string;
  icon: string;
  title: string;
  description: string;
  topics: string[];
  cta?: { text: string; link: string };
};

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.scss'],
})
export class ProgramsComponent {
  programs: Program[] = [
    {
      id: 'frontend',
      icon: 'code',
      title: 'Frontend Development',
      description:
        'Learn to build modern, responsive web apps with HTML, CSS, TypeScript, and Angular. You’ll cover component architecture, routing, forms, state management, accessibility, and API integration—everything needed to ship polished, production-ready interfaces.',
      topics: [
        'Angular',
        'TypeScript',
        'Routing',
        'Reactive Forms',
        'State Management',
        'Accessibility',
        'REST APIs',
      ],
      cta: { text: 'Join this track', link: '/register' },
    },
    {
      id: 'backend',
      icon: 'dns',
      title: 'Backend & APIs',
      description:
        'Master server-side development with Node.js and NestJS. Design and implement RESTful APIs, connect to SQL/NoSQL databases, add authentication and validation, handle errors robustly, and deploy reliable, scalable services.',
      topics: [
        'Node.js',
        'NestJS',
        'Express',
        'MongoDB / SQL',
        'Auth & Validation',
        'Testing',
        'Deployment',
      ],
      cta: { text: 'Start backend', link: '/register' },
    },
    {
      id: 'qa',
      icon: 'bug_report',
      title: 'QA & Testing',
      description:
        'Ensure quality with strong manual testing foundations and automation. Practice test design, create suites for unit/E2E tests, file actionable bug reports, and integrate testing into CI so teams ship with confidence.',
      topics: [
        'Manual Testing',
        'Test Design',
        'Jest/RTL',
        'Cypress/Selenium',
        'Bug Tracking',
        'CI Integration',
      ],
      cta: { text: 'Become a QA pro', link: '/register' },
    },
    {
      id: 'data-cloud',
      icon: 'hub',
      title: 'Data & Cloud Basics',
      description:
        'Get introduced to data flows and cloud fundamentals. Learn data modeling and querying, containerization with Docker, CI/CD concepts, and the essentials of working with cloud providers to deploy and monitor applications.',
      topics: [
        'Data Modeling',
        'SQL Basics',
        'Docker',
        'CI/CD',
        'Intro to AWS',
        'Monitoring',
      ],
      cta: { text: 'Kick off basics', link: '/register' },
    },
  ];
}
