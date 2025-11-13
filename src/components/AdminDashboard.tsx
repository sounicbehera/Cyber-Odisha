import { useState, useEffect, useMemo } from 'react';
import {
  Users, Eye, ShieldCheck, FileText, BarChart3, UserPlus, X,
  Filter, Calendar, Search,
} from 'lucide-react';
// --- Use standard path aliases for imports ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Case, User, UserRole } from '@/types';
// --- FIX: Use alias for firebaseConfig path ---
import { db, auth } from '@/firebaseConfig';
// --- END FIX ---
import {
  collection, getDocs, doc, updateDoc, query, orderBy, setDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export function AdminDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------- ORIGINAL SEARCH ---------- */
  const [searchTerm, setSearchTerm] = useState('');    // name / crime-type / etc.

  /* ---------- GLOBAL FILTER STATES ---------- */
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [searchAadharOrCase, setSearchAadharOrCase] = useState('');
  const [pinCode, setPinCode] = useState('');

  /* ---------- FILTER DIALOG (LOCAL STATES) ---------- */
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [localDateFrom, setLocalDateFrom] = useState('');
  const [localDateTo, setLocalDateTo] = useState('');
  const [localSelectedClerk, setLocalSelectedClerk] = useState('');
  const [localSearchAadharOrCase, setLocalSearchAadharOrCase] = useState('');
  const [localPinCode, setLocalPinCode] = useState('');

  /* ---------- ADD USER FORM ---------- */
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('police');
  const [addUserError, setAddUserError] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const casesQ = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
      const casesSnap = await getDocs(casesQ);
      const casesData = casesSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date(),
      })) as Case[];
      setCases(casesData);

      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as User[];
      setUsers(usersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FILTER LOGIC (FIXED) ---------- */
  const uniqueClerks = useMemo(() => {
    // Get all users with 'clerk' role from Firebase users collection
    const clerkUsers = users
      .filter(user => user.role === 'clerk')
      .map(user => user.fullName || user.username)
      .filter(Boolean);

    // Get unique values and sort them
    const uniqueNames = [...new Set(clerkUsers)];
    return uniqueNames.sort();
  }, [users]);

  const filteredCases = useMemo(() => {
    console.log('Recomputing filteredCases with:', { searchTerm, dateFrom, dateTo, selectedClerk, searchAadharOrCase, pinCode, totalCases: cases.length }); // DEBUG LOG
    return cases.filter(c => {
      /* ---- ORIGINAL SEARCH ---- */
      if (
        searchTerm &&
        !(
          c.caseNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.aadharNo?.includes(searchTerm) ||
          c.crimeType?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }

      /* ---- DATE RANGE (fixed for full day inclusion) ---- */
      const caseDate = new Date(c.createdAt);
      if (dateFrom) {
        const startOfDay = new Date(dateFrom);
        startOfDay.setHours(0, 0, 0, 0);
        if (caseDate < startOfDay) return false;
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (caseDate > endOfDay) return false;
      }

      /* ---- CLERK (match officerName exactly) ---- */
      // Convert c.officerName to string for safe comparison
      if (selectedClerk && String(c.officerName) !== selectedClerk) return false;

      /* ---- AADHAR / CASE NO (case-insensitive) ---- */
      if (searchAadharOrCase) {
        const term = searchAadharOrCase.toLowerCase();
        if (
          !c.aadharNo?.toLowerCase().includes(term) &&
          !c.caseNo?.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      /* ---- PIN CODE (partial match in address) ---- */
      if (pinCode && !c.address?.includes(pinCode)) return false;

      return true;
    });
  }, [cases, searchTerm, dateFrom, dateTo, selectedClerk, searchAadharOrCase, pinCode]);

  const openFilterDialog = () => {
    // Sync local states with global
    setLocalDateFrom(dateFrom);
    setLocalDateTo(dateTo);
    setLocalSelectedClerk(selectedClerk);
    setLocalSearchAadharOrCase(searchAadharOrCase);
    setLocalPinCode(pinCode);
    setIsFilterDialogOpen(true);
  };

  const handleApplyFilters = () => {
    // Apply local to global
    setDateFrom(localDateFrom);
    setDateTo(localDateTo);
    setSelectedClerk(localSelectedClerk);
    setSearchAadharOrCase(localSearchAadharOrCase);
    setPinCode(localPinCode);
    setIsFilterDialogOpen(false);
  };

  const clearFilters = () => {
    setLocalDateFrom('');
    setLocalDateTo('');
    setLocalSelectedClerk('');
    setLocalSearchAadharOrCase('');
    setLocalPinCode('');
    // Optionally auto-apply clear, or wait for user to click Apply
  };

  const handleClearGlobalFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedClerk('');
    setSearchAadharOrCase('');
    setPinCode('');
  };

  /* ---------- USER MANAGEMENT ---------- */
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      setAddUserError('Please fill all fields.');
      return;
    }
    if (newUserPassword.length < 6) {
      setAddUserError('Password must be at least 6 characters.');
      return;
    }
    setAddUserError('');
    setAddUserLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        fullName: newUserFullName,
        email: newUserEmail,
        username: newUserEmail,
        role: newUserRole,
      });
      await loadData();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('police');
      setIsAddUserDialogOpen(false);
      alert('User created successfully!');
    } catch (err: any) {
      setAddUserError(err.code === 'auth/email-already-in-use' ? 'Email already in use.' : err.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleViewCase = (c: Case) => {
    setSelectedCase(c);
    setIsViewDialogOpen(true);
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      setUsers(u => u.map(x => (x.id === uid ? { ...x, role } : x)));
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (s: Case['status']) => {
    switch (s) {
      case 'Open': return 'bg-blue-500';
      case 'Under Investigation': return 'bg-yellow-500';
      case 'In Court': return 'bg-orange-500';
      case 'Closed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'admin': return 'bg-purple-500';
      case 'clerk': return 'bg-blue-500';
      case 'police': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const stats = {
    totalCases: cases.length,
    openCases: cases.filter(c => c.status === 'Open').length,
    underInvestigation: cases.filter(c => c.status === 'Under Investigation').length,
    inCourt: cases.filter(c => c.status === 'In Court').length,
    closedCases: cases.filter(c => c.status === 'Closed').length,
    totalUsers: users.length,
  };

  if (loading) {
    return <div className="text-white text-center py-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white text-2xl mb-1">Admin Dashboard</h2>
        <p className="text-slate-400">System overview and user management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-gradient-to-br from-blue-900/50 to-blue-800/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-blue-200">Total Cases</CardDescription>
            <CardTitle className="text-white text-3xl">{stats.totalCases}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-blue-300">
              <FileText className="w-4 h-4 mr-1" />
              <span className="text-xs">All records</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-gradient-to-br from-yellow-900/50 to-yellow-800/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-yellow-200">Under Investigation</CardDescription>
            <CardTitle className="text-white text-3xl">{stats.underInvestigation}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-yellow-300">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span className="text-xs">Active investigations</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-gradient-to-br from-orange-900/50 to-orange-800/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-orange-200">In Court</CardDescription>
            <CardTitle className="text-white text-3xl">{stats.inCourt}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-orange-300">
              <ShieldCheck className="w-4 h-4 mr-1" />
              <span className="text-xs">Court proceedings</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-gradient-to-br from-green-900/50 to-green-800/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-200">Closed Cases</CardDescription>
            <CardTitle className="text-white text-3xl">{stats.closedCases}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-green-300">
              <FileText className="w-4 h-4 mr-1" />
              <span className="text-xs">Resolved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="cases" className="data-[state=active]:bg-slate-700">
            All Cases
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
            User Management
          </TabsTrigger>
        </TabsList>

        {/* ==================== CASES TAB ==================== */}
        <TabsContent value="cases" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-white">All Case Records</CardTitle>
                  <CardDescription className="text-slate-400">
                    Read-only view of all cases in the system
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  {/* ORIGINAL SEARCH */}
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search cases..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>

                  {/* FILTER BUTTON */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFilterDialog}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>

                  {/* CLEAR GLOBAL FILTERS BUTTON (if any filter active) */}
                  {(dateFrom || dateTo || selectedClerk || searchAadharOrCase || pinCode) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearGlobalFilters}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-sm text-slate-400 mb-2">
                Showing {filteredCases.length} of {cases.length} cases
                {dateFrom && ` | From: ${dateFrom}`}
                {dateTo && ` | To: ${dateTo}`}
                {selectedClerk && ` | Clerk: ${selectedClerk}`}
                {searchAadharOrCase && ` | ID: ${searchAadharOrCase}`}
                {pinCode && ` | Pin: ${pinCode}`}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">Case No</TableHead>
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Crime Type</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Officer</TableHead>
                      <TableHead className="text-slate-300">Created</TableHead>
                      <TableHead className="text-slate-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                          No cases match the current filters. Try adjusting them.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCases.map(c => (
                        <TableRow key={c.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white">{c.caseNo}</TableCell>
                          <TableCell className="text-white">{c.name}</TableCell>
                          <TableCell className="text-slate-300">{c.crimeType}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{c.officerName}</TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCase(c)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== USERS TAB ==================== */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage user roles and permissions
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddUserDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">Username</TableHead>
                      <TableHead className="text-slate-300">Full Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Current Role</TableHead>
                      <TableHead className="text-slate-300">Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white">{user.username}</TableCell>
                        <TableCell className="text-white">{user.fullName}</TableCell>
                        <TableCell className="text-slate-300">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}>
                            <SelectTrigger className="w-40 bg-slate-900 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-600 text-white">
                              <SelectItem value="clerk">Clerk</SelectItem>
                              <SelectItem value="police">Police</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== FILTER DIALOG ==================== */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter Cases
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Apply filters to narrow down the case list. Changes apply on "Apply Filters".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> From Date
                </Label>
                <Input
                  type="date"
                  value={localDateFrom}
                  onChange={e => setLocalDateFrom(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> To Date
                </Label>
                <Input
                  type="date"
                  value={localDateTo}
                  onChange={e => setLocalDateTo(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Clerk User Name</Label>
                <Select value={localSelectedClerk || "all"} onValueChange={(v) => setLocalSelectedClerk(v === "all" ? "" : v)}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="All Clerks" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-600 text-white">
                    <SelectItem value="all">All Clerks</SelectItem>
                    {uniqueClerks.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Pin Code (in Address)</Label>
                <Input
                  placeholder="e.g., 110001"
                  value={localPinCode}
                  onChange={e => setLocalPinCode(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Aadhar / Case No</Label>
                <Input
                  placeholder="e.g., 123456789012 or CR-2024"
                  value={localSearchAadharOrCase}
                  onChange={e => setLocalSearchAadharOrCase(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <UserPlus className="w-5 h-5 mr-2" />
              Add New User
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new user account with assigned role
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newUserFullName" className="text-slate-200">Full Name *</Label>
              <Input
                id="newUserFullName"
                required
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUserEmail" className="text-slate-200">Email *</Label>
              <Input
                id="newUserEmail"
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUserPassword" className="text-slate-200">Password *</Label>
              <Input
                id="newUserPassword"
                type="password"
                required
                minLength={6}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUserRole" className="text-slate-200">Role *</Label>
              <Select
                value={newUserRole}
                onValueChange={(value) => setNewUserRole(value as UserRole)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-600 text-white">
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="clerk">Clerk</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addUserError && (
              <div className="bg-red-900/20 border border-red-600 text-red-400 p-3 rounded-md text-sm">
                {addUserError}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={addUserLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {addUserLoading ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddUserDialogOpen(false);
                  setAddUserError('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setNewUserFullName('');
                  setNewUserRole('police');
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Case Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <FileText className="w-5 h-5 mr-2" />
              Case Details - {selectedCase?.caseNo}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Read-only case information
            </DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedCase.status)}>
                  {selectedCase.status}
                </Badge>
              </div>

              <Separator className="bg-slate-700" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Name</Label>
                  <p className="text-white mt-1">{selectedCase.name}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Age</Label>
                  <p className="text-white mt-1">{selectedCase.age}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Aadhar No</Label>
                  <p className="text-white mt-1">{selectedCase.aadharNo}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Crime Type</Label>
                  <p className="text-white mt-1">{selectedCase.crimeType}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-400">Crime Details</Label>
                  <p className="text-white mt-1 bg-slate-900/50 p-3 rounded">
                    {selectedCase.crimeDetails}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-400">Officer</Label>
                  <p className="text-white mt-1">{selectedCase.officerName}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Judge</Label>
                  <p className="text-white mt-1">{selectedCase.judgeName}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-400">Address</Label>
                  <p className="text-white mt-1 bg-slate-900/50 p-3 rounded">
                    {selectedCase.address}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}