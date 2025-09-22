import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  highlights = [
    {
      icon: 'school',
      title: 'Practice-based learning',
      desc: 'Hands-on projects guided by mentors to build job-ready skills.',
      link: '/navigation',
      linkText: 'Explore programs',
    },
    {
      icon: 'groups',
      title: 'Expert mentors',
      desc: 'Learn from active industry professionals and get actionable feedback.',
      link: '/register',
      linkText: 'Join a cohort',
    },
    {
      icon: 'workspace_premium',
      title: 'Career support',
      desc: 'Interview prep, portfolio reviews, and real-world best practices.',
      link: '/login',
      linkText: 'Sign in',
    },
  ];

  programs = [
    {
      icon: 'code',
      title: 'Frontend Development',
      blurb: 'Angular, TypeScript, modern tooling.',
      link: '/navigation',
    },
    {
      icon: 'dns',
      title: 'Backend & APIs',
      blurb: 'Node.js, NestJS, databases, testing.',
      link: '/navigation',
    },
    {
      icon: 'bug_report',
      title: 'QA & Testing',
      blurb: 'Manual & automated testing foundations.',
      link: '/navigation',
    },
    {
      icon: 'hub',
      title: 'Data & Cloud Basics',
      blurb: 'Data workflows, CI/CD, containers.',
      link: '/navigation',
    },
  ];

  badges = ['Mentor-led', 'Project-first', 'Career-oriented'];
}
