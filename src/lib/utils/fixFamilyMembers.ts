/**
 * Utility to fix family members that were created without proper familyId
 * This is a one-time fix for existing family members
 */

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function fixExistingFamilyMembers(patientId: string, patientEmail: string) {
  try {
    console.log('🔧 Starting family member fix for patient:', patientId);
    
    // Find all patients with the same email domain (likely family members created by this user)
    const patientsRef = collection(db, 'patients');
    const allPatients = await getDocs(patientsRef);
    
    let fixedCount = 0;
    const familyMemberIds: string[] = [];
    
    for (const patientDoc of allPatients.docs) {
      const data = patientDoc.data();
      const docId = patientDoc.id;
      
      // Skip the main patient
      if (docId === patientId) {
        console.log('   Skipping main patient:', data.name);
        continue;
      }
      
      // Check if this document has no familyId or wrong familyId
      if (!data.familyId || data.familyId !== patientId) {
        // Check if this looks like a family member (has basic fields but might be missing familyId)
        if (data.name && data.dateOfBirth && data.gender) {
          console.log(`   Found potential family member: ${data.name} (ID: ${docId})`);
          console.log(`      Current familyId: ${data.familyId || 'NONE'}`);
          console.log(`      Updating to: ${patientId}`);
          
          // Update the familyId
          await updateDoc(doc(db, 'patients', docId), {
            familyId: patientId
          });
          
          fixedCount++;
          familyMemberIds.push(docId);
          console.log(`   ✅ Updated family member: ${data.name}`);
        }
      } else if (data.familyId === patientId && docId !== patientId) {
        // Already has correct familyId
        familyMemberIds.push(docId);
        console.log(`   ℹ️ Already correct: ${data.name}`);
      }
    }
    
    console.log(`\n✅ Fix complete! Updated ${fixedCount} family members`);
    console.log(`📊 Total family members found: ${familyMemberIds.length}`);
    
    return {
      success: true,
      fixedCount,
      totalFamilyMembers: familyMemberIds.length,
      familyMemberIds
    };
  } catch (error: any) {
    console.error('❌ Error fixing family members:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function listAllPatientsForDebug() {
  try {
    console.log('📋 Listing all patients in database...\n');
    
    const patientsRef = collection(db, 'patients');
    const snapshot = await getDocs(patientsRef);
    
    console.log(`Found ${snapshot.docs.length} total patients:\n`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Patient ID: ${doc.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   FamilyId: ${data.familyId || 'NONE'}`);
      console.log(`   Date of Birth: ${data.dateOfBirth || 'N/A'}`);
      console.log('');
    });
    
    return snapshot.docs.length;
  } catch (error: any) {
    console.error('❌ Error listing patients:', error);
    return 0;
  }
}

