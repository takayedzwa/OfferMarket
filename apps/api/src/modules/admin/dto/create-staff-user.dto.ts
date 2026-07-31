import { IsEmail, IsString, MinLength, Matches, IsIn, IsOptional } from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_MSG } from '../../auth/dto/auth.dto';

/**
 * DTO for POST /admin/users/staff — create an ADMIN or SUPPORT user from the
 * admin console. ADMIN-only (guarded by AdminGuard on the controller).
 *
 * `role` is restricted to ADMIN/SUPPORT so the endpoint cannot mint arbitrary
 * WORKER/EMPLOYER accounts (those have their own self-service registration).
 * First/last name are required so staff accounts are identifiable; phone is
 * optional (and must be unique across users when provided).
 */
export class CreateStaffUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @IsIn(['ADMIN', 'SUPPORT'])
  role!: 'ADMIN' | 'SUPPORT';

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @IsOptional()
  phone?: string;
}