import { useState, useEffect } from 'react';
import { Search, Eye, FileText, User, MapPin, Fingerprint, Gavel, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Case } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export function PoliceDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const casesQuery = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(casesQuery);
      const casesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Case[];
      setCases(casesData);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsViewDialogOpen(true);
  };

  const filteredCases = cases.filter(c =>
    c.caseNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.aadharNo?.includes(searchTerm) ||
    c.crimeType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Case['status']) => {
    switch (status) {
      case 'Open': return 'bg-blue-500';
      case 'Under Investigation': return 'bg-yellow-500';
      case 'In Court': return 'bg-orange-500';
      case 'Closed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-white text-center">Loading cases...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-2xl mb-1">Case Lookup</h2>
        <p className="text-slate-400">Search and view case records (Read-Only Access)</p>
      </div>

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Search Cases</CardTitle>
          <CardDescription className="text-slate-400">
            Search by case number, name, Aadhar number, or crime type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Enter case number, name, Aadhar number, or crime type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-slate-900 border-slate-600 text-white h-12"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Case Records</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredCases.length} case(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Case No</TableHead>
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Aadhar No</TableHead>
                  <TableHead className="text-slate-300">Crime Type</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-white">{caseItem.caseNo}</TableCell>
                    <TableCell className="text-white">{caseItem.name}</TableCell>
                    <TableCell className="text-slate-300">{caseItem.aadharNo}</TableCell>
                    <TableCell className="text-slate-300">{caseItem.crimeType}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleViewCase(caseItem)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <FileText className="w-5 h-5 mr-2" />
              Case Details - {selectedCase?.caseNo}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete case information (Read-Only)
            </DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedCase.status)}>
                  {selectedCase.status}
                </Badge>
              </div>

              <Separator className="bg-slate-700" />

              {/* Photo Section */}
              {selectedCase.photoBase64 && (
                <>
                  <div>
                    <h3 className="flex items-center text-slate-200 mb-4">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Subject Photo
                    </h3>
                    <div className="flex justify-center">
                      <div className="relative">
                        <img
                          src={selectedCase.photoBase64}
                          alt={`Photo of ${selectedCase.name}`}
                          className="w-48 h-48 object-cover rounded-lg border-2 border-slate-600 shadow-lg"
                        />
                        <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-300">
                          Subject Photo
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-slate-700" />
                </>
              )}

              <div>
                <h3 className="flex items-center text-slate-200 mb-4">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Name</Label>
                    <p className="text-white mt-1">{selectedCase.name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Age</Label>
                    <p className="text-white mt-1">{selectedCase.age} years</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Father's Name</Label>
                    <p className="text-white mt-1">{selectedCase.fatherName}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Mother's Name</Label>
                    <p className="text-white mt-1">{selectedCase.motherName}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-400">Aadhar Number</Label>
                    <p className="text-white mt-1">{selectedCase.aadharNo}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-400 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Address
                    </Label>
                    <p className="text-white mt-1">{selectedCase.address}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div>
                <h3 className="text-slate-200 mb-4">Case Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Case Number</Label>
                    <p className="text-white mt-1">{selectedCase.caseNo}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Officer Name</Label>
                    <p className="text-white mt-1">{selectedCase.officerName}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Crime Type</Label>
                    <p className="text-white mt-1">{selectedCase.crimeType}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Crime Details</Label>
                    <p className="text-white mt-1 bg-slate-900/50 p-3 rounded border border-slate-700">
                      {selectedCase.crimeDetails}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div>
                <h3 className="flex items-center text-slate-200 mb-4">
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Biometric Information
                </h3>
                <div>
                  <Label className="text-slate-400">Finger Demographic Details</Label>
                  <p className="text-white mt-1 bg-slate-900/50 p-3 rounded border border-slate-700">
                    {selectedCase.fingerDemographicDetails}
                  </p>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div>
                <h3 className="flex items-center text-slate-200 mb-4">
                  <Gavel className="w-4 h-4 mr-2" />
                  Court Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Judge's Name</Label>
                    <p className="text-white mt-1">{selectedCase.judgeName}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Court Judgement</Label>
                    <p className="text-white mt-1 bg-slate-900/50 p-3 rounded border border-slate-700">
                      {selectedCase.courtJudgement}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <Label className="text-slate-400">Created</Label>
                  <p className="text-slate-300 mt-1">
                    {new Date(selectedCase.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-400">Last Updated</Label>
                  <p className="text-slate-300 mt-1">
                    {new Date(selectedCase.updatedAt).toLocaleDateString()}
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