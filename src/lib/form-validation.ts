export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (password.length > 128) {
    return "Password must be less than 128 characters";
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) {
    return "Name is required";
  }
  if (name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  if (name.trim().length > 100) {
    return "Name must be less than 100 characters";
  }
  return null;
}

export function validateTicketTitle(title: string): string | null {
  if (!title.trim()) {
    return "Title is required";
  }
  if (title.trim().length < 3) {
    return "Title must be at least 3 characters";
  }
  if (title.trim().length > 200) {
    return "Title must be less than 200 characters";
  }
  return null;
}

export function validateTicketDescription(description: string): string | null {
  if (!description.trim()) {
    return "Description is required";
  }
  if (description.trim().length < 10) {
    return "Description must be at least 10 characters";
  }
  if (description.trim().length > 2000) {
    return "Description must be less than 2000 characters";
  }
  return null;
}

export function validateLoginForm(
  email: string,
  password: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const emailError = validateEmail(email);
  if (emailError) {
    errors.push({ field: "email", message: emailError });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.push({ field: "password", message: passwordError });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateSignupForm(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = validateName(name);
  if (nameError) {
    errors.push({ field: "name", message: nameError });
  }

  const emailError = validateEmail(email);
  if (emailError) {
    errors.push({ field: "email", message: emailError });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.push({ field: "password", message: passwordError });
  }

  if (password !== confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateTicketForm(
  title: string,
  description: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const titleError = validateTicketTitle(title);
  if (titleError) {
    errors.push({ field: "title", message: titleError });
  }

  const descriptionError = validateTicketDescription(description);
  if (descriptionError) {
    errors.push({ field: "description", message: descriptionError });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
