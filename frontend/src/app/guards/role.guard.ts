import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data['roles'] as string[] | undefined) ?? [];

  if (allowedRoles.length === 0 || authService.hasAnyRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
