// Telo za promenu lozinke
export interface ChangePasswordBody {
  oldPassword: string;
  newPassword: string;
  newPasswordRepeat: string;
}
