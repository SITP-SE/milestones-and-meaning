'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/lib/firebase/client';

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      // The Firebase client login only exists long enough to obtain an ID token.
      // The server-managed HttpOnly cookie becomes the real admin session.
      await setPersistence(auth, inMemoryPersistence);

      const credential = await signInWithEmailAndPassword(auth, email, password);

      // Force a fresh token so newly assigned custom claims, such as
      // `admin: true`, are included in the token sent to the server.
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        // Keep authentication errors intentionally generic.
        // We should not reveal whether an email exists or lacks admin access.
        throw new Error('Unable to sign in.');
      }

      // Once the server session exists, the Firebase client session is no
      // longer needed. Protected pages will rely on the HttpOnly cookie.
      await auth.signOut();

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Unable to sign in. Check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
