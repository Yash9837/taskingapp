/**
 * Script to add more tasks to "B2B Jewellery Project" assigned to Sanidhya.
 * Run: node scripts/setup-sanidhya-tasks.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyA3kQel4_TNEYfEhJfVXv5PN2_VWqG9q5Q',
    authDomain: 'taskingapp-cb993.firebaseapp.com',
    projectId: 'taskingapp-cb993',
    storageBucket: 'taskingapp-cb993.firebasestorage.app',
    messagingSenderId: '373091679479',
    appId: '1:373091679479:web:2b0825dbdbdb8aa497e7f2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const YASH_UID = 'Ktv0364lyIcop2blOn6N6gyXlq62';
const SANIDHYA_UID = 'e3863h5bbtZSgNNzNlzRjRAt78i1';
const PROJECT_ID = '5hi3f0Mz0KsK68H6N1wW';

const tasks = [
    {
        title: '3.1 Sales Dashboard [Not Started]',
        description: 'An intuitive sales dashboard is required to give sales representatives visibility into their performance and pipeline.\n\n• Design intuitive dashboard with sales metrics\n• Add pipeline visualization\n• Include performance against targets tracking\n• Implement lead/conversion tracking',
        status: 'todo',
        priority: 'medium',
        assignedTo: SANIDHYA_UID,
        assignedBy: YASH_UID,
    },
    {
        title: '3.2 Quote Request Pages [Needs Rework]',
        description: 'The quote request pages need a UI redesign for improved usability and efficiency.\n\n• Redesign UI for improved usability\n• Implement quick-quote functionality\n• Add template-based quote generation\n• Include product/service catalog integration',
        status: 'todo',
        priority: 'medium',
        assignedTo: SANIDHYA_UID,
        assignedBy: YASH_UID,
    },
    {
        title: '3.3 Commission Management [Not Started]',
        description: 'A complete commission management system is needed with multi-user support and role-based access.\n\n• Implement multi-user login system with role-based access\n• Create individual sales representative profiles\n• Add commission structure configuration\n• Implement automated commission calculations\n• Include commission reports and statements',
        status: 'todo',
        priority: 'high',
        assignedTo: SANIDHYA_UID,
        assignedBy: YASH_UID,
    },
    {
        title: '3.4 Order Processing Workflow [Needs Rework]',
        description: 'The order processing workflow needs to be streamlined with integrated payment and shipment tracking.\n\n• Streamline "Accept and Create Order" process\n• Implement integrated payment gateway\n• Add shipment tracking integration\n• Create delivery confirmation workflow\n• Include automated customer notifications',
        status: 'todo',
        priority: 'medium',
        assignedTo: SANIDHYA_UID,
        assignedBy: YASH_UID,
    }
];

async function setup() {
    try {
        console.log('Adding Sanidhya to Project Members (if not already)...');
        const projectRef = doc(db, 'projects', PROJECT_ID);
        await updateDoc(projectRef, {
            members: arrayUnion(SANIDHYA_UID)
        });
        console.log('✅ Project members updated');

        for (const task of tasks) {
            console.log(`Creating task: ${task.title}...`);
            const taskToSave = {
                ...task,
                projectId: PROJECT_ID,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addDoc(collection(db, 'tasks'), taskToSave);
            console.log(`  ✅ Task created`);
        }

        console.log('\nSanidhya setup complete! 🚀');
        process.exit(0);
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

setup();
