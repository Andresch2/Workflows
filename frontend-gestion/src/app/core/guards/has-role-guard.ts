import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const hasRoleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: number[] = route.data['roles'];
  const user = authService.currentUser();

  if (user && user.role && expectedRoles.includes(user.role.id)) {
    return true;
  }

  router.navigate(['/auth/access']);
  return false;
};
