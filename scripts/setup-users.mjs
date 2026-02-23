/**
 * Setup script to create Firebase Auth users and Firestore user documents.
 * Run: node scripts/setup-users.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyA3kQel4_TNEYfEhJfVXv5PN2_VWqG9q5Q',
    authDomain: 'taskingapp-cb993.firebaseapp.com',
    projectId: 'taskingapp-cb993',
    storageBucket: 'taskingapp-cb993.firebasestorage.app',
    messagingSenderId: '373091679479',
    appId: '1:373091679479:web:2b0825dbdbdb8aa497e7f2',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
    {
        email: 'gurpal@taskflow.com',
        password: 'Admin@123',
        displayName: 'Gurpal Singh',
        role: 'admin',
    },
    {
        email: 'yash@taskflow.com',
        password: 'Manager@123',
        displayName: 'Yash Gupta',
        role: 'manager',
    },
    {
        email: 'priyanshu@taskflow.com',
        password: 'Member@123',
        displayName: 'Priyanshu',
        role: 'member',
    },
    {
        email: 'sanidhya@taskflow.com',
        password: 'Member@123',
        displayName: 'Sanidhya',
        role: 'member',
    },
];

async function createUser(userData) {
    try {
        console.log(`Creating user: ${userData.displayName} (${userData.email})...`);

        const result = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const user = result.user;

        // Update display name in Firebase Auth
        await updateProfile(user, { displayName: userData.displayName });

        // Create Firestore user document
        const userDoc = {
            uid: user.uid,
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
            createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);

        console.log(`  ✅ Created: ${userData.displayName} | Role: ${userData.role} | UID: ${user.uid}`);
        return true;
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log(`  ⚠️  Skipped: ${userData.email} — already exists`);
        } else {
            console.error(`  ❌ Error: ${userData.displayName} — ${error.message}`);
        }
        return false;
    }
}

async function main() {
    console.log('====================================');
    console.log('  TaskFlow — User Setup Script');
    console.log('====================================\n');

    for (const userData of users) {
        await createUser(userData);
    }

    console.log('\n====================================');
    console.log('  Login Credentials');
    console.log('====================================');
    console.log('  Admin:   gurpal@taskflow.com / Admin@123');
    console.log('  Manager: yash@taskflow.com / Manager@123');
    console.log('  Member:  priyanshu@taskflow.com / Member@123');
    console.log('  Member:  sanidhya@taskflow.com / Member@123');
    console.log('====================================\n');

    process.exit(0);
}

main();
