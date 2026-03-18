/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocFromServer,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  limit,
  updateDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { 
  LogOut, 
  User, 
  Library, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Loader2,
  Clock,
  BookOpen,
  School,
  GraduationCap,
  Search,
  Monitor,
  Smartphone,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Users as UsersIcon,
  History,
  ShieldAlert,
  ShieldCheck,
  Check,
  FileDown,
  UserX,
  UserCheck,
  UserMinus,
  Settings,
  Eye,
  Wifi,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { exportToPDF } from './utils/pdfExport';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Data: Colleges and Programs
const COLLEGES_DATA = [
  {
    name: "College of Agriculture",
    programs: ["Bachelor of Science in Agriculture"]
  },
  {
    name: "College of Arts and Sciences",
    programs: [
      "Bachelor of Arts in Economics",
      "Bachelor of Arts in Political Science",
      "Bachelor of Science in Biology",
      "Bachelor of Science in Psychology",
      "Bachelor of Public Administration"
    ]
  },
  {
    name: "College of Business Administration",
    programs: [
      "Bachelor of Science in Accountancy",
      "Bachelor of Science in Accounting Information System",
      "Bachelor of Science in Business Administration Major in Financial Management",
      "Bachelor of Science in Business Administration Major in Human Resource Development Management",
      "Bachelor of Science in Business Administration Major in Legal Management",
      "Bachelor of Science in Business Administration Major in Marketing Management",
      "Bachelor of Science in Entrepreneurship",
      "Bachelor of Science in Real Estate Management"
    ]
  },
  {
    name: "College of Communication",
    programs: [
      "Bachelor of Arts in Broadcasting",
      "Bachelor of Arts in Communication",
      "Bachelor of Arts in Journalism"
    ]
  },
  {
    name: "College of Informatics and Computing Studies",
    programs: [
      "Bachelor of Library and Information Science",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Digital Animation Technology",
      "Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Game Development",
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Information System"
    ]
  },
  {
    name: "College of Criminology",
    programs: ["Bachelor of Science in Criminology"]
  },
  {
    name: "College of Education",
    programs: [
      "Bachelor of Elementary Education",
      "Bachelor of Elementary Education with Specialization in Preschool Education",
      "Bachelor of Elementary Education with Specialization in Special Education",
      "Bachelor of Secondary Education Major in Music, Arts, and Physical Education",
      "Bachelor of Secondary Education Major in English",
      "Bachelor of Secondary Education Major in Filipino",
      "Bachelor of Secondary Education Major in Mathematics",
      "Bachelor of Secondary Education Major in Science",
      "Bachelor of Secondary Education Major in Social Studies",
      "Bachelor of Secondary Education Major in Technology and Livelihood Education"
    ]
  },
  {
    name: "College of Engineering and Architecture",
    programs: [
      "Bachelor of Science in Architecture",
      "Bachelor of Science in Astronomy",
      "Bachelor of Science in Civil Engineering",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Electronics Engineering",
      "Bachelor of Science in Industrial Engineering",
      "Bachelor of Science in Mechanical Engineering"
    ]
  },
  {
    name: "College of Medical Technology",
    programs: ["Bachelor of Science in Medical Technology"]
  },
  {
    name: "College of Midwifery",
    programs: ["Diploma in Midwifery"]
  },
  {
    name: "College of Music",
    programs: [
      "Bachelor of Music in Choral Conducting",
      "Bachelor of Music in Music Education",
      "Bachelor of Music in Piano",
      "Bachelor of Music in Voice"
    ]
  },
  {
    name: "College of Nursing",
    programs: ["Bachelor of Science in Nursing"]
  },
  {
    name: "College of Physical Therapy",
    programs: [
      "Bachelor of Science in Respiratory Therapy",
      "Bachelor of Science in Physical Therapy"
    ]
  },
  {
    name: "School of International Relations",
    programs: ["Bachelor of Arts in Foreign Service"]
  }
];

// Types
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  college: string;
  program: string;
  role: 'student' | 'staff';
  isApproved?: boolean;
  isAdmin: boolean;
  isEmployee?: boolean;
  isBlocked?: boolean;
  createdAt: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

interface LibraryLog {
  id: string;
  uid: string;
  name: string;
  email: string;
  college: string;
  program: string;
  reason: string;
  timestamp: any;
  status: 'pending' | 'validated' | 'blocked';
  validatedBy?: string;
  validatedAt?: any;
  isPreview?: boolean;
}

type DateFilter = 'today' | 'weekly' | 'monthly' | 'custom';

const REASONS = [
  "Reading", 
  "Research", 
  "Studying", 
  "Use of Computer", 
  "Printing/Photocopying", 
  "Borrowing/Returning Books", 
  "Group Study", 
  "WiFi Access", 
  "Visiting the NEU Museum", 
  "More"
];
const DEFAULT_ADMIN_EMAILS = ["angelyn.bondoc@neu.edu.ph", "jcesperanza@neu.edu.ph"];
const isDefaultAdminEmail = (email?: string | null) => !!email && DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());

const NEU_LOGO = "https://scontent.fmnl17-6.fna.fbcdn.net/v/t39.30808-6/587748546_122156030186743934_2851142283168601511_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=XcurpbSYAxYQ7kNvwH4Jml7&_nc_oc=AdlaQg5JYJusEkjkJAxBPbop4uek1nntno4w8llnNy84Le6bWNhZpxwv1sGbPDB-nZc&_nc_zt=23&_nc_ht=scontent.fmnl17-6.fna&_nc_gid=1L5oGNhcvxhBfW0XcX5mYA&_nc_ss=8&oh=00_AfzVckmuGO5EBdWEdvI1PLdw-rMUucAl_5AZYPl4tc8a1Q&oe=69BC8A35";
const LIB_LOGO = NEU_LOGO;

// Searchable Select Component
interface SearchableSelectProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

