import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';
import { cities } from '../data/colleges';

export const initializeColleges = async () => {
  try {
    const collegesRef = ref(database, 'colleges');
    const snapshot = await get(collegesRef);

    // Only initialize if colleges don't exist
    if (!snapshot.exists()) {
      console.log('Initializing colleges in Firebase...');
      
      // Transform the cities data into the Firebase structure
      const collegesData: Record<string, Record<string, { name: string }>> = {};
      
      Object.entries(cities).forEach(([city, collegeList]) => {
        collegesData[city] = {};
        collegeList.forEach((collegeName, index) => {
          // Use a simple key based on index
          const key = `college_${index}`;
          collegesData[city][key] = { name: collegeName };
        });
      });

      console.log('Writing colleges data to Firebase:', collegesData);
      await set(collegesRef, collegesData);
      console.log('Colleges initialized successfully');
    } else {
      console.log('Colleges already exist in Firebase');
      const existingData = snapshot.val();
      console.log('Existing colleges:', existingData);
    }
  } catch (error) {
    console.error('Error initializing colleges:', error);
  }
};
