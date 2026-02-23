/**
 * Script to create "B2B Jewellery Project" and assign tasks to Priyanshu.
 * Run: node scripts/setup-b2b-tasks.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

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
const PRIYANSHU_UID = 'mzPQRWMJLcckkpWnJAhOLHw8po53';

const projectData = {
    name: 'B2B Jewellery Project',
    description: 'A dedicated project for B2B jewellery operations and management.',
    status: 'active',
    createdBy: YASH_UID,
    members: [YASH_UID, PRIYANSHU_UID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const tasks = [
    {
        title: '2.1 Validation Page UI/UX [Needs Rework]',
        description: 'The validation interface needs a complete redesign to improve workflow efficiency and reduce processing time for the operations team.\n\n• Redesign validation interface for improved workflow efficiency\n• Implement clear visual hierarchy and status indicators\n• Add batch validation capabilities\n• Include detailed validation reports with actionable insights',
        status: 'todo',
        priority: 'high',
        assignedTo: PRIYANSHU_UID,
        assignedBy: YASH_UID,
    },
    {
        title: '2.2 Operations Dashboard [Not Started]',
        description: 'A comprehensive dashboard is needed to give the operations team real-time visibility into key performance metrics and tasks.\n\n• Create comprehensive dashboard with key performance metrics\n• Add real-time order monitoring\n• Implement task prioritization views\n• Include workflow automation triggers',
        status: 'todo',
        priority: 'medium',
        assignedTo: PRIYANSHU_UID,
        assignedBy: YASH_UID,
    },
    {
        title: '2.3 Validation Reports [Needs Rework]',
        description: 'The current report layout does not support effective data analysis. The following improvements are needed:\n\n• Redesign report layout for better data presentation\n• Add customizable report parameters\n• Implement export functionality (PDF, Excel, CSV)\n• Include visual data representations (charts, graphs)',
        status: 'todo',
        priority: 'medium',
        assignedTo: PRIYANSHU_UID,
        assignedBy: YASH_UID,
    },
    {
        title: '2.4 Sales Forwarding Process [Not Started]',
        description: 'A professional sales assignment workflow needs to be implemented to manage sales forwarding and commission tracking.\n\n• Implement professional sales assignment workflow\n• Add commission calculation engine for sales representatives\n• Create sales rep performance tracking\n• Implement automated commission reporting',
        status: 'todo',
        priority: 'medium',
        assignedTo: PRIYANSHU_UID,
        assignedBy: YASH_UID,
    },
    {
        title: '2.5 Order Management & Fulfillment [Not Started]',
        description: 'The order management process needs to be streamlined with proper inventory integration and tracking capabilities.\n\n• Streamline order processing workflow\n• Implement inventory integration\n• Add shipment tracking capabilities\n• Create fulfillment status dashboard',
        status: 'todo',
        priority: 'medium',
        assignedTo: PRIYANSHU_UID,
        assignedBy: YASH_UID,
    }
];

async function setup() {
    try {
        console.log('Creating B2B Jewellery Project...');
        const projectRef = await addDoc(collection(db, 'projects'), projectData);
        const projectId = projectRef.id;
        console.log(`✅ Project created with ID: ${projectId}`);

        for (const task of tasks) {
            console.log(`Creating task: ${task.title}...`);
            const taskToSave = {
                ...task,
                projectId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addDoc(collection(db, 'tasks'), taskToSave);
            console.log(`  ✅ Task created`);
        }

        console.log('\nSetup complete! 🚀');
        process.exit(0);
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

setup();
