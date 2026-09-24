export function calculateMochiType(birthday: string): number {
  const digits = birthday.replace(/\D/g, '').split('').map(Number);
  if (!digits.length) return 1;
  let value = digits.reduce((sum, digit) => sum + digit, 0);
  while (value > 9) value = String(value).split('').reduce((sum, digit) => sum + Number(digit), 0);
  return value || 9;
}
