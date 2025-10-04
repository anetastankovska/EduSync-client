import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const PROGRAMS = [
  {
    id: 'frontend',
    title: 'Frontend Development',
    description:
      'Learn to create beautiful, responsive user interfaces using web technologies.',
    topics: ['HTML', 'CSS', 'JavaScript', 'Frameworks', 'Design Systems'],
    fit: {
      interest: 'Building websites & interfaces',
      experience: ['No experience', 'Some experience'],
      enjoy: ['Creative visual design', 'Immediate feedback'],
      career: ['Web designer', 'Frontend developer'],
      workplace: ['Startup', 'Agency', 'Freelance'],
    },
  },
  {
    id: 'backend',
    title: 'Backend & APIs',
    description:
      'Design secure, scalable servers and APIs powering modern apps.',
    topics: ['Databases', 'APIs', 'Node.js', 'Authentication', 'Architecture'],
    fit: {
      interest: 'Building logic & infrastructure',
      experience: ['Some experience', 'Professional experience'],
      enjoy: ['Problem solving', 'Automation'],
      career: ['Software engineer', 'Backend developer'],
      workplace: ['Enterprise', 'Startup'],
    },
  },
  {
    id: 'qa',
    title: 'QA & Testing',
    description:
      'Ensure code quality and reliability using modern testing tools.',
    topics: ['Testing strategies', 'Automation', 'Bug Tracking', 'CI/CD'],
    fit: {
      interest: 'Ensuring software works',
      experience: ['No experience', 'Some experience'],
      enjoy: ['Finding issues', 'Improving quality'],
      career: ['QA specialist', 'Test engineer'],
      workplace: ['Enterprise', 'Agency'],
    },
  },
  {
    id: 'data_cloud',
    title: 'Data & Cloud Basics',
    description:
      'Explore data analysis, databases, and cloud computing fundamentals.',
    topics: ['SQL', 'Data Analysis', 'Cloud Platforms', 'Containers'],
    fit: {
      interest: 'Working with data & systems',
      experience: ['No experience', 'Professional experience'],
      enjoy: ['Organizing data', 'Powering apps'],
      career: ['Data analyst', 'DevOps'],
      workplace: ['Enterprise', 'Startup'],
    },
  },
];

const QUIZ = [
  {
    key: 'interest',
    question: 'Which type of work excites you most?',
    options: [
      'Building websites & interfaces',
      'Building logic & infrastructure',
      'Ensuring software works',
      'Working with data & systems',
    ],
    type: 'radio',
  },
  {
    key: 'experience',
    question: 'What is your coding experience?',
    options: ['No experience', 'Some experience', 'Professional experience'],
    type: 'radio',
  },
  {
    key: 'enjoy',
    question: 'What do you enjoy most?',
    options: [
      'Creative visual design',
      'Immediate feedback',
      'Problem solving',
      'Automation',
      'Finding issues',
      'Improving quality',
      'Organizing data',
      'Powering apps',
    ],
    type: 'radio',
  },
  {
    key: 'career',
    question: 'Which career paths interest you?',
    options: [
      'Web designer',
      'Frontend developer',
      'QA specialist',
      'Test engineer',
      'Software engineer',
      'Backend developer',
      'Data analyst',
      'DevOps',
    ],
    type: 'checkbox',
  },
  {
    key: 'workplace',
    question: 'Preferred workplace setting?',
    options: ['Startup', 'Agency', 'Enterprise', 'Freelance'],
    type: 'radio',
  },
];

@Component({
  selector: 'app-interest-quiz',
  standalone: true,
  templateUrl: './interest-quiz.component.html',
  styleUrls: ['./interest-quiz.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatCheckboxModule,
  ],
})
export class InterestQuizComponent {
  quiz = QUIZ;
  programs = PROGRAMS;
  form: FormGroup;
  recommended: any[] = [];
  finished = false;

  constructor(private fb: FormBuilder) {
    let controls: any = {};
    this.quiz.forEach((q) => {
      controls[q.key] = [
        q.type === 'checkbox' ? [] : null,
        Validators.required,
      ];
    });
    this.form = this.fb.group(controls);
  }

  submit() {
    const ans = this.form.value;
    this.recommended = this.programs
      .map((p) => {
        let score = 0;
        if (p.fit.interest === ans.interest) score += 2;
        if (p.fit.experience.includes(ans.experience)) score += 1;
        if (p.fit.enjoy.includes(ans.enjoy)) score += 1;
        if (
          Array.isArray(ans.career) &&
          ans.career.some((c: any) => p.fit.career.includes(c))
        )
          score += 1;
        if (p.fit.workplace.includes(ans.workplace)) score += 1;
        return { ...p, score };
      })
      .filter((p) => p.score > 2)
      .sort((a, b) => b.score - a.score);
    this.finished = true;
  }

  reset() {
    // Reset the form with all fields set to their initial (null or empty array for checkboxes) value
    const newFormState: any = {};
    this.quiz.forEach((q) => {
      newFormState[q.key] = q.type === 'checkbox' ? [] : null;
    });
    this.form.reset(newFormState);

    // Also reset recommended results and finished state
    this.recommended = [];
    this.finished = false;
  }

  onCheckboxChange(event: any, key: string, value: string) {
    const current = this.form.value[key] as string[];
    if (event.checked) {
      this.form.patchValue({ [key]: [...current, value] });
    } else {
      this.form.patchValue({
        [key]: current.filter((c: string) => c !== value),
      });
    }
  }
}
