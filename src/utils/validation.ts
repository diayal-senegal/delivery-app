export const validatePhone = (phone: string): boolean => {
  const senegalPhoneRegex = /^(\+221|221)?[0-9]{9}$/;
  return senegalPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Valider un mot de passe robuste
 * - Minimum 8 caractères
 * - Au moins 1 majuscule
 * - Au moins 1 chiffre
 * - Au moins 1 caractère spécial
 */
export const validateStrongPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Minimum 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins 1 majuscule (A-Z)');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Au moins 1 chiffre (0-9)');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) {
    errors.push('Au moins 1 caractère spécial (!@#$%...)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const sanitizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\s/g, '').replace(/^\+/, '');
  if (cleaned.startsWith('221')) {
    cleaned = cleaned.substring(3);
  }
  return cleaned;
};