function SearchableSelect({ label, icon, options, value, onChange, placeholder, disabled }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2 relative">
      <label className="text-xs uppercase tracking-widest font-bold text-neu-blue/60 flex items-center gap-2">
        {icon} {label}
      </label>
      
      <div 
        className={cn(
          "w-full bg-neu-white border-2 border-transparent rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between",
          isOpen ? "border-neu-gold ring-2 ring-neu-gold/20" : "hover:bg-neu-blue/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn("font-semibold text-lg truncate", !value && "text-black/30")}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn("w-5 h-5 text-neu-blue/40 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-neu-blue/5 overflow-hidden max-h-[300px] flex flex-col"
            >
              <div className="p-3 border-b border-neu-blue/5 sticky top-0 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neu-blue/40" />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-neu-white rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neu-gold/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <div
                      key={opt}
                      className={cn(
                        "px-4 py-3 text-sm font-semibold cursor-pointer transition-colors",
                        value === opt ? "bg-neu-blue text-white" : "hover:bg-neu-blue/5 text-neu-blue"
                      )}
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      {opt}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-black/40 text-sm font-medium">
                    No results found
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile Setup State
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<'student' | 'faculty' | null>(null);
  const [facultyRole, setFacultyRole] = useState<'admin' | 'employee' | null>(null);
  const [previewRole, setPreviewRole] = useState<'admin' | 'staff' | 'student' | null>(null);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasAutoDirected, setHasAutoDirected] = useState(false);

  // Library Entry State
  const [selectedReason, setSelectedReason] = useState('');
  const [showSuccessGreeting, setShowSuccessGreeting] = useState(false);

  // Admin Dashboard State
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [adminTab, setAdminTab] = useState<'profile' | 'analytics' | 'users'>('profile');
  const [userFilter, setUserFilter] = useState<'all' | 'pending-admins' | 'pending-employees'>('all');
  const [allLogs, setAllLogs] = useState<LibraryLog[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminLogsLoading, setAdminLogsLoading] = useState(false);

  // Error Handler
  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null, currentUser?: FirebaseUser | null) => {
    // Ignore errors if the user is logging out or not authenticated
    if (!auth.currentUser && !currentUser) return;

    const activeUser = currentUser || auth.currentUser;
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: activeUser?.uid,
        email: activeUser?.email,
        emailVerified: activeUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    
    const errMessage = errInfo.error.toLowerCase();
    console.error("Detailed Firestore Error:", errInfo);
    if (errMessage.includes("permission") || errMessage.includes("insufficient")) {
      if (profile?.isBlocked) {
        setError("Access Denied. Your account has been blocked. Please see the Librarian.");
      } else {
        setError("Access Denied. Please ensure you are using your @neu.edu.ph account and have completed your profile.");
      }
    } else if (errMessage.includes("offline") || errMessage.includes("network")) {
      setError("Network error. Please check your internet connection.");
    } else {
      setError(`Error: ${errInfo.error}`);
    }
  };

  const effectiveProfile = (profile && isDefaultAdminEmail(profile.email) && previewRole) 
    ? { 
        ...profile, 
        role: previewRole === 'student' ? 'student' : 'staff',
        isAdmin: previewRole === 'admin'
      } 
    : profile;

  // Test connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          setError("Firebase connection failed. Check your internet or configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Fetch Admin Logs
  useEffect(() => {
    if (profile?.role !== 'staff' || view !== 'admin') {
      setAllLogs([]);
      return;
    }

    setAdminLogsLoading(true);
    
    // Calculate start date based on filter
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (dateFilter === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateFilter === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (dateFilter === 'custom') {
      startDate = new Date(customDateRange.start);
      startDate.setHours(0, 0, 0, 0);
    }

    let endDate = new Date();
    if (dateFilter === 'custom') {
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    }

    const logsQuery = query(
      collection(db, 'logs'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData: LibraryLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LibraryLog));
      setAllLogs(logsData);
      setAdminLogsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'logs', user);
      setAdminLogsLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.isAdmin, view, dateFilter, customDateRange]);

  // Fetch All Users for Management
  useEffect(() => {
    if (profile?.role !== 'staff' || !profile?.isAdmin || view !== 'admin' || adminTab !== 'users') {
      setAllUsers([]);
      return;
    }

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data()
      } as UserProfile));
      setAllUsers(usersData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users', user);
    });

    return () => unsubscribe();
  }, [profile?.isAdmin, view, adminTab]);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      
      // Clean up previous profile listener if it exists
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (firebaseUser) {
        // Double check email domain on auth state change
        if (firebaseUser.email && !firebaseUser.email.toLowerCase().endsWith("@neu.edu.ph")) {
          auth.signOut();
          setUser(null);
          setProfile(null);
          setError("Access Denied. Please use your @neu.edu.ph institutional account.");
          setLoading(false);
          return;
        }

        setUser(firebaseUser);
        // Real-time profile listener for security
        profileUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            let data = docSnap.data() as UserProfile;
            
            // Force Admin status for Default Admin Email
            if (isDefaultAdminEmail(data.email)) {
              data = { ...data, isAdmin: true, role: 'staff', isApproved: true };
            }
            
            setProfile(data);
            setIsNewUser(false);

            // Auto-direct Staff to Dashboard if approved
            if (data.role === 'staff' && (data.isApproved || isDefaultAdminEmail(data.email)) && !hasAutoDirected) {
              setView('admin');
              setAdminTab('profile');
              setShowSuccessGreeting(true);
              setHasAutoDirected(true);
              setTimeout(() => {
                setShowSuccessGreeting(false);
              }, 3000);
            }

            if (data.isBlocked) {
              setError("Access Denied. Please see the Librarian.");
            } else {
              setError(null);
            }
          } else {
            setIsNewUser(true);
          }
          setLoading(false);
        }, (err) => {
          // Only handle error if we still have a user (prevents error on logout)
          if (auth.currentUser) {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`, firebaseUser);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsNewUser(false);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, [hasAutoDirected]); // Added hasAutoDirected to dependencies to ensure the logic inside works correctly

  const handleLogin = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      
      if (userEmail && !userEmail.toLowerCase().endsWith("@neu.edu.ph")) {
        await auth.signOut();
        setError("Access Denied. Please use your @neu.edu.ph institutional account.");
        return;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError("Failed to sign in with Google.");
    }
  };



  const handleLogout = async () => {
    try {
      await signOut(auth);
      setHasAutoDirected(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation based on user type
    if (userType === 'student') {
      if (!selectedCollege || !selectedProgram) return;
    } else if (userType === 'faculty') {
      if (!facultyRole) return;
    } else {
      return;
    }

    setSubmitting(true);
    setError(null);

    const role = userType === 'student' ? 'student' : 'staff';
    const isDefaultAdmin = isDefaultAdminEmail(user.email);

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || '',
      college: userType === 'student' ? selectedCollege : 'Faculty/Staff',
      program: userType === 'student' ? selectedProgram : (facultyRole === 'admin' ? 'Administration' : 'Library Staff'),
      role: role,
      isApproved: role === 'student' || isDefaultAdmin, // Students and default admin are auto-approved
      isAdmin: facultyRole === 'admin' || isDefaultAdmin,
      isEmployee: facultyRole === 'employee',
      isBlocked: false,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
      setIsNewUser(false);
    } catch (err: any) {
      console.error("Profile setup error:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`, user);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLibraryEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !selectedReason) return;
    
    if (profile.isBlocked) {
      setError("Access Denied. Please see the Librarian.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, 'logs'), {
        uid: user.uid,
        name: profile.displayName,
        email: profile.email,
        college: profile.college,
        program: profile.program,
        reason: selectedReason,
        timestamp: serverTimestamp(),
        status: 'pending',
        isPreview: previewRole === 'student'
      });
      
      setShowSuccessGreeting(true);
      setSelectedReason('');
      
      setTimeout(() => {
        setShowSuccessGreeting(false);
        // Automatically log out students after submission
        if (profile.role === 'student') {
          handleLogout();
        }
      }, 3000);
      
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'logs', user);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBlock = async (targetUid: string, currentStatus: boolean) => {
    if (!profile?.isAdmin) return;

    const targetUser = allUsers.find(u => u.uid === targetUid);
    
    // Only Default Admin can block/unblock other staff members
    if (targetUser?.role === 'staff' && !isDefaultAdminEmail(profile.email)) {
      setError("Only the Super Admin can change the block status of staff members.");
      return;
    }

    // Cannot block the Default Admin
    if (isDefaultAdminEmail(targetUser?.email) && !currentStatus) {
      setError("The Super Admin cannot be blocked.");
      return;
    }

    try {
      await updateDoc(doc(db, 'users', targetUid), {
        isBlocked: !currentStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`, user);
    }
  };

  const handleUpdateRole = async (targetUid: string, newRole: 'student' | 'staff') => {
    if (!profile?.isAdmin) return;
    
    // Only Default Admin can demote staff/admins
    const targetUser = allUsers.find(u => u.uid === targetUid);
    if (targetUser?.role === 'staff' && !isDefaultAdminEmail(profile.email)) {
      setError("Only the Super Admin can demote staff members.");
      return;
    }

    // Cannot demote the Default Admin
    if (isDefaultAdminEmail(targetUser?.email) && newRole === 'student') {
      setError("The Super Admin cannot be demoted.");
      return;
    }

    try {
      await updateDoc(doc(db, 'users', targetUid), {
        role: newRole,
        // If changing to student, also remove admin status for safety
        ...(newRole === 'student' ? { isAdmin: false } : {})
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`, user);
    }
  };

  const handleValidateLog = async (logId: string) => {
    if (profile?.role !== 'staff' || !user) return;
    try {
      await updateDoc(doc(db, 'logs', logId), {
        status: 'validated',
        validatedBy: user.uid,
        validatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `logs/${logId}`, user);
    }
  };

  const handleBlockLog = async (logId: string, targetUid: string) => {
    if (profile?.role !== 'staff' || !user) return;
    try {
      // Block the log entry
      await updateDoc(doc(db, 'logs', logId), {
        status: 'blocked',
        validatedBy: user.uid,
        validatedAt: serverTimestamp()
      });
      // Block the user globally
      await updateDoc(doc(db, 'users', targetUid), {
        isBlocked: true
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `logs/${logId}`, user);
    }
  };

  const handleToggleAdmin = async (targetUid: string, currentStatus: boolean) => {
    if (!profile?.isAdmin) return;

    const targetUser = allUsers.find(u => u.uid === targetUid);
    
    // Only Default Admin can remove admin privileges from others
    if (currentStatus && !isDefaultAdminEmail(profile.email)) {
      setError("Only the Super Admin can remove admin privileges.");
      return;
    }

    // Cannot remove admin status from Default Admin
    if (isDefaultAdminEmail(targetUser?.email) && currentStatus) {
      setError("The Super Admin's privileges cannot be removed.");
      return;
    }

    try {
      await updateDoc(doc(db, 'users', targetUid), {
        isAdmin: !currentStatus,
        // Ensure role is staff if becoming admin
        ...(!currentStatus ? { role: 'staff' } : {})
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`, user);
    }
  };

  const handleApproveStaff = async (targetUid: string) => {
    if (!profile?.isAdmin) return;
    try {
      await updateDoc(doc(db, 'users', targetUid), {
        isApproved: true
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`, user);
    }
  };

  const handleExportPDF = () => {
    // Calculate start/end dates for the filename and report
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (dateFilter === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateFilter === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (dateFilter === 'custom') {
      startDate = new Date(customDateRange.start);
    }

    let endDate = new Date();
    if (dateFilter === 'custom') {
      endDate = new Date(customDateRange.end);
    }

    const dateRange = {
      start: startDate.toLocaleDateString(),
      end: endDate.toLocaleDateString()
    };

    exportToPDF(
      allLogs.filter(log => !log.isPreview && !isDefaultAdminEmail(log.email)), 
      allUsers, 
      dateRange, 
      dateFilter
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neu-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neu-white text-[#1a1a1a] font-sans">
      {/* Full Screen Success Greeting */}
      <AnimatePresence>
        {showSuccessGreeting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-neu-blue flex flex-col items-center justify-center text-white text-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="space-y-8"
            >
              <div className="bg-white/20 p-8 rounded-full inline-block">
                <CheckCircle2 className="w-32 h-32" />
              </div>
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight">
                Welcome to <br /> NEU Library!
              </h1>
              <p className="text-2xl font-medium opacity-80">
                {effectiveProfile?.role === 'staff' 
                  ? "Your dedication powers our community's learning. Let's make today count!" 
                  : "Enjoy your stay and happy learning."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="border-b border-neu-blue/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={NEU_LOGO} alt="NEU Logo" className="w-10 h-10 object-contain rounded-full mix-blend-multiply" referrerPolicy="no-referrer" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-neu-blue leading-none">NEU</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neu-gold">Library Visitor</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {user && (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-neu-blue hover:text-neu-cyan transition-colors font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!user ? (
            /* Login Screen */
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center space-y-12"
            >
              <div className="space-y-6">
                <img src={LIB_LOGO} alt="NEU Library Logo" className="w-48 h-48 mx-auto drop-shadow-2xl rounded-full mix-blend-multiply" referrerPolicy="no-referrer" />
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neu-blue">
                    NEU Library Visitor App
                  </h1>
                  <p className="text-lg text-black/60 font-medium">
                    Your gateway to wisdom and knowledge.
                  </p>
                </div>
              </div>

              {/* Library Details from Image */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-neu-blue/5 space-y-8">
                <div className="bg-neu-blue text-white p-6 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="font-bold text-sm">M / T / W / F</span>
                    <span className="font-mono text-sm">7:00am - 7:00pm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">THU / SAT</span>
                    <span className="font-mono text-sm">7:00am - 6:00pm</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-left">
                  <div className="flex items-start gap-3">
                    <div className="bg-neu-blue/10 p-2 rounded-lg">
                      <Wifi className="w-5 h-5 text-neu-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-neu-blue text-sm">Free WiFi</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-neu-blue/10 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-neu-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-neu-blue text-sm">Book Lending</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-neu-blue/10 p-2 rounded-lg">
                      <Printer className="w-5 h-5 text-neu-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-neu-blue text-sm leading-tight">Printing and Photocopying</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-neu-blue/10 p-2 rounded-lg">
                      <Monitor className="w-5 h-5 text-neu-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-neu-blue text-sm leading-tight">Print and Electronic Resources</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleLogin}
                className="w-full bg-neu-blue text-white rounded-2xl py-5 px-8 flex items-center justify-center gap-3 hover:bg-neu-cyan transition-all shadow-xl shadow-neu-blue/20 group cursor-pointer"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
                <span className="text-lg font-bold">Sign in with Google</span>
              </button>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-100 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </motion.div>
          ) : isNewUser ? (
            /* Profile Setup Screen */
            <motion.div 
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-xl mx-auto bg-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-neu-blue/5 border border-neu-blue/5"
            >
              <div className="space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-bold text-neu-blue">Complete Your Profile</h2>
                  <p className="text-black/60 font-medium">
                    {onboardingStep === 1 
                      ? "Tell us who you are." 
                      : userType === 'student' 
                        ? "Help us identify your department." 
                        : "Select your role."}
                  </p>
                </div>

                <form onSubmit={handleProfileSetup} className="space-y-6">
                  {onboardingStep === 1 ? (
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setUserType('student');
                          setOnboardingStep(2);
                        }}
                        className="p-8 rounded-2xl border-2 border-neu-white hover:border-neu-blue text-left group transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-neu-blue">Student</h3>
                            <p className="text-sm text-black/40 font-medium">Access library services as a student.</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-neu-blue/20 group-hover:text-neu-blue transition-colors" />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserType('faculty');
                          setOnboardingStep(2);
                        }}
                        className="p-8 rounded-2xl border-2 border-neu-white hover:border-neu-blue text-left group transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-neu-blue">Faculty Member</h3>
                            <p className="text-sm text-black/40 font-medium">Admin or Library Employee access.</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-neu-blue/20 group-hover:text-neu-blue transition-colors" />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <>
                      {userType === 'student' ? (
                        <>
                          <SearchableSelect 
                            label="College / Office"
                            icon={<School className="w-3 h-3" />}
                            options={COLLEGES_DATA.map(c => c.name)}
                            value={selectedCollege}
                            placeholder="Select College"
                            onChange={(val) => {
                              setSelectedCollege(val);
                              const college = COLLEGES_DATA.find(c => c.name === val);
                              if (college && college.programs.length === 1) {
                                setSelectedProgram(college.programs[0]);
                              } else {
                                setSelectedProgram('');
                              }
                            }}
                          />

                          <SearchableSelect 
                            label="Program / Department"
                            icon={<GraduationCap className="w-3 h-3" />}
                            options={selectedCollege ? COLLEGES_DATA.find(c => c.name === selectedCollege)?.programs || [] : []}
                            value={selectedProgram}
                            placeholder="Select Program"
                            disabled={!selectedCollege}
                            onChange={(val) => setSelectedProgram(val)}
                          />
                        </>
                      ) : (
                        <>
                          {userType === 'faculty' && (
                            <div className="bg-neu-gold/10 border border-neu-gold/20 rounded-2xl p-4 mb-4">
                              <p className="text-neu-gold font-bold text-xs flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                RESTRICTED ACCESS
                              </p>
                              <p className="text-neu-blue/60 text-[10px] mt-1 font-medium">
                                Staff and Admin roles require authorization from the Default Admin. 
                                Unauthorized signups will be blocked by the system.
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-4">
                          <button
                            type="button"
                            onClick={() => setFacultyRole('admin')}
                            className={cn(
                              "p-6 rounded-2xl border-2 transition-all text-left cursor-pointer",
                              facultyRole === 'admin' ? "bg-neu-blue text-white border-neu-blue shadow-lg shadow-neu-blue/20" : "bg-white text-neu-blue border-neu-white hover:border-neu-blue"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <ShieldCheck className={cn("w-6 h-6", facultyRole === 'admin' ? "text-white" : "text-neu-blue")} />
                              <div>
                                <h3 className="font-bold">Administrator</h3>
                                <p className={cn("text-xs font-medium", facultyRole === 'admin' ? "text-white/60" : "text-black/40")}>Full access to all features.</p>
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFacultyRole('employee')}
                            className={cn(
                              "p-6 rounded-2xl border-2 transition-all text-left cursor-pointer",
                              facultyRole === 'employee' ? "bg-neu-blue text-white border-neu-blue shadow-lg shadow-neu-blue/20" : "bg-white text-neu-blue border-neu-white hover:border-neu-blue"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <UsersIcon className={cn("w-6 h-6", facultyRole === 'employee' ? "text-white" : "text-neu-blue")} />
                              <div>
                                <h3 className="font-bold">Employee</h3>
                                <p className={cn("text-xs font-medium", facultyRole === 'employee' ? "text-white/60" : "text-black/40")}>Access to analytics and history.</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setOnboardingStep(1)}
                          className="flex-1 bg-neu-white text-neu-blue rounded-2xl py-5 font-bold hover:bg-neu-blue/5 transition-all cursor-pointer"
                        >
                          Back
                        </button>
                        <button 
                          type="submit"
                          disabled={submitting || (userType === 'student' ? !selectedProgram : !facultyRole)}
                          className="flex-[2] bg-neu-blue text-white rounded-2xl py-5 font-bold hover:bg-neu-cyan transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-neu-blue/20 cursor-pointer"
                        >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </motion.div>
          ) : view === 'admin' && effectiveProfile?.role === 'staff' && (effectiveProfile?.isApproved || isDefaultAdminEmail(effectiveProfile?.email)) ? (
            /* Admin Dashboard */
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black text-neu-blue tracking-tight">
                      {effectiveProfile.isAdmin ? 'Librarian Dashboard' : 'Staff Dashboard'}
                    </h1>
                  </div>
                  <p className="text-black/60 font-medium">
                    {effectiveProfile.isAdmin ? 'Manage visitors and user accounts.' : 'View visitor analytics and history.'}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex bg-neu-white p-1.5 rounded-2xl border border-neu-blue/5 self-end">
                    <button
                      onClick={() => setAdminTab('profile')}
                      className={cn(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                        adminTab === 'profile' ? "bg-white text-neu-blue shadow-sm" : "text-black/40 hover:text-neu-blue"
                      )}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => setAdminTab('analytics')}
                      className={cn(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                        adminTab === 'analytics' ? "bg-white text-neu-blue shadow-sm" : "text-black/40 hover:text-neu-blue"
                      )}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Analytics
                    </button>
                    {effectiveProfile.isAdmin && (
                      <button
                        onClick={() => setAdminTab('users')}
                        className={cn(
                          "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                          adminTab === 'users' ? "bg-white text-neu-blue shadow-sm" : "text-black/40 hover:text-neu-blue"
                        )}
                      >
                        <UsersIcon className="w-4 h-4" />
                        Users
                      </button>
                    )}
                  </div>

                  {adminTab === 'analytics' && (
                    <div className="flex flex-wrap gap-2 bg-neu-white p-1.5 rounded-2xl border border-neu-blue/5">
                      {(['today', 'weekly', 'monthly', 'custom'] as DateFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setDateFilter(f)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                            dateFilter === f 
                              ? "bg-white text-neu-blue shadow-sm" 
                              : "text-black/40 hover:text-neu-blue"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-neu-blue text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-neu-cyan transition-all shadow-lg shadow-neu-blue/20 self-end mt-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>

              {adminTab === 'profile' ? (
                <div className="max-w-2xl mx-auto space-y-12">
                  {/* Profile Card */}
                  <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-neu-blue/5 border border-neu-blue/5 flex items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neu-blue/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10">
                      <div className="w-24 h-24 rounded-full border-4 border-neu-white overflow-hidden shadow-lg">
                        {effectiveProfile.photoURL ? (
                          <img src={effectiveProfile.photoURL} alt={effectiveProfile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-neu-blue/10 flex items-center justify-center text-neu-blue text-3xl font-black">
                            {effectiveProfile.displayName.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 relative z-10 space-y-1">
                      <h2 className="text-3xl font-black text-neu-blue leading-tight">{effectiveProfile.displayName}</h2>
                      <p className="text-neu-cyan font-bold text-lg">{effectiveProfile.program}</p>
                      <p className="text-black/40 font-black text-xs uppercase tracking-widest">FACULTY/STAFF</p>
                    </div>
                    <div className="relative z-10">
                      <span className="bg-neu-gold text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-neu-gold/20">
                        {effectiveProfile.isAdmin ? 'ADMINISTRATOR' : 'STAFF'}
                      </span>
                      <button
                        onClick={handleExportPDF}
                        className="mt-4 flex items-center gap-2 bg-neu-blue/5 text-neu-blue px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neu-blue hover:text-white transition-all w-full justify-center"
                      >
                        <FileDown className="w-3 h-3" />
                        Export PDF
                      </button>
                    </div>
                  </div>

                  {/* Entry Form */}
                  <div className="text-center space-y-10">
                    <div className="space-y-4">
                      <h3 className="text-5xl font-black text-neu-blue tracking-tight">Welcome Back</h3>
                      {isDefaultAdminEmail(profile?.email) && (
                        <div className="flex flex-col items-center gap-3 pt-4">
                          <span className="text-[10px] font-black text-neu-gold uppercase tracking-[0.3em] flex items-center gap-2">
                            <Eye className="w-3 h-3" />
                            View As
                          </span>
                          <div className="flex bg-neu-white p-1.5 rounded-2xl border border-neu-gold/20 shadow-sm">
                            <button 
                              onClick={() => setPreviewRole('admin')}
                              className={cn(
                                "px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-2",
                                (previewRole === 'admin' || (!previewRole && profile?.isAdmin)) 
                                  ? "bg-neu-gold text-white shadow-lg shadow-neu-gold/20" 
                                  : "text-neu-gold hover:bg-neu-gold/5"
                              )}
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Admin
                            </button>
                            <button 
                              onClick={() => setPreviewRole('staff')}
                              className={cn(
                                "px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-2",
                                previewRole === 'staff' 
                                  ? "bg-neu-gold text-white shadow-lg shadow-neu-gold/20" 
                                  : "text-neu-gold hover:bg-neu-gold/5"
                              )}
                            >
                              <UsersIcon className="w-4 h-4" />
                              Staff
                            </button>
                            <button 
                              onClick={() => {
                                setPreviewRole('student');
                                setView('visitor');
                              }}
                              className={cn(
                                "px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-2",
                                previewRole === 'student' 
                                  ? "bg-neu-gold text-white shadow-lg shadow-neu-gold/20" 
                                  : "text-neu-gold hover:bg-neu-gold/5"
                              )}
                            >
                              <GraduationCap className="w-4 h-4" />
                              Student
                            </button>
                          </div>
                          <p className="text-[10px] text-black/40 font-medium italic">Preview mode allows you to experience the app from different perspectives.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : adminTab === 'analytics' ? (
                <>
                  {dateFilter === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-wrap gap-4 bg-white p-6 rounded-3xl border border-neu-blue/5 shadow-xl shadow-neu-blue/5"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Start Date</label>
                    <input 
                      type="date" 
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="block w-full bg-neu-white border-none rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-neu-gold/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40">End Date</label>
                    <input 
                      type="date" 
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="block w-full bg-neu-white border-none rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-neu-gold/20"
                    />
                  </div>
                </motion.div>
              )}

              {/* Stats Grid */}
              {(() => {
                const validatedLogs = allLogs.filter(log => 
                  log.status === 'validated' && 
                  !log.isPreview && 
                  !isDefaultAdminEmail(log.email)
                );
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neu-blue text-white p-8 rounded-[32px] shadow-xl shadow-neu-blue/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform" />
                      <div className="relative z-10 space-y-4">
                        <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center">
                          <UsersIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Validated Visitors</p>
                          <h3 className="text-5xl font-black">{validatedLogs.length}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Top Reasons Breakdown */}
                    <div className="bg-white p-8 rounded-[32px] border border-neu-blue/5 shadow-xl shadow-neu-blue/5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-neu-blue">Top Reasons</h3>
                          <p className="text-xs text-black/40 font-medium">Most common purposes for visits.</p>
                        </div>
                        <BookOpen className="w-5 h-5 text-neu-gold" />
                      </div>
                      
                      <div className="space-y-4">
                        {(() => {
                          const reasonCounts: Record<string, number> = {};
                          validatedLogs.forEach(log => {
                            reasonCounts[log.reason] = (reasonCounts[log.reason] || 0) + 1;
                          });
                          
                          return Object.entries(reasonCounts)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([reason, count]) => (
                              <div key={reason} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                  <span className="text-neu-blue truncate max-w-[140px]">{reason}</span>
                                  <span className="text-neu-gold">{count}</span>
                                </div>
                                <div className="h-2 bg-neu-white rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / validatedLogs.length) * 100}%` }}
                                    className="h-full bg-neu-cyan"
                                  />
                                </div>
                              </div>
                            ));
                        })()}
                        {validatedLogs.length === 0 && (
                          <p className="text-center py-4 text-black/30 font-medium text-sm italic">No data available.</p>
                        )}
                      </div>
                    </div>

                    {/* Top Colleges Breakdown */}
                    <div className="bg-white p-8 rounded-[32px] border border-neu-blue/5 shadow-xl shadow-neu-blue/5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-neu-blue">Top Colleges</h3>
                          <p className="text-xs text-black/40 font-medium">Distribution by department.</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-neu-gold" />
                      </div>
                      
                      <div className="space-y-4">
                        {(() => {
                          const collegeCounts: Record<string, number> = {};
                          validatedLogs.forEach(log => {
                            collegeCounts[log.college] = (collegeCounts[log.college] || 0) + 1;
                          });
                          
                          return Object.entries(collegeCounts)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([college, count]) => (
                              <div key={college} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                  <span className="text-neu-blue truncate max-w-[140px]">{college}</span>
                                  <span className="text-neu-gold">{count}</span>
                                </div>
                                <div className="h-2 bg-neu-white rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / validatedLogs.length) * 100}%` }}
                                    className="h-full bg-neu-blue"
                                  />
                                </div>
                              </div>
                            ));
                        })()}
                        {validatedLogs.length === 0 && (
                          <p className="text-center py-4 text-black/30 font-medium text-sm italic">No data available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* History Table */}
              <div className="bg-white rounded-[32px] border border-neu-blue/5 shadow-xl shadow-neu-blue/5 overflow-hidden">
                <div className="p-8 border-b border-neu-blue/5 space-y-6">
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-neu-blue" />
                    <h3 className="text-2xl font-bold text-neu-blue">Visitor History</h3>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                    <input 
                      type="text"
                      placeholder="Search by name or email..."
                      value={adminSearchTerm}
                      onChange={(e) => setAdminSearchTerm(e.target.value)}
                      className="w-full bg-neu-white border-none rounded-2xl py-4 pl-12 pr-6 font-semibold focus:ring-2 focus:ring-neu-gold/20"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neu-white/50">
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Visitor</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">College & Program</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Reason</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neu-blue/5">
                      {allLogs
                        .filter(log => 
                          !log.isPreview && 
                          !isDefaultAdminEmail(log.email) && (
                            log.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                            (log.email || '').toLowerCase().includes(adminSearchTerm.toLowerCase())
                          )
                        )
                        .map((log) => (
                          <tr key={log.id} className="hover:bg-neu-blue/5 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-neu-blue/10 flex items-center justify-center text-neu-blue font-bold text-sm">
                                  {log.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-neu-blue">{log.name}</p>
                                  <p className="text-xs text-black/40 font-medium">{log.email || 'No email'}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">
                                      {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <span className="text-[10px] text-black/20">•</span>
                                    <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">
                                      {log.timestamp?.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-neu-blue">{log.college}</p>
                              <p className="text-xs text-black/40 font-medium">{log.program}</p>
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 rounded-full bg-neu-cyan/10 text-neu-cyan text-[10px] font-black uppercase tracking-widest">
                                {log.reason}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="space-y-1">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit",
                                  log.status === 'validated' ? "bg-emerald-500 text-white" :
                                  log.status === 'blocked' ? "bg-red-500 text-white" :
                                  "bg-neu-gold text-white"
                                )}>
                                  {log.status === 'validated' && <ShieldCheck className="w-3 h-3" />}
                                  {log.status === 'blocked' && <ShieldAlert className="w-3 h-3" />}
                                  {log.status || 'pending'}
                                </span>
                                {log.validatedBy && (
                                  <p className="text-[8px] text-black/40 font-black uppercase tracking-widest">
                                    By: {allUsers.find(u => u.uid === log.validatedBy)?.displayName || 'Staff'}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              {log.status === 'pending' || !log.status ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleValidateLog(log.id)}
                                    className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                    title="Validate Entry"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleBlockLog(log.id, log.uid)}
                                    className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                    title="Block User"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-black/20 font-black uppercase tracking-widest">
                                  Processed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {adminLogsLoading && (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-neu-blue" />
                      <p className="text-sm font-bold text-black/40 uppercase tracking-widest">Loading Records...</p>
                    </div>
                  )}

                  {!adminLogsLoading && allLogs.filter(l => !l.isPreview && !isDefaultAdminEmail(l.email)).length === 0 && (
                    <div className="p-20 text-center space-y-4">
                      <div className="bg-neu-white w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-black/10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-neu-blue">No records found</p>
                        <p className="text-sm text-black/40 font-medium">Try adjusting your filters or search term.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
              /* User Management UI */
                <div className="bg-white rounded-[32px] border border-neu-blue/5 shadow-xl shadow-neu-blue/5 overflow-hidden">
                  <div className="p-8 border-b border-neu-blue/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-neu-blue" />
                        <h3 className="text-2xl font-bold text-neu-blue">User Management</h3>
                      </div>
                      
                      <div className="flex gap-2 p-1 bg-neu-white rounded-xl w-fit">
                        <button 
                          onClick={() => setUserFilter('all')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            userFilter === 'all' ? "bg-white text-neu-blue shadow-sm" : "text-black/40 hover:text-neu-blue"
                          )}
                        >
                          All Users
                        </button>
                        <button 
                          onClick={() => setUserFilter('pending-admins')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            userFilter === 'pending-admins' ? "bg-white text-neu-blue shadow-sm" : "text-black/40 hover:text-neu-blue"
                          )}
                        >
                          Pending Admins
                        </button>
                        <button 
                          onClick={() => setUserFilter('pending-employees')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            userFilter === 'pending-employees' ? "bg-white text-neu-blue shadow-sm" : "text-black/40 hover:text-neu-blue"
                          )}
                        >
                          Pending Employees
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                      <input 
                        type="text"
                        placeholder="Filter users..."
                        value={adminSearchTerm}
                        onChange={(e) => setAdminSearchTerm(e.target.value)}
                        className="w-full bg-neu-white border-none rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-neu-gold/20"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neu-white/50">
                          <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">User</th>
                          <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Program</th>
                          <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Status</th>
                          <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neu-blue/5">
                        {allUsers
                          .filter(u => {
                            const matchesSearch = u.displayName.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                                                 u.email.toLowerCase().includes(adminSearchTerm.toLowerCase());
                            
                            if (userFilter === 'pending-admins') {
                              return matchesSearch && u.role === 'staff' && !u.isApproved && u.isAdmin;
                            }
                            if (userFilter === 'pending-employees') {
                              return matchesSearch && u.role === 'staff' && !u.isApproved && !u.isAdmin;
                            }
                            return matchesSearch;
                          })
                          .map((u) => (
                            <tr key={u.uid} className="hover:bg-neu-blue/5 transition-colors group">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} 
                                    alt="" 
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="font-bold text-neu-blue">{u.displayName}</p>
                                    <p className="text-xs text-black/40 font-medium">{u.email}</p>
                                    <div className="flex gap-1 mt-1">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                        u.role === 'staff' ? "bg-neu-blue text-white" : "bg-neu-white text-neu-blue"
                                      )}>
                                        {u.role}
                                      </span>
                                      {u.role === 'staff' && !u.isApproved && (
                                        <span className="bg-neu-gold/10 text-neu-gold px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-neu-gold/20">
                                          Pending Approval
                                        </span>
                                      )}
                                      {u.isAdmin && (
                                        <span className="bg-neu-gold text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                                          Admin
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <p className="text-sm font-bold text-neu-blue">{u.program}</p>
                                <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">{u.college}</p>
                              </td>
                              <td className="px-8 py-6">
                                {u.isBlocked ? (
                                  <span className="flex items-center gap-1.5 text-red-500 font-bold text-xs uppercase tracking-widest">
                                    <UserX className="w-4 h-4" />
                                    Blocked
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                    <UserCheck className="w-4 h-4" />
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleToggleBlock(u.uid, !!u.isBlocked)}
                                    disabled={isDefaultAdminEmail(u.email) || (u.role === 'staff' && !isDefaultAdminEmail(profile?.email))}
                                    title={u.isBlocked ? "Unblock User" : "Block User"}
                                    className={cn(
                                      "p-2 rounded-xl transition-all",
                                      u.isBlocked 
                                        ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                                        : "bg-red-500 text-white hover:bg-red-600",
                                      (isDefaultAdminEmail(u.email) || (u.role === 'staff' && !isDefaultAdminEmail(profile?.email))) && "opacity-20 cursor-not-allowed grayscale"
                                    )}
                                  >
                                    {u.isBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                  </button>

                                  {u.role !== 'staff' && (
                                    <button
                                      onClick={() => handleUpdateRole(u.uid, 'staff')}
                                      disabled={!isDefaultAdminEmail(profile?.email)}
                                      title="Promote to Staff"
                                      className="p-2 rounded-xl bg-neu-blue text-white hover:bg-neu-cyan transition-all"
                                    >
                                      <UsersIcon className="w-4 h-4" />
                                    </button>
                                  )}

                                  {u.role === 'staff' && (
                                    <>
                                      <button
                                        onClick={() => handleToggleAdmin(u.uid, !!u.isAdmin)}
                                        disabled={isDefaultAdminEmail(u.email) || (u.isAdmin && !isDefaultAdminEmail(profile?.email))}
                                        title={u.isAdmin ? "Remove Admin Privileges" : "Make Administrator"}
                                        className={cn(
                                          "p-2 rounded-xl transition-all",
                                          u.isAdmin ? "bg-neu-gold text-white hover:bg-neu-gold/80" : "bg-neu-white text-neu-gold border border-neu-gold/20 hover:bg-neu-gold/5",
                                          (isDefaultAdminEmail(u.email) || (u.isAdmin && !isDefaultAdminEmail(profile?.email))) && "opacity-20 cursor-not-allowed grayscale"
                                        )}
                                      >
                                        <ShieldCheck className="w-4 h-4" />
                                      </button>

                                      <button
                                        onClick={() => handleUpdateRole(u.uid, 'student')}
                                        disabled={isDefaultAdminEmail(u.email) || !isDefaultAdminEmail(profile?.email)}
                                        title="Demote to Student"
                                        className={cn(
                                          "p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all",
                                          (isDefaultAdminEmail(u.email) || !isDefaultAdminEmail(profile?.email)) && "opacity-20 cursor-not-allowed grayscale"
                                        )}
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}

                                  {u.role === 'staff' && !u.isApproved && (
                                    <button
                                      onClick={() => handleApproveStaff(u.uid)}
                                      title="Approve Staff Member"
                                      className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : profile?.role === 'staff' && !profile?.isApproved && !isDefaultAdminEmail(profile?.email) ? (
            /* Pending Approval View */
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-neu-blue/10 border border-neu-blue/5 text-center space-y-8">
                <div className="w-24 h-24 bg-neu-gold/10 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-12 h-12 text-neu-gold animate-pulse" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-neu-blue leading-tight">Approval Pending</h2>
                  <p className="text-black/60 font-medium leading-relaxed">
                    Your request for <span className="text-neu-blue font-bold">{effectiveProfile?.isAdmin ? 'Administrator' : 'Employee'}</span> access has been submitted.
                  </p>
                  <div className="bg-neu-white p-4 rounded-2xl border border-neu-blue/5 text-left">
                    <p className="text-[10px] font-black text-neu-blue/40 uppercase tracking-widest mb-2">Next Steps</p>
                    <p className="text-sm text-neu-blue/80 font-semibold">
                      Please contact the Chief Librarian to verify your identity and approve your account.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-neu-white text-neu-blue rounded-2xl py-5 font-bold hover:bg-neu-blue/5 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          ) : (
            /* Library Entry Screen */
            <motion.div 
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* User Card */}
              <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[32px] border border-neu-blue/5 shadow-xl shadow-neu-blue/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neu-yellow/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-neu-cyan/10 rounded-full -ml-16 -mb-16 blur-3xl" />
                
                {isDefaultAdminEmail(profile?.email) && (
                  <button 
                    onClick={() => {
                      setPreviewRole('admin');
                      setView('admin');
                    }}
                    className="absolute top-4 right-4 bg-neu-gold text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-neu-gold/90 transition-all shadow-lg shadow-neu-gold/20 z-20"
                  >
                    Exit Preview
                  </button>
                )}

                <img 
                  src={effectiveProfile?.photoURL || `https://ui-avatars.com/api/?name=${effectiveProfile?.displayName}`} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-neu-white relative z-10 shadow-md"
                />
                <div className="text-center md:text-left space-y-1 relative z-10">
                  <h2 className="text-3xl font-bold text-neu-blue">{effectiveProfile?.displayName}</h2>
                  <p className="text-neu-cyan font-bold text-lg">{effectiveProfile?.program}</p>
                  <p className="text-xs text-black/40 tracking-widest uppercase font-bold">{effectiveProfile?.college}</p>
                </div>
                {effectiveProfile?.isAdmin && (
                  <div className="md:ml-auto bg-neu-gold text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest relative z-10 shadow-sm">
                    Administrator
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="max-w-md mx-auto text-center space-y-8">
                {profile?.isBlocked ? (
                  <div className="bg-red-50 text-red-600 p-8 rounded-[32px] border-2 border-red-200 space-y-4">
                    <AlertCircle className="w-16 h-16 mx-auto" />
                    <h4 className="text-2xl font-bold">Access Denied</h4>
                    <p className="text-lg font-medium">Please see the Librarian for assistance.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-extrabold text-neu-blue">Welcome Back</h3>
                      <p className="text-lg text-black/60 font-medium">Ready to enter the library? Select your reason below.</p>
                    </div>
                    <form onSubmit={handleLibraryEntry} className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setSelectedReason(reason)}
                          className={cn(
                            "p-6 rounded-2xl border-2 transition-all text-lg font-bold flex items-center justify-center gap-3 cursor-pointer",
                            selectedReason === reason 
                              ? "bg-neu-blue text-white border-neu-blue shadow-lg shadow-neu-blue/20" 
                              : "bg-white text-black/60 border-neu-white hover:border-neu-cyan"
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting || !selectedReason}
                      className="w-full bg-neu-blue text-white rounded-2xl py-6 font-extrabold text-xl hover:bg-neu-cyan transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-neu-blue/20 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <Library className="w-8 h-8" />
                          <span>Register Entry</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
                )}

                {error && !profile?.isBlocked && (
                  <p className="text-red-500 text-sm font-bold">{error}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-neu-blue/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-black/40 text-[10px] font-bold uppercase tracking-widest">
          <p>© 2026 New Era University Library</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-neu-blue transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neu-blue transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neu-blue transition-colors">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
