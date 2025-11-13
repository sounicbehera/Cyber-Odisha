import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Case } from '../types';
import { db } from '../firebaseConfig';
import {
  collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';

// Helper to convert Firestore doc to Case
const docToCase = (d: any): Case => ({
  id: d.id,
  caseNo: d.data().caseNo || '',
  name: d.data().name || '',
  age: d.data().age || 0,
  address: d.data().address || '',
  fatherName: d.data().fatherName || '',
  motherName: d.data().motherName || '',
  aadharNo: d.data().aadharNo || '',
  officerName: d.data().officerName || '',
  crimeType: d.data().crimeType || '',
  crimeDetails: d.data().crimeDetails || '',
  fingerDemographicDetails: d.data().fingerDemographicDetails || '',
  courtJudgement: d.data().courtJudgement || 'Pending',
  judgeName: d.data().judgeName || '',
  status: d.data().status || 'Open',
  photoBase64: d.data().photoBase64 || '',
  createdAt: d.data().createdAt?.toDate() || new Date(),
  updatedAt: d.data().updatedAt?.toDate() || new Date(),
});

export function ClerkDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [formData, setFormData] = useState<Partial<Case>>({
    status: 'Open'
  });

  // Fetch cases from Firebase (real-time)
  useEffect(() => {
    const q = query(collection(db, 'cases'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedCases = snapshot.docs.map(docToCase);
      setCases(fetchedCases);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching cases:', error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    
    if (!file) {
      setPhotoPreview('');
      setFormData({ ...formData, photoBase64: '' });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file');
      e.target.value = '';
      return;
    }

    // Check file size (150KB = 153600 bytes)
    if (file.size > 153600) {
      setPhotoError('Photo size must not exceed 150KB');
      e.target.value = '';
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
      setFormData({ ...formData, photoBase64: base64String });
    };
    reader.onerror = () => {
      setPhotoError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        caseNo: formData.caseNo || '',
        name: formData.name || '',
        age: formData.age || 0,
        address: formData.address || '',
        fatherName: formData.fatherName || '',
        motherName: formData.motherName || '',
        aadharNo: formData.aadharNo || '',
        officerName: formData.officerName || '',
        crimeType: formData.crimeType || '',
        crimeDetails: formData.crimeDetails || '',
        fingerDemographicDetails: formData.fingerDemographicDetails || '',
        courtJudgement: formData.courtJudgement || 'Pending',
        judgeName: formData.judgeName || '',
        status: formData.status as Case['status'] || 'Open',
        photoBase64: formData.photoBase64 || '',
        updatedAt: serverTimestamp(),
      };

      if (editingCase) {
        // Update existing case in Firebase
        await updateDoc(doc(db, 'cases', editingCase.id), payload);
        setEditingCase(null);
      } else {
        // Add new case to Firebase
        await addDoc(collection(db, 'cases'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      
      setFormData({ status: 'Open' });
      setPhotoPreview('');
      setPhotoError('');
      setIsAddingCase(false);
    } catch (error) {
      console.error('Error saving case:', error);
      alert('Failed to save case. Check console for details.');
    }
  };

  const handleEdit = (caseItem: Case) => {
    setEditingCase(caseItem);
    setFormData(caseItem);
    setPhotoPreview(caseItem.photoBase64 || '');
    setPhotoError('');
    setIsAddingCase(true);
  };

  const handleCancel = () => {
    setIsAddingCase(false);
    setEditingCase(null);
    setFormData({ status: 'Open' });
    setPhotoPreview('');
    setPhotoError('');
  };

  const filteredCases = cases.filter(c =>
    c.caseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.crimeType.toLowerCase().includes(searchTerm.toLowerCase())
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
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading cases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl mb-1">Case Management</h2>
          <p className="text-slate-400">Add, edit, and manage case records</p>
        </div>
        <Button onClick={() => setIsAddingCase(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Case
        </Button>
      </div>

      {isAddingCase && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              {editingCase ? 'Edit Case' : 'Add New Case'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {editingCase ? 'Update case information' : 'Enter complete case details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caseNo" className="text-slate-200">Case Number *</Label>
                  <Input
                    id="caseNo"
                    required
                    value={formData.caseNo || ''}
                    onChange={(e) => setFormData({ ...formData, caseNo: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                    placeholder="CR-2024-XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-slate-200">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    required
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadharNo" className="text-slate-200">Aadhar Number (12 digits) *</Label>
                  <Input
                    id="aadharNo"
                    required
                    maxLength={12}
                    pattern="[0-9]{12}"
                    value={formData.aadharNo || ''}
                    onChange={(e) => setFormData({ ...formData, aadharNo: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                    placeholder="123456789012"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherName" className="text-slate-200">Father's Name *</Label>
                  <Input
                    id="fatherName"
                    required
                    value={formData.fatherName || ''}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherName" className="text-slate-200">Mother's Name *</Label>
                  <Input
                    id="motherName"
                    required
                    value={formData.motherName || ''}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="photo" className="text-slate-200 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Photo Upload (Max 150KB)
                </Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="bg-slate-900 border-slate-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Supported formats: JPG, PNG, GIF (Max: 150KB)
                    </p>
                    {photoError && (
                      <p className="text-xs text-red-400 mt-1">{photoError}</p>
                    )}
                  </div>
                  {photoPreview && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded border-2 border-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview('');
                          setFormData({ ...formData, photoBase64: '' });
                          const input = document.getElementById('photo') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-200">Address *</Label>
                <Textarea
                  id="address"
                  required
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="officerName" className="text-slate-200">Officer Name *</Label>
                  <Input
                    id="officerName"
                    required
                    value={formData.officerName || ''}
                    onChange={(e) => setFormData({ ...formData, officerName: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crimeType" className="text-slate-200">Crime Type *</Label>
                  <Input
                    id="crimeType"
                    required
                    value={formData.crimeType || ''}
                    onChange={(e) => setFormData({ ...formData, crimeType: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                    placeholder="e.g., Cyber Fraud, Identity Theft"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crimeDetails" className="text-slate-200">Crime Details *</Label>
                <Textarea
                  id="crimeDetails"
                  required
                  value={formData.crimeDetails || ''}
                  onChange={(e) => setFormData({ ...formData, crimeDetails: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fingerDemographicDetails" className="text-slate-200">Finger Demographic Details *</Label>
                <Textarea
                  id="fingerDemographicDetails"
                  required
                  value={formData.fingerDemographicDetails || ''}
                  onChange={(e) => setFormData({ ...formData, fingerDemographicDetails: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white"
                  rows={2}
                  placeholder="e.g., Right thumb print - Loop pattern, 12 ridge characteristics"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="judgeName" className="text-slate-200">Judge's Name *</Label>
                  <Input
                    id="judgeName"
                    required
                    value={formData.judgeName || ''}
                    onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-200">Case Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Case['status'] })}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600 text-white">
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                      <SelectItem value="In Court">In Court</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courtJudgement" className="text-slate-200">Court Judgement</Label>
                <Textarea
                  id="courtJudgement"
                  value={formData.courtJudgement || ''}
                  onChange={(e) => setFormData({ ...formData, courtJudgement: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white"
                  rows={2}
                  placeholder="Pending or enter judgement details"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {editingCase ? 'Update Case' : 'Save Case'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">All Cases</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Case No</TableHead>
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Crime Type</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Officer</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-white">{caseItem.caseNo}</TableCell>
                    <TableCell className="text-white">{caseItem.name}</TableCell>
                    <TableCell className="text-slate-300">{caseItem.crimeType}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{caseItem.officerName}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(caseItem)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}