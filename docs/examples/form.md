# Form Handling Example

Complete form with validation using map stores.

## Form State

```typescript
import { map, setKey, computed } from '@sylphx/zen';

const formData = map({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
});

const formErrors = map({
  name: null as string | null,
  email: null as string | null,
  password: null as string | null,
  confirmPassword: null as string | null
});

const formTouched = map({
  name: false,
  email: false,
  password: false,
  confirmPassword: false
});
```

## Validation

```typescript
function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
}

function validateConfirmPassword(
  password: string,
  confirm: string
): string | null {
  if (!confirm) return 'Please confirm password';
  if (password !== confirm) return 'Passwords do not match';
  return null;
}
```

## Real-time Validation

```typescript
import { subscribe } from '@sylphx/zen';

// Validate on change (after touched)
subscribe(formData, (data) => {
  if (formTouched.value.name) {
    setKey(formErrors, 'name', validateName(data.name));
  }
  if (formTouched.value.email) {
    setKey(formErrors, 'email', validateEmail(data.email));
  }
  if (formTouched.value.password) {
    setKey(formErrors, 'password', validatePassword(data.password));
  }
  if (formTouched.value.confirmPassword) {
    setKey(
      formErrors,
      'confirmPassword',
      validateConfirmPassword(data.password, data.confirmPassword)
    );
  }
});
```

## Form Valid State

```typescript
const isFormValid = computed([formData, formErrors], (data, errors) => {
  // Check all fields filled
  if (!data.name || !data.email || !data.password || !data.confirmPassword) {
    return false;
  }

  // Check terms agreed
  if (!data.agreeToTerms) return false;

  // Check no errors
  return !errors.name && !errors.email && !errors.password && !errors.confirmPassword;
});
```

## React Component

```tsx
import { useStore } from '@sylphx/zen-react';

export function SignupForm() {
  const data = useStore(formData);
  const errors = useStore(formErrors);
  const touched = useStore(formTouched);
  const isValid = useStore(isFormValid);

  const handleChange = (field: keyof typeof data) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox'
      ? e.target.checked
      : e.target.value;
    setKey(formData, field, value as any);
  };

  const handleBlur = (field: keyof typeof touched) => () => {
    setKey(formTouched, field, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    try {
      await api.signup(data);
      alert('Signup successful!');
    } catch (err) {
      alert('Signup failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name</label>
        <input
          type="text"
          value={data.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
        />
        {touched.name && errors.name && (
          <span className="error">{errors.name}</span>
        )}
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={data.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
        />
        {touched.email && errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={data.password}
          onChange={handleChange('password')}
          onBlur={handleBlur('password')}
        />
        {touched.password && errors.password && (
          <span className="error">{errors.password}</span>
        )}
      </div>

      <div>
        <label>Confirm Password</label>
        <input
          type="password"
          value={data.confirmPassword}
          onChange={handleChange('confirmPassword')}
          onBlur={handleBlur('confirmPassword')}
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <span className="error">{errors.confirmPassword}</span>
        )}
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={data.agreeToTerms}
            onChange={handleChange('agreeToTerms')}
          />
          I agree to the terms and conditions
        </label>
      </div>

      <button type="submit" disabled={!isValid}>
        Sign Up
      </button>
    </form>
  );
}
```

## Next Steps

- [Data Fetching Example](/examples/fetching)
- [Map Stores Guide](/guide/maps)
- [Form Validation Patterns](/guide/computed#form-validation)
