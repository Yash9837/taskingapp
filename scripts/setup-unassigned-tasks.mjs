/**
 * Script to add unassigned tasks to "B2B Jewellery Project".
 * Run: node scripts/setup-unassigned-tasks.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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
const PROJECT_ID = '5hi3f0Mz0KsK68H6N1wW';

const tasks = [
    {
        title: '1.1 Enhanced Article Detail Pages [Needs Rework]',
        description: 'The article detail pages for "best match" results need significant content and functionality enhancements to provide buyers with comprehensive, platform-specific information.\n\n• Expand content depth for "best match" articles\n• Implement multi-image galleries with optimized loading and zoom\n• Add detailed product specifications section with structured data\n• Integrate user reviews and ratings where available\n• Ensure responsive layout across all device types',
        status: 'todo',
        priority: 'high',
        assignedTo: '',
        assignedBy: YASH_UID,
    },
    {
        title: '1.2 Cart Functionality Upgrades [Needs Rework]',
        description: 'The current cart experience lacks essential e-commerce functionality. The following enhancements are required:\n\n• Implement detailed cart view with line-item breakdown\n• Add quantity adjustments with real-time price updates\n• Include shipping estimates and tax calculations\n• Add save for later / wishlist functionality\n• Implement cart persistence across sessions\n• Add promotional code application\n• Include estimated delivery dates per item',
        status: 'todo',
        priority: 'medium',
        assignedTo: '',
        assignedBy: YASH_UID,
    },
    {
        title: '1.3 My Quotations Interface Overhaul [Needs Rework]',
        description: 'The quotations interface requires a complete redesign to improve usability, data visualization, and overall reliability.\n\n• Redesign UI for improved data visualization and readability\n• Implement comprehensive quotation details view\n• Fix image loading issues with proper lazy loading\n• Add filtering and sorting capabilities\n• Include quotation status tracking with visual indicators\n• Add export/download functionality for quotations',
        status: 'todo',
        priority: 'medium',
        assignedTo: '',
        assignedBy: YASH_UID,
    },
    {
        title: '4.1 Administrative Controls [Not Started]',
        description: 'Full system oversight and monitoring capabilities need to be built to enable the super admin to manage the entire platform effectively.\n\n• Full system oversight and monitoring capabilities\n• User management console for sales and operations\n• Permission and role configuration\n• System-wide settings management',
        status: 'todo',
        priority: 'high',
        assignedTo: '',
        assignedBy: YASH_UID,
    },
    {
        title: '4.2 Cross-Department Management [Not Started]',
        description: 'Cross-department visibility and management tools are needed for effective business oversight.\n\n• Monitor all workflows across departments\n• Generate comprehensive business reports\n• Implement approval workflows where needed\n• Configure commission structures and rules',
        status: 'todo',
        priority: 'medium',
        assignedTo: '',
        assignedBy: YASH_UID,
    }
];

async function setup() {
    try {
        for (const task of tasks) {
            console.log(`Creating unassigned task: ${task.title}...`);
            const taskToSave = {
                ...task,
                projectId: PROJECT_ID,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addDoc(collection(db, 'tasks'), taskToSave);
            console.log(`  ✅ Task created`);
        }

        console.log('\nUnassigned tasks setup complete! 🚀');
        process.exit(0);
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

setup();
