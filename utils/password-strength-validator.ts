export const validatePasswordStrength = (password: string) => {
  const minLength = 8
  const hasMinLength = password.length >= minLength
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const startsWithUppercase = /^[A-Z]/.test(password)

  // Calculate score (0-4)
  let score = 0
  if (hasMinLength) score++
  if (hasUppercase && hasLowercase) score++
  if (hasNumber) score++
  if (hasSpecialChar) score++

  // Minimum requirements for validity
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && startsWithUppercase

  return {
    isValid,
    score,
    feedback: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      startsWithUppercase,
    },
  }
}
