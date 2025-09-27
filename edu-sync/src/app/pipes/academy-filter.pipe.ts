import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'academyFilter', standalone: true })
export class AcademyFilterPipe implements PipeTransform {
  transform(items: any[], academyId?: number) {
    return academyId
      ? (items || []).filter((i) => i.academyId === academyId)
      : [];
  }
}
