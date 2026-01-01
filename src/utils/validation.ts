export const validatePhone = (phone: string): boolean => {
  const senegalPhoneRegex = /^(\+221|221)?[0-9]{9}$/;
  return senegalPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const sanitizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\s/g, '').replace(/^\+/, '');
  if (cleaned.startsWith('221')) {
    cleaned = cleaned.substring(3);
  }
  return cleaned;
};
