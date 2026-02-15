/**
 * Firebase Admin initialization.
 *
 * IMPORTANT: This module MUST be imported before any module that
 * uses Firebase Admin services (getFirestore, getAuth, etc.) at
 * the top level. ES modules evaluate imports before module body
 * code, so initializeApp() must live in its own module to ensure
 * it runs first in the dependency graph.
 */

import { initializeApp } from 'firebase-admin/app';

initializeApp();
