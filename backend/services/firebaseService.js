const admin = require("firebase-admin");

let db = null;

const path = require("path");
const fs = require("fs");

async function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccountPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS
      : path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Firebase credentials file not found at ${serviceAccountPath}`);
    }

    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    throw new Error("Firebase credentials are not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT.");
  }

  db = admin.firestore();
}

function getDb() {
  if (!db) {
    throw new Error("Firebase has not been initialized.");
  }
  return db;
}

async function saveReport(uid, roundKey, report) {
  const firestore = getDb();
  const reportRef = firestore.collection("users").doc(uid).collection("reports").doc(roundKey);
  await reportRef.set(report, { merge: true });
}

async function updateRoundStatus(uid, roundKey, completed, score) {
  const firestore = getDb();
  const roundRef = firestore.collection("users").doc(uid).collection("rounds").doc(roundKey);
  await roundRef.set(
    {
      completed: Boolean(completed),
      score: Number.isFinite(score) ? score : 0,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function getUserReports(uid) {
  const firestore = getDb();
  const reportSnapshot = await firestore.collection("users").doc(uid).collection("reports").get();
  const reports = [];

  reportSnapshot.forEach((doc) => {
    reports.push({ uid, roundKey: doc.id, ...doc.data() });
  });

  return reports;
}

async function resetUserProgress(uid) {
  const firestore = getDb();
  const reportCollection = firestore.collection("users").doc(uid).collection("reports");
  const roundCollection = firestore.collection("users").doc(uid).collection("rounds");

  const [reportSnapshot, roundSnapshot] = await Promise.all([reportCollection.get(), roundCollection.get()]);

  const deletePromises = [];
  reportSnapshot.forEach((doc) => {
    deletePromises.push(reportCollection.doc(doc.id).delete());
  });
  roundSnapshot.forEach((doc) => {
    deletePromises.push(roundCollection.doc(doc.id).delete());
  });

  await Promise.all(deletePromises);
}

module.exports = {
  initFirebase,
  saveReport,
  updateRoundStatus,
  getUserReports,
  resetUserProgress,
};
